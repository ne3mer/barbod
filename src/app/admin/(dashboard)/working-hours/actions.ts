"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { timeStringToMinutes } from "@/lib/utils/dates";

export type IntervalInput = {
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
};

export type DayScheduleInput = {
  day_of_week: number; // 0=Sun, 1=Mon ... 6=Sat
  is_active: boolean;
  intervals: IntervalInput[];
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function saveWorkingHoursAction(
  schedules: DayScheduleInput[],
  targetBarberId?: string
) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  // If staff, force targetBarberId to context.barber.id
  if (context.role === "staff") {
    if (!context.barber) {
      return { error: "Staff barber profile not found." };
    }
    targetBarberId = context.barber.id;
  }

  // Determine barber_id
  let barberId = targetBarberId;
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

  // Validate each day's schedule
  for (const day of schedules) {
    const dayName = DAY_NAMES[day.day_of_week] || `Day ${day.day_of_week}`;

    if (day.is_active) {
      if (!day.intervals || day.intervals.length === 0) {
        return { error: `${dayName} is active but has no working intervals.` };
      }

      for (const inv of day.intervals) {
        if (!inv.start_time || !inv.end_time) {
          return { error: `Invalid time inputs on ${dayName}.` };
        }

        const startMins = timeStringToMinutes(inv.start_time);
        const endMins = timeStringToMinutes(inv.end_time);

        if (startMins >= endMins) {
          return {
            error: `Invalid time range on ${dayName}: ${inv.start_time} must be earlier than ${inv.end_time}.`,
          };
        }
      }

      const sorted = [...day.intervals].sort(
        (a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time)
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const currentEnd = timeStringToMinutes(sorted[i].end_time);
        const nextStart = timeStringToMinutes(sorted[i + 1].start_time);

        if (currentEnd > nextStart) {
          return {
            error: `Overlapping intervals detected on ${dayName}: ${sorted[i].start_time}-${sorted[i].end_time} and ${sorted[i + 1].start_time}-${sorted[i + 1].end_time}.`,
          };
        }
      }
    }
  }

  // 1. Remove existing working hours for target barber
  const { error: deleteError } = await supabase
    .from("working_hours")
    .delete()
    .eq("barber_id", barberId);

  if (deleteError) {
    console.error("Failed to clear old working hours", deleteError.message);
    return { error: deleteError.message };
  }

  // 2. Prepare new rows to insert
  const rowsToInsert: Array<{
    business_id: string;
    barber_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }> = [];

  for (const day of schedules) {
    if (day.is_active) {
      for (const inv of day.intervals) {
        const startTimeFormatted = inv.start_time.length === 5 ? `${inv.start_time}:00` : inv.start_time;
        const endTimeFormatted = inv.end_time.length === 5 ? `${inv.end_time}:00` : inv.end_time;

        rowsToInsert.push({
          business_id: business.id,
          barber_id: barberId,
          day_of_week: day.day_of_week,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
          is_active: true,
        });
      }
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("working_hours")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("Failed to insert new working hours", insertError.message);
      return { error: insertError.message };
    }
  }

  revalidatePath("/admin/working-hours");
  revalidatePath("/admin");
  return { success: true };
}
