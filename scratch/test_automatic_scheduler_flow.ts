import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { scheduleBookingNotifications, scheduleConfirmationNotification, scheduleCancellationNotifications } from '../src/lib/email/scheduler';
import { processDueNotificationJobs } from '../src/lib/email/worker';

dotenv.config({ path: '.env.local' });

async function runAutomaticTests() {
  console.log('=== VERIFYING AUTOMATIC SCHEDULER & WORKER END-TO-END ===\n');

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Admin client unavailable');
    process.exit(1);
  }

  // Fetch business and barber
  const { data: business } = await supabase.from('businesses').select('id').single();
  const { data: barber } = await supabase.from('barbers').select('id').limit(1).single();
  const { data: service } = await supabase.from('services').select('id, duration_minutes').limit(1).single();


  if (!business || !barber || !service) {
    console.error('Required business/barber/service missing.');
    process.exit(1);
  }

  const testEmail = 'ne3mer@gmail.com';
  const now = new Date();

  const futureStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h in future
  const durationMs = (service.duration_minutes || 30) * 60 * 1000;
  const futureEnd = new Date(futureStart.getTime() + durationMs);

  // 1. Create test appointment in DB
  const { data: appointment, error: appErr } = await supabase
    .from('appointments')
    .insert({
      business_id: business.id,
      barber_id: barber.id,
      service_id: service.id,
      customer_name: 'Automated Test Customer',
      customer_phone: '+36209999999',
      customer_email: testEmail,
      start_at: futureStart.toISOString(),
      end_at: futureEnd.toISOString(),
      status: 'pending',
    })
    .select('*')
    .single();


  if (appErr || !appointment) {
    console.error('Failed to create test appointment:', appErr?.message);
    process.exit(1);
  }

  console.log('Created test appointment ID:', appointment.id);

  // TEST 1: Schedule booking notifications
  console.log('\n--- TEST 1: Automatic Booking Notifications ---');
  await scheduleBookingNotifications(appointment.id, supabase);

  // Check job statuses right after scheduling (immediate worker runs automatically)
  const { data: jobs1 } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('appointment_id', appointment.id);

  const bookedJob = jobs1?.find((j) => j.notification_type === 'appointment_booked');
  const reminder24h = jobs1?.find((j) => j.notification_type === 'customer_reminder_24h');

  console.log('Booked Job Status:', bookedJob?.status, '(Expected: sent)');
  console.log('24h Reminder Job Status:', reminder24h?.status, '(Expected: pending)');

  if (bookedJob?.status === 'sent' && reminder24h?.status === 'pending') {
    console.log('✔ TEST 1 PASSED: Booking email sent automatically, reminder pending for future.');
  } else {
    console.error('❌ TEST 1 FAILED: Expected booked=sent, reminder=pending');
  }

  // TEST 2: Confirm Appointment
  console.log('\n--- TEST 2: Automatic Confirmation Email ---');
  await scheduleConfirmationNotification(appointment.id, supabase);

  const { data: jobs2 } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('appointment_id', appointment.id)
    .eq('notification_type', 'appointment_confirmed');

  console.log('Confirmed Job Status:', jobs2?.[0]?.status, '(Expected: sent)');
  if (jobs2?.[0]?.status === 'sent') {
    console.log('✔ TEST 2 PASSED: Confirmation email sent automatically.');
  } else {
    console.error('❌ TEST 2 FAILED: Confirmation email status is not sent.');
  }

  // TEST 3: Cancel Appointment
  console.log('\n--- TEST 3: Automatic Cancellation Email & Reminder Suppression ---');
  await scheduleCancellationNotifications(appointment.id, supabase);

  const { data: jobs3 } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('appointment_id', appointment.id);

  const cancelJob = jobs3?.find((j) => j.notification_type === 'appointment_cancelled');
  const cancelledReminder = jobs3?.find((j) => j.notification_type === 'customer_reminder_24h');

  console.log('Cancelled Job Status:', cancelJob?.status, '(Expected: sent)');
  console.log('Reminder Status after Cancellation:', cancelledReminder?.status, '(Expected: cancelled)');

  if (cancelJob?.status === 'sent' && cancelledReminder?.status === 'cancelled') {
    console.log('✔ TEST 3 PASSED: Cancellation email sent, future reminders cancelled.');
  } else {
    console.error('❌ TEST 3 FAILED');
  }

  // TEST 4 & 5: Idempotency & Duplicate Prevention
  console.log('\n--- TEST 4 & 5: Idempotency & Duplicate Prevention ---');
  const initialSentCount = (jobs3 || []).filter((j) => j.status === 'sent').length;

  // Run worker again on existing jobs
  await processDueNotificationJobs(20);

  const { data: jobs5 } = await supabase
    .from('notification_jobs')
    .select('*')
    .eq('appointment_id', appointment.id);

  const finalSentCount = (jobs5 || []).filter((j) => j.status === 'sent').length;
  console.log('Initial Sent Count:', initialSentCount, '| Final Sent Count after re-run:', finalSentCount);

  if (initialSentCount === finalSentCount) {
    console.log('✔ TEST 4 & 5 PASSED: Idempotency verified. No duplicate emails sent on second worker run.');
  } else {
    console.error('❌ TEST 4 & 5 FAILED: Duplicate email sent.');
  }

  // Clean up test appointment & jobs
  await supabase.from('notification_jobs').delete().eq('appointment_id', appointment.id);
  await supabase.from('appointments').delete().eq('id', appointment.id);
  console.log('\nCleaned up test records.');
}

runAutomaticTests();
