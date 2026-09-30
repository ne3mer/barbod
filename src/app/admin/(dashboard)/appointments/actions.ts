"use server";

import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  budapestDateTimeToUtc,
  utcToBudapestParts,
  timeStringToMinutes,
} from "@/lib/utils/dates";
import type { AppointmentStatus } from "@/types";

export type AppointmentInput = {
  barber_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  notes?: string | null;
  status?: AppointmentStatus;
};

export async function createAppointmentAction(data: AppointmentInput) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to account." };
  }

  if (!data.barber_id) {
    return { error: "Please select a barber." };
  }
  if (!data.service_id) {
    return { error: "Please select a service." };
  }
  if (!data.customer_name?.trim()) {
    return { error: "Customer name is required." };
  }
  if (!data.customer_phone?.trim()) {
    return { error: "Customer phone is required." };
  }

  const supabase = await createClient();

  // 1. Verify barber belongs to business & is active
  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("*")
    .eq("id", data.barber_id)
    .eq("business_id", business.id)
    .single();

  if (barErr || !barber) {
    return { error: "Invalid barber selected." };
  }

  // 2. Verify service belongs to business
  const { data: service, error: svcError } = await supabase
    .from("services")
    .select("*")
    .eq("id", data.service_id)
    .eq("business_id", business.id)
    .single();

  if (svcError || !service) {
    return { error: "Invalid service selected." };
  }

  // 3. Verify barber offers service
  const { data: assignment } = await supabase
    .from("barber_services")
    .select("barber_id")
    .eq("barber_id", data.barber_id)
    .eq("service_id", data.service_id)
    .maybeSingle();

  if (!assignment) {
    return { error: "Selected barber does not offer this service." };
  }

  // 4. Calculate start and end UTC timestamps
  const startUtc = budapestDateTimeToUtc(data.startDate, data.startTime);
  const endUtc = new Date(
    startUtc.getTime() + service.duration_minutes * 60 * 1000
  );

  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  // 5. Check barber appointment overlaps
  const { data: appOverlaps } = await supabase
    .from("appointments")
    .select("id, customer_name, start_at, end_at")
    .eq("barber_id", data.barber_id)
    .in("status", ["pending", "confirmed"])
    .lt("start_at", endIso)
    .gt("end_at", startIso);

  if (appOverlaps && appOverlaps.length > 0) {
    return {
      error: `Overlapping appointment for ${barber.name}! Conflict with booking for ${appOverlaps[0].customer_name}.`,
    };
  }

  // 6. Check barber blocked times overlaps
  const { data: blockedOverlaps } = await supabase
    .from("blocked_times")
    .select("id, reason")
    .eq("barber_id", data.barber_id)
    .lt("start_at", endIso)
    .gt("end_at", startIso);

  if (blockedOverlaps && blockedOverlaps.length > 0) {
    const reasonText = blockedOverlaps[0].reason
      ? ` (${blockedOverlaps[0].reason})`
      : "";
    return {
      error: `Cannot create appointment during ${barber.name}'s blocked time period${reasonText}.`,
    };
  }

  // 7. Check barber working hours
  const startParts = utcToBudapestParts(startUtc);
  const endParts = utcToBudapestParts(endUtc);

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("barber_id", data.barber_id)
    .eq("day_of_week", startParts.dayOfWeek)
    .eq("is_active", true);

  if (!workingHours || workingHours.length === 0) {
    return { error: `${barber.name} is not scheduled to work on this day.` };
  }

  const appStartMins = timeStringToMinutes(startParts.timeStr);
  const appEndMins = timeStringToMinutes(endParts.timeStr);

  const fitsInSchedule = workingHours.some((wh) => {
    const whStartMins = timeStringToMinutes(wh.start_time);
    const whEndMins = timeStringToMinutes(wh.end_time);
    return appStartMins >= whStartMins && appEndMins <= whEndMins;
  });

  if (!fitsInSchedule) {
    return {
      error: `Appointment duration falls outside ${barber.name}'s working hours for this day.`,
    };
  }

  // 8. Insert appointment with barber_id
  const { error: insertError } = await supabase.from("appointments").insert({
    business_id: business.id,
    barber_id: barber.id,
    service_id: service.id,
    customer_name: data.customer_name.trim(),
    customer_phone: data.customer_phone.trim(),
    customer_email: data.customer_email?.trim() || null,
    notes: data.notes?.trim() || null,
    start_at: startIso,
    end_at: endIso,
    status: data.status || "confirmed",
  });

  if (insertError) {
    console.error("Failed to insert appointment", insertError.message);
    if (insertError.message.includes("appointments_no_overlap")) {
      return { error: `This time slot is already booked for ${barber.name}.` };
    }
    return { error: insertError.message };
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to account." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to update status", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return { success: true };
}

