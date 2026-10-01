"use server";

import { requireAdminContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email/send";
import type { NotificationJobRow } from "@/lib/email/types";

export async function fetchNotificationLogsAction(params?: {
  status?: string;
  type?: string;
}) {
  const context = await requireAdminContext();
  if (context.role !== "owner") {
    return { error: "Unauthorized: Email logs are restricted to business owner." };
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return { error: "Admin client unavailable." };
  }

  let query = adminSupabase
    .from("notification_jobs")
    .select("*")
    .eq("business_id", context.business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params?.type && params.type !== "all") {
    query = query.eq("notification_type", params.type);
  }

  const { data: logs, error } = await query;
  if (error) {
    console.error("Fetch notification logs error:", error.message);
    return { logs: [], error: error.message };
  }

  return { logs: (logs as NotificationJobRow[]) || [] };
}

export async function sendOwnerTestEmailAction() {
  const context = await requireAdminContext();
  if (context.role !== "owner") {
    return { error: "Unauthorized: Only business owner can trigger test emails." };
  }

  const ownerEmail = context.user.email;
  if (!ownerEmail) {
    return { error: "Owner account does not have a valid email address." };
  }

  const testPayload = {
    appointmentId: "test-id-000",
    customerName: "Valued Customer",
    customerEmail: ownerEmail,
    serviceName: "Signature Haircut & Beard Grooming",
    barberName: context.barber?.name || "Master Barber",
    dateStr: "2026. október 10.",
    timeStr: "14:30",
    durationMinutes: 45,
    studioName: context.business.name || "Barbod Barber",
    studioAddress: context.business.address || "Andrássy út 12, Budapest",
  };

  const result = await sendNotificationEmail({
    to: ownerEmail,
    type: "appointment_booked",
    locale: "hu",
    payload: testPayload,
  });

  if (!result.success) {
    return { error: result.error || "Failed to dispatch test email." };
  }

  return { success: true, message: `Test email dispatched successfully to ${ownerEmail}.` };
}
