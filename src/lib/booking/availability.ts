import { createClient } from "@/lib/supabase/server";
import {
  budapestDateTimeToUtc,
  utcToBudapestParts,
  timeStringToMinutes,
  isOverlapping,
} from "@/lib/utils/dates";

export type AvailableSlot = {
  timeStr: string; // "HH:MM" format in Europe/Budapest
  formattedTime: string; // e.g. "15:00"
  startUtc: string; // ISO string
  endUtc: string;   // ISO string
};

export type CalculateSlotsParams = {
  businessId: string;
  serviceId: string;
  dateStr: string; // YYYY-MM-DD in Europe/Budapest
  incrementMinutes?: number; // default 30
};

/**
 * Calculates available booking slots for a given business, service, and date.
 * Fully accounts for working hours, multiple intervals, service duration,
 * existing active appointments (pending/confirmed), blocked times, and past times.
 */
export async function calculateAvailableSlots({
  businessId,
  serviceId,
  dateStr,
  incrementMinutes = 30,
}: CalculateSlotsParams): Promise<AvailableSlot[]> {
  const supabase = await createClient();

  // 1. Fetch target service
  const { data: service, error: svcError } = await supabase
    .from("services")
    .select("id, duration_minutes, is_active")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .single();

  if (svcError || !service || !service.is_active) {
    return [];
  }

  const durationMinutes = service.duration_minutes;

  // 2. Determine day of week for dateStr in Europe/Budapest
  // Construct a noon UTC timestamp for the date string to get correct day of week
  const sampleUtc = budapestDateTimeToUtc(dateStr, "12:00");
  const dayParts = utcToBudapestParts(sampleUtc);
  const dayOfWeek = dayParts.dayOfWeek;

  // 3. Fetch active working hours for this weekday
  const { data: workingHours, error: whError } = await supabase
    .from("working_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (whError || !workingHours || workingHours.length === 0) {
    return []; // Business closed on this day
  }

  // 4. Fetch existing active appointments (pending & confirmed) for dateStr
  const dayStartUtc = budapestDateTimeToUtc(dateStr, "00:00");
  const dayEndUtc = budapestDateTimeToUtc(dateStr, "23:59");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_at, end_at, status")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .lt("start_at", dayEndUtc.toISOString())
    .gt("end_at", dayStartUtc.toISOString());

  // 5. Fetch blocked times for dateStr
  const { data: blockedTimes } = await supabase
    .from("blocked_times")
    .select("start_at, end_at")
    .eq("business_id", businessId)
    .lt("start_at", dayEndUtc.toISOString())
    .gt("end_at", dayStartUtc.toISOString());

  const activeApps = (appointments ?? []).map((a) => ({
    start: new Date(a.start_at),
    end: new Date(a.end_at),
  }));

  const activeBlocks = (blockedTimes ?? []).map((b) => ({
    start: new Date(b.start_at),
    end: new Date(b.end_at),
  }));

  const now = new Date();
  const slots: AvailableSlot[] = [];

  // 6. Iterate through working hour intervals for the day
  for (const interval of workingHours) {
    const intervalStartMins = timeStringToMinutes(interval.start_time);
    const intervalEndMins = timeStringToMinutes(interval.end_time);

    let candidateMins = intervalStartMins;

    while (candidateMins + durationMinutes <= intervalEndMins) {
      const h = Math.floor(candidateMins / 60);
      const m = candidateMins % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const candidateStartUtc = budapestDateTimeToUtc(dateStr, timeStr);
      const candidateEndUtc = new Date(
        candidateStartUtc.getTime() + durationMinutes * 60 * 1000
      );

      // Check Past Time (must be strictly in future)
      let isValid = candidateStartUtc.getTime() > now.getTime();

      // Check existing appointments overlap
      if (isValid) {
        for (const app of activeApps) {
          if (isOverlapping(candidateStartUtc, candidateEndUtc, app.start, app.end)) {
            isValid = false;
            break;
          }
        }
      }

      // Check blocked times overlap
      if (isValid) {
        for (const block of activeBlocks) {
          if (isOverlapping(candidateStartUtc, candidateEndUtc, block.start, block.end)) {
            isValid = false;
            break;
          }
        }
      }

      if (isValid) {
        slots.push({
          timeStr,
          formattedTime: timeStr,
          startUtc: candidateStartUtc.toISOString(),
          endUtc: candidateEndUtc.toISOString(),
        });
      }

      candidateMins += incrementMinutes;
    }
  }

  return slots;
}

/**
 * Checks if a specific date (YYYY-MM-DD) has at least 1 available slot for the given service.
 */
export async function getAvailableDates(
  businessId: string,
  serviceId: string,
  daysAhead = 30
): Promise<string[]> {
  const availableDates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const parts = utcToBudapestParts(targetDate);
    const dateStr = parts.dateStr;

    const slots = await calculateAvailableSlots({
      businessId,
      serviceId,
      dateStr,
    });

    if (slots.length > 0) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
}
