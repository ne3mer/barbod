if (typeof window !== 'undefined') {
  throw new Error('This module can only be executed on the server.');
}
import { getResendClient, getEmailFromAddress, getEmailReplyToAddress } from './resend';
import type {
  NotificationType,
  EmailLocale,
  BaseAppointmentEmailData,
  AppointmentRescheduledEmailData,
  BarberDailyDigestEmailData,
} from './types';
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
} from './templates';

export interface SendEmailOptions {
  to: string;
  type: NotificationType;
  locale?: EmailLocale;
  payload: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Core server-side email sender function.
 */
export async function sendNotificationEmail({
  to,
  type,
  locale = 'hu',
  payload,
}: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[Email Dispatcher] Skipped sending '${type}' to ${to} (RESEND_API_KEY missing)`);
    return {
      success: true,
      messageId: `dev-mock-${Date.now()}`,
    };
  }

  let emailContent: { subject: string; html: string };

  try {
    switch (type) {
      case 'appointment_booked':
        emailContent = renderAppointmentBookedEmail(payload as unknown as BaseAppointmentEmailData, locale);
        break;
      case 'appointment_confirmed':
        emailContent = renderAppointmentConfirmedEmail(payload as unknown as BaseAppointmentEmailData, locale);
        break;
      case 'appointment_cancelled':
        emailContent = renderAppointmentCancelledEmail(payload as unknown as BaseAppointmentEmailData, locale);
        break;
      case 'appointment_rescheduled':
        emailContent = renderAppointmentRescheduledEmail(payload as unknown as AppointmentRescheduledEmailData, locale);
        break;
      case 'customer_reminder_24h':
        emailContent = renderCustomerReminderEmail(payload as unknown as BaseAppointmentEmailData, '24h', locale);
        break;
      case 'customer_reminder_2h':
        emailContent = renderCustomerReminderEmail(payload as unknown as BaseAppointmentEmailData, '2h', locale);
        break;
      case 'barber_new_appointment':
        emailContent = renderBarberNewAppointmentEmail(payload as unknown as BaseAppointmentEmailData, locale);
        break;
      case 'barber_cancellation':
        emailContent = renderBarberCancellationEmail(payload as unknown as BaseAppointmentEmailData, locale);
        break;
      case 'barber_reschedule':
        emailContent = renderBarberRescheduleEmail(payload as unknown as AppointmentRescheduledEmailData, locale);
        break;
      case 'barber_daily_digest':
        emailContent = renderBarberDailyDigestEmail(payload as unknown as BarberDailyDigestEmailData, locale);
        break;
      default:
        return { success: false, error: `Unsupported notification type: ${type}` };
    }

    const from = getEmailFromAddress();
    const replyTo = getEmailReplyToAddress();

    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error(`[Resend Error] Failed to send ${type} to ${to}:`, error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown email dispatch error';
    console.error(`[Email Dispatcher Exception] ${type} to ${to}:`, err);
    return { success: false, error: errorMsg };
  }
}

