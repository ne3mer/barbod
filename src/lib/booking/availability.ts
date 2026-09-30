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
  barberId: string;
  serviceId: string;
  dateStr: string; // YYYY-MM-DD in Europe/Budapest
  incrementMinutes?: number; // default 30
};

/**
 * Calculates available booking slots for a given barber, service, and date.
 * Fully accounts for barber working hours, service duration,
 * existing active appointments (pending/confirmed), blocked times, and past times.
 */
export async function calculateAvailableSlots({
  businessId,
  barberId,
  serviceId,
  dateStr,
  incrementMinutes = 30,
}: CalculateSlotsParams): Promise<AvailableSlot[]> {
  const supabase = await createClient();

  if (!barberId || !serviceId || !dateStr) {
    return [];
  }

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

  // 2. Fetch barber & check assignment
  const { data: barber, error: barError } = await supabase
    .from("barbers")
    .select("id, is_active")
    .eq("id", barberId)
    .eq("business_id", businessId)
    .single();

  if (barError || !barber || !barber.is_active) {
    return [];
  }

  const { data: assignment } = await supabase
    .from("barber_services")
    .select("barber_id")
    .eq("barber_id", barberId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (!assignment) {
    return [];
  }

  const durationMinutes = service.duration_minutes;

  // 3. Determine day of week for dateStr in Europe/Budapest
  const sampleUtc = budapestDateTimeToUtc(dateStr, "12:00");
  const dayParts = utcToBudapestParts(sampleUtc);
  const dayOfWeek = dayParts.dayOfWeek;

  // 4. Fetch active working hours for this barber on this weekday
  const { data: workingHours, error: whError } = await supabase
    .from("working_hours")
    .select("*")
    .eq("barber_id", barberId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (whError || !workingHours || workingHours.length === 0) {
    return []; // Barber closed on this day
  }

  // 5. Fetch occupied intervals (active appointments & blocked times) via SECURITY DEFINER RPC
  const dayStartUtc = budapestDateTimeToUtc(dateStr, "00:00");
  const dayEndUtc = budapestDateTimeToUtc(dateStr, "23:59");

  const { data: occupiedIntervals, error: rpcError } = await supabase.rpc(
    "get_occupied_intervals",
    {
      p_barber_id: barberId,
      p_start_at: dayStartUtc.toISOString(),
      p_end_at: dayEndUtc.toISOString(),
    }
  );

  if (rpcError) {
    console.error("Failed to fetch occupied intervals via RPC", rpcError.message);
  }

  const occupiedList = (occupiedIntervals ?? []).map((row) => ({
    start: new Date(row.start_at),
    end: new Date(row.end_at),
  }));

  const now = new Date();
  const slots: AvailableSlot[] = [];

  // 6. Iterate through working hour intervals for the barber
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

      // Check occupied intervals overlap (appointments + blocked times)
      if (isValid) {
        for (const occ of occupiedList) {
          if (isOverlapping(candidateStartUtc, candidateEndUtc, occ.start, occ.end)) {
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
 * Checks if a specific date (YYYY-MM-DD) has at least 1 available slot for the given barber & service.
 */
export async function getAvailableDates(
  businessId: string,
  barberId: string,
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
      barberId,
      serviceId,
      dateStr,
    });

    if (slots.length > 0) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
}
