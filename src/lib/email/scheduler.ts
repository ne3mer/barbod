if (typeof window !== 'undefined') {
  throw new Error('This module can only be executed on the server.');
}
import { createAdminClient } from '@/lib/supabase/admin';
import { utcToBudapestParts, budapestDateTimeToUtc } from '@/lib/utils/dates';
import type { NotificationType, EmailLocale } from './types';
import type { Database } from '@/types/database';

type NotificationJobInsert = Database['public']['Tables']['notification_jobs']['Insert'];

/**
 * Server-side helper to resolve appointment details with barber, service, and business context.
 */
async function getAppointmentContext(appointmentId: string, customClient?: unknown) {
  const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  if (!supabase) return null;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_at,
      end_at,
      status,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      business_id,
      barber_id,
      service_id,
      barbers (
        id,
        name,
        user_id
      ),
      services (
        id,
        name_en,
        name_hu,
        duration_minutes
      ),
      businesses (
        id,
        name,
        address,
        phone,
        owner_id
      )
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    console.error(`[Scheduler] Failed to fetch appointment context for ${appointmentId}:`, error?.message);
    return null;
  }

  // Resolve Barber Email (check auth user via admin client if user_id linked)
  let barberEmail: string | null = null;
  const rawBarber = Array.isArray(appointment.barbers) ? appointment.barbers[0] : appointment.barbers;
  const rawService = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
  const rawBusiness = Array.isArray(appointment.businesses) ? appointment.businesses[0] : appointment.businesses;

  if (rawBarber?.user_id) {
    const adminSupabase = createAdminClient();
    if (adminSupabase) {
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(rawBarber.user_id);
      if (authUser?.user?.email) {
        barberEmail = authUser.user.email;
      }
    }
  }

  return {
    appointment: {
      ...appointment,
      barbers: rawBarber,
      services: rawService,
      businesses: rawBusiness,
    },
    barberEmail,
  };
}

/**
 * Schedule booking notifications (Customer booked, Barber new appointment, 24h & 2h reminders).
 */
export async function scheduleBookingNotifications(appointmentId: string, customClient?: unknown) {
  try {
    const ctx = await getAppointmentContext(appointmentId, customClient);
    if (!ctx) return;

    const { appointment, barberEmail } = ctx;
    const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
    if (!supabase) return;

    const now = new Date();
    const startAt = new Date(appointment.start_at);
    const locale: EmailLocale = 'hu'; // Default locale

    const parts = utcToBudapestParts(appointment.start_at);

    const basePayload = {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      customerPhone: appointment.customer_phone || undefined,
      serviceName: appointment.services?.name_hu || appointment.services?.name_en || 'Haircut',
      barberName: appointment.barbers?.name || 'Barber',
      dateStr: parts.formattedDate,
      timeStr: parts.formattedTime,
      durationMinutes: appointment.services?.duration_minutes || 30,
      studioName: appointment.businesses?.name || 'Barbod Barber',
      studioAddress: appointment.businesses?.address || undefined,
      note: appointment.notes || undefined,
      status: appointment.status,
    };

    const jobsToInsert: NotificationJobInsert[] = [];



    // 1. Customer Email: Appointment Booked
    if (appointment.customer_email) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: appointment.customer_email,
        recipient_type: 'customer',
        notification_type: 'appointment_booked' as NotificationType,
        scheduled_for: now.toISOString(),
        status: 'pending',
        locale,
        metadata: basePayload,
      });

      // 2. Customer Reminder 24h
      const time24h = new Date(startAt.getTime() - 24 * 60 * 60 * 1000);
      if (time24h.getTime() > now.getTime()) {
        jobsToInsert.push({
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          business_id: appointment.business_id,
          recipient_email: appointment.customer_email,
          recipient_type: 'customer',
          notification_type: 'customer_reminder_24h' as NotificationType,
          scheduled_for: time24h.toISOString(),
          status: 'pending',
          locale,
          metadata: basePayload,
        });
      }

      // 3. Customer Reminder 2h
      const time2h = new Date(startAt.getTime() - 2 * 60 * 60 * 1000);
      if (time2h.getTime() > now.getTime()) {
        jobsToInsert.push({
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          business_id: appointment.business_id,
          recipient_email: appointment.customer_email,
          recipient_type: 'customer',
          notification_type: 'customer_reminder_2h' as NotificationType,
          scheduled_for: time2h.toISOString(),
          status: 'pending',
          locale,
          metadata: basePayload,
        });
      }
    }

    // 4. Barber Notification: New Appointment
    if (barberEmail) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: barberEmail,
        recipient_type: 'barber',
        notification_type: 'barber_new_appointment' as NotificationType,
        scheduled_for: now.toISOString(),
        status: 'pending',
        locale: 'hu',
        metadata: basePayload,
      });
    }

    if (jobsToInsert.length > 0) {
      const { error } = await supabase
        .from('notification_jobs')
        .insert(jobsToInsert);

      if (error && !error.message.includes('duplicate key') && !error.message.includes('unique')) {
        console.error('[Scheduler] Error inserting notification jobs:', error.message);
      }
    }

    // Trigger immediate worker processing for due real-time notifications (non-blocking)
    try {
      const { processDueNotificationJobs } = await import('./worker');
      await processDueNotificationJobs(20);
    } catch (wErr) {
      console.error('[Scheduler] Automatic worker trigger error:', wErr);
    }
  } catch (err: unknown) {
    console.error('[Scheduler Exception] scheduleBookingNotifications:', err);
  }
}

