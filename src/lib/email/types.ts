export type NotificationType =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'customer_reminder_24h'
  | 'customer_reminder_2h'
  | 'barber_new_appointment'
  | 'barber_cancellation'
  | 'barber_reschedule'
  | 'barber_daily_digest';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export type RecipientType = 'customer' | 'barber' | 'owner';

export type EmailLocale = 'en' | 'hu';

export interface BaseAppointmentEmailData {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  serviceNameHu?: string;
  barberName: string;
  dateStr: string; // e.g., "2026. október 10." or "October 10, 2026"
  timeStr: string; // e.g., "14:30"
  durationMinutes: number;
  studioName: string;
  studioAddress?: string;
  studioPhone?: string;
  note?: string;
  status?: string;
}

export interface AppointmentRescheduledEmailData extends BaseAppointmentEmailData {
  previousDateStr: string;
  previousTimeStr: string;
}

export interface DailyDigestAppointmentItem {
  timeStr: string;
  customerName: string;
  serviceName: string;
  durationMinutes: number;
}

export interface BarberDailyDigestEmailData {
  barberName: string;
  barberEmail: string;
  dateStr: string;
  totalAppointments: number;
  appointments: DailyDigestAppointmentItem[];
  studioName: string;
}

export interface NotificationJobRow {
  id: string;
  appointment_id: string | null;
  barber_id: string | null;
  business_id: string;
  recipient_email: string;
  recipient_type: RecipientType;
  notification_type: NotificationType;
  scheduled_for: string;
  status: NotificationStatus;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  provider_message_id: string | null;
  locale: EmailLocale;
  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}
