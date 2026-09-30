"use server";

import { createClient } from "@/lib/supabase/server";
import { getPublicBusiness } from "@/lib/public/business";
import {
  calculateAvailableSlots,
  getAvailableDates,
  type AvailableSlot,
} from "@/lib/booking/availability";
import { budapestDateTimeToUtc } from "@/lib/utils/dates";

export type PublicBookingInput = {
  businessSlug?: string;
  barberId: string;
  serviceId: string;
  dateStr: string; // YYYY-MM-DD (Budapest)
  startTimeStr: string; // HH:MM (Budapest)
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  notes?: string | null;
};

export async function fetchAvailableSlotsAction(
  barberId: string,
  serviceId: string,
  dateStr: string
): Promise<{ slots: AvailableSlot[]; error?: string }> {
  if (!barberId || !serviceId || !dateStr) {
    return { slots: [] };
  }

  const business = await getPublicBusiness("barbod-barber");
  if (!business) {
    return { slots: [], error: "Business not found." };
  }

  const slots = await calculateAvailableSlots({
    businessId: business.id,
    barberId,
    serviceId,
    dateStr,
  });

  return { slots };
}

export async function fetchAvailableDatesAction(
  barberId: string,
  serviceId: string
): Promise<{ dates: string[]; error?: string }> {
  if (!barberId || !serviceId) {
    return { dates: [] };
  }

  const business = await getPublicBusiness("barbod-barber");
  if (!business) {
    return { dates: [], error: "Business not found." };
  }

  const dates = await getAvailableDates(business.id, barberId, serviceId, 30);
  return { dates };
}

export async function createPublicBookingAction(data: PublicBookingInput) {
  const slug = data.businessSlug || "barbod-barber";
  const business = await getPublicBusiness(slug);

  if (!business) {
    return { error: "Business not found.", errorCode: "GENERIC" };
  }

  if (!data.customerName?.trim()) {
    return { error: "Full name is required.", errorCode: "REQUIRED_FIELDS" };
  }
  if (!data.customerPhone?.trim()) {
    return { error: "Phone number is required.", errorCode: "REQUIRED_FIELDS" };
  }
  if (!data.barberId || !data.serviceId || !data.dateStr || !data.startTimeStr) {
    return { error: "Barber, service, date, and time slot are required.", errorCode: "REQUIRED_FIELDS" };
  }

  const supabase = await createClient();

  // 1. Validate barber exists, belongs to business, is active
  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, name, is_active")
    .eq("id", data.barberId)
    .eq("business_id", business.id)
    .single();

  if (barErr || !barber || !barber.is_active) {
    return { error: "Selected barber is unavailable.", errorCode: "SERVICE_UNAVAILABLE" };
  }

  // 2. Validate service belongs to business & is active
  const { data: service, error: svcError } = await supabase
    .from("services")
    .select("*")
    .eq("id", data.serviceId)
    .eq("business_id", business.id)
    .eq("is_active", true)
    .single();

  if (svcError || !service) {
    return { error: "Selected service is not active or available.", errorCode: "SERVICE_UNAVAILABLE" };
  }

  // 3. Validate barber offers service
  const { data: assignment } = await supabase
    .from("barber_services")
    .select("barber_id")
    .eq("barber_id", data.barberId)
    .eq("service_id", data.serviceId)
    .maybeSingle();

  if (!assignment) {
    return { error: "Selected barber does not offer this service.", errorCode: "SERVICE_UNAVAILABLE" };
  }

  // 4. Derive start and end UTC timestamps server-side
  const startUtc = budapestDateTimeToUtc(data.dateStr, data.startTimeStr);
  const endUtc = new Date(
    startUtc.getTime() + service.duration_minutes * 60 * 1000
  );

  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  // 5. Re-verify real-time availability server-side right before insert
  const now = new Date();
  if (startUtc.getTime() <= now.getTime()) {
    return { error: "Cannot book an appointment in the past.", errorCode: "PAST_DATE" };
  }

  // Check occupied intervals for this barber via SECURITY DEFINER RPC
  const { data: occupied, error: rpcErr } = await supabase.rpc(
    "get_occupied_intervals",
    {
      p_barber_id: data.barberId,
      p_start_at: startIso,
      p_end_at: endIso,
    }
  );

  if (rpcErr) {
    console.error("RPC re-check error", rpcErr.message);
  }

  if (occupied && occupied.length > 0) {
    return { error: "This time is no longer available with this barber. Please choose another time.", errorCode: "SLOT_UNAVAILABLE" };
  }

  // 6. Insert public appointment with status = 'pending'
  const { data: inserted, error: insertError } = await supabase
    .from("appointments")
    .insert({
      business_id: business.id,
      barber_id: barber.id,
      service_id: service.id,
      customer_name: data.customerName.trim(),
      customer_phone: data.customerPhone.trim(),
      customer_email: data.customerEmail?.trim() || null,
      notes: data.notes?.trim() || null,
      start_at: startIso,
      end_at: endIso,
      status: "pending",
    })
    .select("id, start_at, end_at, status, customer_name")
    .single();

  if (insertError) {
    console.error("Public booking insert failed", insertError.message);
    if (insertError.message.includes("appointments_no_overlap")) {
      return { error: "This time is no longer available with this barber. Please choose another time.", errorCode: "SLOT_UNAVAILABLE" };
    }
    return { error: "An error occurred while creating your booking. Please try again.", errorCode: "GENERIC" };
  }

  return {
    success: true,
    booking: {
      id: inserted.id,
      barberName: barber.name,
      serviceNameEn: service.name_en,
      serviceNameHu: service.name_hu,
      durationMinutes: service.duration_minutes,
      price: service.price,
      currency: service.currency,
      dateStr: data.dateStr,
      startTimeStr: data.startTimeStr,
      customerName: inserted.customer_name,
      status: inserted.status,
    },
  };
}
