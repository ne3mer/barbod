import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  renderAppointmentBookedEmail,
  renderAppointmentConfirmedEmail,
  renderAppointmentCancelledEmail,
  renderAppointmentRescheduledEmail,
  renderCustomerReminderEmail,
  renderBarberNewAppointmentEmail,
  renderBarberCancellationEmail,
  renderBarberRescheduleEmail,
  renderBarberDailyDigestEmail,
} from '../src/lib/email/templates';
import { utcToBudapestParts, budapestDateTimeToUtc } from '../src/lib/utils/dates';
import { sendNotificationEmail } from '../src/lib/email/send';

async function runTests() {
  console.log('=== STARTING NOTIFICATION ENGINE AUTOMATED TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // TEST 1: Template Rendering & EN/HU Localization
  const mockBasePayload = {
    appointmentId: 'app-123',
    customerName: 'Kovács Péter',
    customerEmail: 'peter@example.com',
    customerPhone: '+36201234567',
    serviceName: 'Hajvágás & Szakáll',
    barberName: 'Barbod Master',
    dateStr: '2026. október 10.',
    timeStr: '15:00',
    durationMinutes: 45,
    studioName: 'Barbod Barber Studio',
    studioAddress: 'Andrássy út 12, Budapest',
  };

  const huBooked = renderAppointmentBookedEmail(mockBasePayload, 'hu');
  assert(huBooked.subject.includes('foglalás') && (huBooked.html.includes('Köszönjük') || huBooked.html.includes('foglalás')), 'Customer Booked Email Template (HU)');

  const enBooked = renderAppointmentBookedEmail(mockBasePayload, 'en');
  assert(enBooked.subject.includes('Booked') && enBooked.html.includes('Thank you'), 'Customer Booked Email Template (EN)');

  const huConfirmed = renderAppointmentConfirmedEmail(mockBasePayload, 'hu');
  assert(huConfirmed.html.includes('Megerősítve'), 'Appointment Confirmed Template (HU)');

  const huCancelled = renderAppointmentCancelledEmail(mockBasePayload, 'hu');
  assert(huCancelled.html.includes('Törölve'), 'Appointment Cancelled Template (HU)');

  const huRescheduled = renderAppointmentRescheduledEmail({
    ...mockBasePayload,
    previousDateStr: '2026. október 9.',
    previousTimeStr: '14:00',
  }, 'hu');
  assert(huRescheduled.html.includes('Korábbi időpont') && huRescheduled.html.includes('Új időpont'), 'Appointment Rescheduled Template (HU)');

  const huReminder24 = renderCustomerReminderEmail(mockBasePayload, '24h', 'hu');
  assert(huReminder24.html.includes('24 óra'), '24h Reminder Template (HU)');

  const huReminder2 = renderCustomerReminderEmail(mockBasePayload, '2h', 'hu');
  assert(huReminder2.html.includes('2 óra'), '2h Reminder Template (HU)');

  const barberNew = renderBarberNewAppointmentEmail(mockBasePayload, 'hu');
  assert(barberNew.subject.includes('[Új foglalás]'), 'Barber New Appointment Template');

  const barberCancel = renderBarberCancellationEmail(mockBasePayload, 'hu');
  assert(barberCancel.subject.includes('[Törölve]'), 'Barber Cancellation Template');

  const barberResched = renderBarberRescheduleEmail({
    ...mockBasePayload,
    previousDateStr: '2026. október 9.',
    previousTimeStr: '14:00',
  }, 'hu');
  assert(barberResched.subject.includes('[Módosítva]'), 'Barber Reschedule Template');

  const barberDigest = renderBarberDailyDigestEmail({
    barberName: 'Barbod Master',
    barberEmail: 'delivered@resend.dev',
    dateStr: '2026. október 10.',
    totalAppointments: 2,
    appointments: [
      { timeStr: '10:00', customerName: 'Nagy János', serviceName: 'Hajvágás', durationMinutes: 30 },
      { timeStr: '11:30', customerName: 'Szabó Tamás', serviceName: 'Szakáll igazítás', durationMinutes: 30 },
    ],
    studioName: 'Barbod Barber',
  }, 'hu');
  assert(barberDigest.html.includes('Jó reggelt') && barberDigest.html.includes('Nagy János'), 'Barber Daily Digest Template');

  // TEST 2: Timezone Handling (Europe/Budapest & DST)
  const utcDate = budapestDateTimeToUtc('2026-10-10', '15:00');
  const parts = utcToBudapestParts(utcDate);
  assert(parts.dateStr === '2026-10-10' && parts.timeStr === '15:00', 'Europe/Budapest Date/Time Conversion round-trip');

  // TEST 3: Email Dispatcher Dev Safeguard
  const dispatchRes = await sendNotificationEmail({
    to: 'delivered@resend.dev',
    type: 'appointment_booked',
    locale: 'hu',
    payload: mockBasePayload,
  });
  assert(dispatchRes.success === true, 'Email Dispatcher returns success without throwing exceptions');


  console.log(`\n=== TEST SUMMARY: ${passed}/${total} PASSED ===`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