/**
 * Schedule confirmation email when appointment status becomes 'confirmed'.
 */
export async function scheduleConfirmationNotification(appointmentId: string, customClient?: unknown) {
  try {
    const ctx = await getAppointmentContext(appointmentId, customClient);
    if (!ctx) return;

    const { appointment } = ctx;
    if (!appointment.customer_email) return;

    const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
    if (!supabase) return;

    const parts = utcToBudapestParts(appointment.start_at);
    const payload = {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      serviceName: appointment.services?.name_hu || appointment.services?.name_en || 'Haircut',
      barberName: appointment.barbers?.name || 'Barber',
      dateStr: parts.formattedDate,
      timeStr: parts.formattedTime,
      durationMinutes: appointment.services?.duration_minutes || 30,
      studioName: appointment.businesses?.name || 'Barbod Barber',
      studioAddress: appointment.businesses?.address || undefined,
    };

    const { error } = await supabase
      .from('notification_jobs')
      .insert({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: appointment.customer_email,
        recipient_type: 'customer',
        notification_type: 'appointment_confirmed' as NotificationType,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        locale: 'hu',
        metadata: payload,
      });

    if (error && !error.message.includes('duplicate key') && !error.message.includes('unique')) {
      console.error('[Scheduler] Error scheduling confirmation notification:', error.message);
    }

    // Trigger immediate worker processing for confirmation
    try {
      const { processDueNotificationJobs } = await import('./worker');
      await processDueNotificationJobs(20);
    } catch (wErr) {
      console.error('[Scheduler] Automatic worker trigger error:', wErr);
    }
  } catch (err: unknown) {
    console.error('[Scheduler Exception] scheduleConfirmationNotification:', err);
  }
}


/**
 * Cancel future reminders and schedule cancellation notifications when appointment is cancelled.
 */
export async function scheduleCancellationNotifications(appointmentId: string, customClient?: unknown) {
  try {
    const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
    if (!supabase) return;

    // 1. Cancel future pending reminder jobs for this appointment
    await supabase
      .from('notification_jobs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending');

    // 2. Fetch context to send cancellation emails
    const ctx = await getAppointmentContext(appointmentId, customClient);
    if (!ctx) return;

    const { appointment, barberEmail } = ctx;
    const parts = utcToBudapestParts(appointment.start_at);

    const payload = {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      serviceName: appointment.services?.name_hu || appointment.services?.name_en || 'Haircut',
      barberName: appointment.barbers?.name || 'Barber',
      dateStr: parts.formattedDate,
      timeStr: parts.formattedTime,
      studioName: appointment.businesses?.name || 'Barbod Barber',
    };

    const jobsToInsert: NotificationJobInsert[] = [];

    const now = new Date().toISOString();

    if (appointment.customer_email) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: appointment.customer_email,
        recipient_type: 'customer',
        notification_type: 'appointment_cancelled' as NotificationType,
        scheduled_for: now,
        status: 'pending',
        locale: 'hu',
        metadata: payload,
      });
    }

    if (barberEmail) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: barberEmail,
        recipient_type: 'barber',
        notification_type: 'barber_cancellation' as NotificationType,
        scheduled_for: now,
        status: 'pending',
        locale: 'hu',
        metadata: payload,
      });
    }

    if (jobsToInsert.length > 0) {
      const { error } = await supabase
        .from('notification_jobs')
        .insert(jobsToInsert);

      if (error && !error.message.includes('duplicate key') && !error.message.includes('unique')) {
        console.error('[Scheduler] Error inserting cancellation notification jobs:', error.message);
      }
    }

    // Trigger immediate worker processing for cancellation
    try {
      const { processDueNotificationJobs } = await import('./worker');
      await processDueNotificationJobs(20);
    } catch (wErr) {
      console.error('[Scheduler] Automatic worker trigger error:', wErr);
    }
  } catch (err: unknown) {
    console.error('[Scheduler Exception] scheduleCancellationNotifications:', err);
  }
}