export async function rescheduleAppointmentAction(
  id: string,
  startDate: string,
  startTime: string,
  service_id?: string,
  barber_id?: string
) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to account." };
  }

  const supabase = await createClient();

  const { data: app, error: appErr } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (appErr || !app) {
    return { error: "Appointment not found." };
  }

  const targetBarberId = barber_id || app.barber_id;
  const targetServiceId = service_id || app.service_id;

  const { data: service, error: svcError } = await supabase
    .from("services")
    .select("*")
    .eq("id", targetServiceId)
    .eq("business_id", business.id)
    .single();

  if (svcError || !service) {
    return { error: "Invalid service." };
  }

  const startUtc = budapestDateTimeToUtc(startDate, startTime);
  const endUtc = new Date(
    startUtc.getTime() + service.duration_minutes * 60 * 1000
  );

  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  // Check working hours for target barber
  const startParts = utcToBudapestParts(startUtc);
  const endParts = utcToBudapestParts(endUtc);

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("barber_id", targetBarberId)
    .eq("day_of_week", startParts.dayOfWeek)
    .eq("is_active", true);

  if (!workingHours || workingHours.length === 0) {
    return { error: "Barber is not working on this day." };
  }

  const appStartMins = timeStringToMinutes(startParts.timeStr);
  const appEndMins = timeStringToMinutes(endParts.timeStr);

  const fitsInSchedule = workingHours.some((wh) => {
    const whStartMins = timeStringToMinutes(wh.start_time);
    const whEndMins = timeStringToMinutes(wh.end_time);
    return appStartMins >= whStartMins && appEndMins <= whEndMins;
  });

  if (!fitsInSchedule) {
    return { error: "Appointment duration falls outside barber working hours." };
  }

  // Overlap checks for target barber
  const { data: appOverlaps } = await supabase
    .from("appointments")
    .select("id, customer_name")
    .eq("barber_id", targetBarberId)
    .neq("id", id)
    .in("status", ["pending", "confirmed"])
    .lt("start_at", endIso)
    .gt("end_at", startIso);

  if (appOverlaps && appOverlaps.length > 0) {
    return {
      error: `Time slot overlaps with another appointment for ${appOverlaps[0].customer_name}.`,
    };
  }

  const { data: blockedOverlaps } = await supabase
    .from("blocked_times")
    .select("id, reason")
    .eq("barber_id", targetBarberId)
    .lt("start_at", endIso)
    .gt("end_at", startIso);

  if (blockedOverlaps && blockedOverlaps.length > 0) {
    return { error: "Time slot conflicts with a blocked time period." };
  }

  const { error: updateErr } = await supabase
    .from("appointments")
    .update({
      barber_id: targetBarberId,
      service_id: targetServiceId,
      start_at: startIso,
      end_at: endIso,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (updateErr) {
    console.error("Failed to reschedule", updateErr.message);
    if (updateErr.message.includes("appointments_no_overlap")) {
      return { error: "This time slot is already booked for this barber." };
    }
    return { error: updateErr.message };
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAppointmentAction(id: string) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to account." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to delete appointment", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return { success: true };
}
