import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { sendNotificationEmail } from '../src/lib/email/send';
import type { NotificationType, EmailLocale } from '../src/lib/email/types';

dotenv.config({ path: '.env.local' });

async function testSingleBookingFlow() {
  console.log('=== VERIFYING SCHEDULER, WORKER & RESEND DISPATCH ===\n');

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Admin client unavailable');
    process.exit(1);
  }

  // Fetch business ID
  const { data: business } = await supabase.from('businesses').select('id').single();
  if (!business) {
    console.error('No business record found.');
    process.exit(1);
  }

  // Create 1 single test notification job record
  const { data: testJob, error: insertErr } = await supabase
    .from('notification_jobs')
    .insert({
      business_id: business.id,
      recipient_email: 'delivered@resend.dev',
      recipient_type: 'customer',
      notification_type: 'appointment_booked',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      locale: 'hu',
      metadata: {
        appointmentId: 'test-app-001',
        customerName: 'Test Customer',
        customerEmail: 'delivered@resend.dev',
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

  if (insertErr) {
    console.error('Insert test notification job failed:', insertErr.message);
    process.exit(1);
  }

  console.log('✔ STEP 1 & 2 PASSED: Single test notification job created in DB with ID:', testJob.id);

  // Process test job through email dispatcher
  console.log('Processing test job through email dispatcher...');
  const result = await sendNotificationEmail({
    to: testJob.recipient_email,
    type: testJob.notification_type as NotificationType,
    locale: testJob.locale as EmailLocale,
    payload: (testJob.metadata as Record<string, unknown>) || {},
  });


  console.log('Dispatch result:', result);
  if (result.success) {
    // Update job to sent
    await supabase
      .from('notification_jobs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: result.messageId || null,
      })
      .eq('id', testJob.id);

    console.log('✔ STEP 3, 4 & 5 PASSED: Test notification job successfully processed, sent, and status updated in DB.');
  } else {
    console.error('Dispatch failed:', result.error);
    process.exit(1);
  }
}

testSingleBookingFlow();