/**
 * Handle rescheduling: cancel obsolete reminders, create new reminders and send reschedule emails.
 */
export async function scheduleRescheduleNotifications(
  appointmentId: string,
  oldStartAtIso: string,
  newStartAtIso: string,
  customClient?: unknown
) {
  try {
    const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
    if (!supabase) return;

    // 1. Cancel existing pending reminders for this appointment
    await supabase
      .from('notification_jobs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending')
      .in('notification_type', ['customer_reminder_24h', 'customer_reminder_2h']);

    // 2. Fetch updated appointment context
    const ctx = await getAppointmentContext(appointmentId, customClient);
    if (!ctx) return;

    const { appointment, barberEmail } = ctx;
    const now = new Date();
    const newStartAt = new Date(newStartAtIso);

    const oldParts = utcToBudapestParts(oldStartAtIso);
    const newParts = utcToBudapestParts(newStartAtIso);

    const payload = {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      serviceName: appointment.services?.name_hu || appointment.services?.name_en || 'Haircut',
      barberName: appointment.barbers?.name || 'Barber',
      dateStr: newParts.formattedDate,
      timeStr: newParts.formattedTime,
      previousDateStr: oldParts.formattedDate,
      previousTimeStr: oldParts.formattedTime,
      durationMinutes: appointment.services?.duration_minutes || 30,
      studioName: appointment.businesses?.name || 'Barbod Barber',
      studioAddress: appointment.businesses?.address || undefined,
    };

    const jobsToInsert: NotificationJobInsert[] = [];

    // Customer Reschedule Email
    if (appointment.customer_email) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: appointment.customer_email,
        recipient_type: 'customer',
        notification_type: 'appointment_rescheduled' as NotificationType,
        scheduled_for: now.toISOString(),
        status: 'pending',
        locale: 'hu',
        metadata: payload,
      });

      // New 24h Reminder
      const time24h = new Date(newStartAt.getTime() - 24 * 60 * 60 * 1000);
      if (time24h.getTime() > now.getTime()) {
        jobsToInsert.push({
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          business_id: appointment.business_id,
          recipient_email: appointment.customer_email,
          recipient_type: 'customer',
          notification_type: 'customer_reminder_24h' as NotificationType,
          scheduled_for: time24h.toISOString(),
          status: 'pending',
          locale: 'hu',
          metadata: payload,
        });
      }

      // New 2h Reminder
      const time2h = new Date(newStartAt.getTime() - 2 * 60 * 60 * 1000);
      if (time2h.getTime() > now.getTime()) {
        jobsToInsert.push({
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          business_id: appointment.business_id,
          recipient_email: appointment.customer_email,
          recipient_type: 'customer',
          notification_type: 'customer_reminder_2h' as NotificationType,
          scheduled_for: time2h.toISOString(),
          status: 'pending',
          locale: 'hu',
          metadata: payload,
        });
      }
    }

    // Barber Reschedule Email
    if (barberEmail) {
      jobsToInsert.push({
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        business_id: appointment.business_id,
        recipient_email: barberEmail,
        recipient_type: 'barber',
        notification_type: 'barber_reschedule' as NotificationType,
        scheduled_for: now.toISOString(),
        status: 'pending',
        locale: 'hu',
        metadata: payload,
      });
    }

    if (jobsToInsert.length > 0) {
      const { error } = await supabase
        .from('notification_jobs')
        .insert(jobsToInsert);

      if (error && !error.message.includes('duplicate key') && !error.message.includes('unique')) {
        console.error('[Scheduler] Error inserting reschedule notification jobs:', error.message);
      }
    }

    // Trigger immediate worker processing for reschedule
    try {
      const { processDueNotificationJobs } = await import('./worker');
      await processDueNotificationJobs(20);
    } catch (wErr) {
      console.error('[Scheduler] Automatic worker trigger error:', wErr);
    }
  } catch (err: unknown) {
    console.error('[Scheduler Exception] scheduleRescheduleNotifications:', err);
  }
}


