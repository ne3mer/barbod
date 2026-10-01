import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { processDueNotificationJobs } from '../src/lib/email/worker';

dotenv.config({ path: '.env.local' });

async function verifyProductionSchedulerArchitecture() {
  console.log('=== VERIFYING PRODUCTION SCHEDULER ARCHITECTURE & WORKER ===\n');

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Admin client unavailable.');
    process.exit(1);
  }

  const { data: business } = await supabase.from('businesses').select('id').single();
  if (!business) {
    console.error('No business record found.');
    process.exit(1);
  }

  const testEmail = 'delivered@resend.dev';
  const nowIso = new Date().toISOString();
  const futureIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours

  // 1. Create a due test job (scheduled_for = now())
  const { data: dueJob, error: dueErr } = await supabase
    .from('notification_jobs')
    .insert({
      business_id: business.id,
      recipient_email: testEmail,
      recipient_type: 'customer',
      notification_type: 'customer_reminder_2h',
      scheduled_for: nowIso,
      status: 'pending',
      locale: 'hu',
      metadata: {
        appointmentId: 'test-app-due',
        customerName: 'Production Due Test',
        customerEmail: testEmail,
        serviceName: 'Hajvágás',
        barberName: 'Barbod Master',
        dateStr: '2026. október 10.',
        timeStr: '15:00',
        durationMinutes: 30,
        studioName: 'Barbod Barber',
      },
    })
    .select('*')
    .single();

  if (dueErr || !dueJob) {
    console.error('Failed to insert due test job:', dueErr?.message);
    process.exit(1);
  }

  // 2. Create a future test job (scheduled_for = +2 hours)
  const { data: futureJob, error: futureErr } = await supabase
    .from('notification_jobs')
    .insert({
      business_id: business.id,
      recipient_email: testEmail,
      recipient_type: 'customer',
      notification_type: 'customer_reminder_24h',
      scheduled_for: futureIso,
      status: 'pending',
      locale: 'hu',
      metadata: {
        appointmentId: 'test-app-future',
        customerName: 'Production Future Test',
        customerEmail: testEmail,
        serviceName: 'Hajvágás',
        barberName: 'Barbod Master',
        dateStr: '2026. október 11.',
        timeStr: '15:00',
        durationMinutes: 30,
        studioName: 'Barbod Barber',
      },
    })
    .select('*')
    .single();

  if (futureErr || !futureJob) {
    console.error('Failed to insert future test job:', futureErr?.message);
    process.exit(1);
  }

  console.log('Inserted due job ID:', dueJob.id, '| Status: pending');
  console.log('Inserted future job ID:', futureJob.id, '| Status: pending');

  // 3. Run production worker mechanism (1st execution)
  console.log('\n--- FIRST WORKER RUN ---');
  const run1Results = await processDueNotificationJobs(20);
  console.log('Worker Run 1 Results:', run1Results);

  // Check database status for dueJob and futureJob
  const { data: dueCheck1 } = await supabase.from('notification_jobs').select('*').eq('id', dueJob.id).single();
  const { data: futureCheck1 } = await supabase.from('notification_jobs').select('*').eq('id', futureJob.id).single();

  console.log('Due Job Status after Run 1:', dueCheck1?.status, '(Expected: sent)');
  console.log('Future Job Status after Run 1:', futureCheck1?.status, '(Expected: pending)');

  const passDue1 = dueCheck1?.status === 'sent';
  const passFuture1 = futureCheck1?.status === 'pending';

  if (passDue1 && passFuture1) {
    console.log('✔ VERIFICATION 1 PASSED: Due job transitioned to sent, future job remains pending!');
  } else {
    console.error('❌ VERIFICATION 1 FAILED');
  }

  // 4. Run production worker mechanism (2nd execution) - Idempotency test
  console.log('\n--- SECOND WORKER RUN (IDEMPOTENCY TEST) ---');
  const run2Results = await processDueNotificationJobs(20);
  console.log('Worker Run 2 Results:', run2Results);

  const { data: dueCheck2 } = await supabase.from('notification_jobs').select('*').eq('id', dueJob.id).single();

  if (run2Results.sent === 0 && dueCheck2?.status === 'sent') {
    console.log('✔ VERIFICATION 2 PASSED: Exactly 1 email sent, no duplicate send on 2nd run!');
  } else {
    console.error('❌ VERIFICATION 2 FAILED: Duplicate send detected!');
  }

  // Clean up test jobs
  await supabase.from('notification_jobs').delete().in('id', [dueJob.id, futureJob.id]);
  console.log('\nCleaned up test jobs.');
}

verifyProductionSchedulerArchitecture();
