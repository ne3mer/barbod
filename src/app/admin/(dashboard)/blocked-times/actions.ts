"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { budapestDateTimeToUtc } from "@/lib/utils/dates";

export type BlockedTimeInput = {
  barber_id?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:MM
  reason?: string;
};

export async function createBlockedTimeAction(data: BlockedTimeInput) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    if (!context.barber) {
      return { error: "Staff barber profile not found." };
    }
    data.barber_id = context.barber.id;
  }

  if (!data.startDate || !data.startTime || !data.endDate || !data.endTime) {
    return { error: "Start date, start time, end date, and end time are required." };
  }

  // Determine barber_id
  let barberId = data.barber_id;
  if (!barberId) {
    const { data: firstBarber } = await supabase
      .from("barbers")
      .select("id")
      .eq("business_id", business.id)
      .limit(1)
      .single();
    barberId = firstBarber?.id;
  }

  if (!barberId) {
    return { error: "No barber found for business." };
  }

  const startUtc = budapestDateTimeToUtc(data.startDate, data.startTime);
  const endUtc = budapestDateTimeToUtc(data.endDate, data.endTime);

  if (startUtc >= endUtc) {
    return { error: "Start date/time must be strictly earlier than end date/time." };
  }

  const { error } = await supabase.from("blocked_times").insert({
    business_id: business.id,
    barber_id: barberId,
    start_at: startUtc.toISOString(),
    end_at: endUtc.toISOString(),
    reason: data.reason?.trim() || null,
  });

  if (error) {
    console.error("Failed to create blocked time", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/blocked-times");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateBlockedTimeAction(
  id: string,
  data: BlockedTimeInput
) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    const { data: targetBt } = await supabase
      .from("blocked_times")
      .select("barber_id")
      .eq("id", id)
      .single();

    if (!targetBt || targetBt.barber_id !== context.barber?.id) {
      return { error: "Unauthorized: You can only edit your own blocked times." };
    }
    data.barber_id = context.barber.id;
  }

  const startUtc = budapestDateTimeToUtc(data.startDate, data.startTime);
  const endUtc = budapestDateTimeToUtc(data.endDate, data.endTime);

  if (startUtc >= endUtc) {
    return { error: "Start date/time must be strictly earlier than end date/time." };
  }

  const updateData: {
    start_at: string;
    end_at: string;
    reason: string | null;
    barber_id?: string;
  } = {
    start_at: startUtc.toISOString(),
    end_at: endUtc.toISOString(),
    reason: data.reason?.trim() || null,
  };

  if (data.barber_id) {
    updateData.barber_id = data.barber_id;
  }

  const { error } = await supabase
    .from("blocked_times")
    .update(updateData)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to update blocked time", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/blocked-times");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBlockedTimeAction(id: string) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    const { data: targetBt } = await supabase
      .from("blocked_times")
      .select("barber_id")
      .eq("id", id)
      .single();

    if (!targetBt || targetBt.barber_id !== context.barber?.id) {
      return { error: "Unauthorized: You can only delete your own blocked times." };
    }
  }

  const { error } = await supabase
    .from("blocked_times")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to delete blocked time", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/blocked-times");
  revalidatePath("/admin");
  return { success: true };
}