/**
 * Schedule daily barber digest emails for active barbers for a specific date in Europe/Budapest.
 */
export async function scheduleDailyBarberDigests(dateStrBudapest: string, customClient?: unknown) {
  try {
    const supabase = (customClient as ReturnType<typeof createAdminClient>) || createAdminClient();
    if (!supabase) return;

    // Convert dateStrBudapest (YYYY-MM-DD) to start and end UTC bounds
    const startUtc = budapestDateTimeToUtc(dateStrBudapest, '00:00');
    const endUtc = budapestDateTimeToUtc(dateStrBudapest, '23:59');

    // 1. Fetch all appointments on this date
    const { data: appointments, error: appErr } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        customer_name,
        barber_id,
        business_id,
        status,
        barbers (
          id,
          name,
          user_id,
          is_active
        ),
        services (
          name_hu,
          name_en,
          duration_minutes
        ),
        businesses (
          id,
          name
        )
      `)
      .gte('start_at', startUtc.toISOString())
      .lte('start_at', endUtc.toISOString())
      .neq('status', 'cancelled');

    if (appErr || !appointments || appointments.length === 0) {
      return;
    }

    // Group appointments by barber_id
    const barberMap = new Map<string, typeof appointments>();
    for (const app of appointments) {
      const barberObj = Array.isArray(app.barbers) ? app.barbers[0] : app.barbers;
      if (!app.barber_id || !barberObj?.is_active) continue;
      const list = barberMap.get(app.barber_id) || [];
      list.push(app);
      barberMap.set(app.barber_id, list);
    }

    const digestScheduledFor = budapestDateTimeToUtc(dateStrBudapest, '07:00').toISOString();

    for (const [barberId, barberApps] of barberMap.entries()) {
      const barberObj = Array.isArray(barberApps[0].barbers) ? barberApps[0].barbers[0] : barberApps[0].barbers;
      const businessObj = Array.isArray(barberApps[0].businesses) ? barberApps[0].businesses[0] : barberApps[0].businesses;

      let barberEmail: string | null = null;
      if (barberObj?.user_id) {
        const adminSupabase = createAdminClient();
        if (adminSupabase) {
          const { data: authUser } = await adminSupabase.auth.admin.getUserById(barberObj.user_id);
          barberEmail = authUser?.user?.email || null;
        }
      }

      if (!barberEmail) continue;

      // Sort appointments chronologically
      barberApps.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

      const appItems = barberApps.map((a) => {
        const parts = utcToBudapestParts(a.start_at);
        const svcObj = Array.isArray(a.services) ? a.services[0] : a.services;
        return {
          timeStr: parts.formattedTime,
          customerName: a.customer_name,
          serviceName: svcObj?.name_hu || svcObj?.name_en || 'Haircut',
          durationMinutes: svcObj?.duration_minutes || 30,
        };
      });

      const payload = {
        barberName: barberObj?.name || 'Barber',
        barberEmail,
        dateStr: dateStrBudapest,
        totalAppointments: appItems.length,
        appointments: appItems,
        studioName: businessObj?.name || 'Barbod Barber',
      };

      const { error } = await supabase
        .from('notification_jobs')
        .insert({
          barber_id: barberId,
          business_id: barberApps[0].business_id,
          recipient_email: barberEmail,
          recipient_type: 'barber',
          notification_type: 'barber_daily_digest' as NotificationType,
          scheduled_for: digestScheduledFor,
          status: 'pending',
          locale: 'hu',
          metadata: payload,
        });

      if (error && !error.message.includes('duplicate key') && !error.message.includes('unique')) {
        console.error('[Scheduler] Error inserting daily digest job:', error.message);
      }
    }
  } catch (err: unknown) {
    console.error('[Scheduler Exception] scheduleDailyBarberDigests:', err);
  }
}


