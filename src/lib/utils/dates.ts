import { BUSINESS_TIMEZONE } from "@/types";

/**
 * Converts a Budapest local date string (YYYY-MM-DD) and time string (HH:MM)
 * into a UTC Date object (taking daylight savings in Budapest into account).
 */
export function budapestDateTimeToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  // Initial UTC timestamp guess with given components
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Determine what wall-clock time utcMs produces in Europe/Budapest
  const getBudapestWallClockMs = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(ms));

    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }

    let h = parseInt(map.hour, 10);
    if (h === 24) h = 0;

    return Date.UTC(
      parseInt(map.year, 10),
      parseInt(map.month, 10) - 1,
      parseInt(map.day, 10),
      h,
      parseInt(map.minute, 10),
      parseInt(map.second, 10)
    );
  };

  const wallClockMs = getBudapestWallClockMs(utcMs);
  const diff = wallClockMs - utcMs;

  return new Date(utcMs - diff);
}

/**
 * Formats a UTC Date / ISO string into Budapest local components and display text.
 */
export function utcToBudapestParts(isoString: string | Date): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  dayOfWeek: number; // 0=Sunday, 1=Monday... 6=Saturday
  formattedDate: string; // e.g. "Oct 1, 2026"
  formattedTime: string; // e.g. "15:00"
  formattedDateTime: string; // e.g. "Oct 1, 2026, 15:00"
} {
  const date = typeof isoString === "string" ? new Date(isoString) : isoString;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  let h = map.hour;
  if (h === "24") h = "00";

  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${h.padStart(2, "0")}:${map.minute.padStart(2, "0")}`;

  // Get weekday (0-6) in Budapest timezone
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "short",
  }).format(date);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayMap[weekdayStr] ?? date.getUTCDay();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const formattedTime = timeStr;

  const formattedDateTime = `${formattedDate} at ${formattedTime}`;

  return {
    dateStr,
    timeStr,
    dayOfWeek,
    formattedDate,
    formattedTime,
    formattedDateTime,
  };
}

/**
 * Checks if two half-open intervals [start1, end1) and [start2, end2) overlap.
 */
export function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Convert time string "HH:MM" or "HH:MM:SS" to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
