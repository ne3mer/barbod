"use client";

import * as React from "react";
import { Plus, Trash2, Clock, CheckCircle2, AlertCircle, Save } from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  saveWorkingHoursAction,
  type DayScheduleInput,
  type IntervalInput,
} from "@/app/admin/(dashboard)/working-hours/actions";

type WorkingHoursRow = Tables<"working_hours">;

const DAYS_CONFIG = [
  { day_of_week: 1, name: "Monday" },
  { day_of_week: 2, name: "Tuesday" },
  { day_of_week: 3, name: "Wednesday" },
  { day_of_week: 4, name: "Thursday" },
  { day_of_week: 5, name: "Friday" },
  { day_of_week: 6, name: "Saturday" },
  { day_of_week: 0, name: "Sunday" },
];

function formatTimeForInput(timeStr: string): string {
  if (!timeStr) return "15:00";
  // Convert "15:00:00" -> "15:00"
  const parts = timeStr.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

export function WorkingHoursEditor({
  initialRows,
}: {
  initialRows: WorkingHoursRow[];
}) {
  // Map initial DB rows into state by day_of_week
  const [schedules, setSchedules] = React.useState<DayScheduleInput[]>(() => {
    return DAYS_CONFIG.map(({ day_of_week }) => {
      const dayRows = initialRows.filter(
        (r) => r.day_of_week === day_of_week && r.is_active
      );

      if (dayRows.length > 0) {
        const intervals: IntervalInput[] = dayRows.map((r) => ({
          start_time: formatTimeForInput(r.start_time),
          end_time: formatTimeForInput(r.end_time),
        }));
        return { day_of_week, is_active: true, intervals };
      }

      // Default seeded defaults if no DB row exists
      if (day_of_week === 0) {
        // Sunday closed
        return {
          day_of_week,
          is_active: false,
          intervals: [{ start_time: "15:00", end_time: "20:30" }],
        };
      } else {
        // Mon-Sat open 15:00 - 20:30
        return {
          day_of_week,
          is_active: true,
          intervals: [{ start_time: "15:00", end_time: "20:30" }],
        };
      }
    });
  });

  const [saving, setSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleToggleDay = (day_of_week: number, is_active: boolean) => {
    setSchedules((prev) =>
      prev.map((day) => {
        if (day.day_of_week !== day_of_week) return day;
        // If enabling and intervals empty, add default interval
        const intervals =
          day.intervals.length > 0
            ? day.intervals
            : [{ start_time: "15:00", end_time: "20:30" }];
        return { ...day, is_active, intervals };
      })
    );
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleAddInterval = (day_of_week: number) => {
    setSchedules((prev) =>
      prev.map((day) => {
        if (day.day_of_week !== day_of_week) return day;
        const lastInv = day.intervals[day.intervals.length - 1];
        let newStart = "18:30";
        let newEnd = "20:30";
        if (lastInv) {
          // Add 30 mins to previous end
          newStart = lastInv.end_time;
          const [h, m] = lastInv.end_time.split(":").map(Number);
          const endMins = Math.min(23 * 60 + 59, h * 60 + m + 60);
          const endH = Math.floor(endMins / 60);
          const endM = endMins % 60;
          newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
        }
        return {
          ...day,
          intervals: [...day.intervals, { start_time: newStart, end_time: newEnd }],
        };
      })
    );
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleRemoveInterval = (day_of_week: number, index: number) => {
    setSchedules((prev) =>
      prev.map((day) => {
        if (day.day_of_week !== day_of_week) return day;
        const updated = day.intervals.filter((_, i) => i !== index);
        // If all intervals removed, mark day inactive
        return {
          ...day,
          is_active: updated.length > 0 ? day.is_active : false,
          intervals: updated,
        };
      })
    );
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleTimeChange = (
    day_of_week: number,
    index: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((day) => {
        if (day.day_of_week !== day_of_week) return day;
        const updated = day.intervals.map((inv, i) =>
          i === index ? { ...inv, [field]: value } : inv
        );
        return { ...day, intervals: updated };
      })
    );
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const result = await saveWorkingHoursAction(schedules);
    setSaving(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg("Working hours saved successfully!");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Working Hours
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure your weekly schedule and break intervals in Europe/Budapest wall-clock time.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
          <Save className="size-4" />
          <span>{saving ? "Saving..." : "Save Schedule"}</span>
        </Button>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-4 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-4 text-sm text-destructive border border-destructive/30">
          <AlertCircle className="size-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Weekday cards list */}
      <div className="space-y-4">
        {DAYS_CONFIG.map(({ day_of_week, name }) => {
          const daySchedule = schedules.find((s) => s.day_of_week === day_of_week);
          const isActive = daySchedule?.is_active ?? false;
          const intervals = daySchedule?.intervals ?? [];

          return (
            <div
              key={day_of_week}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(val) => handleToggleDay(day_of_week, val)}
                  />
                  <span className="font-semibold text-foreground text-base">
                    {name}
                  </span>
                  <Badge variant={isActive ? "success" : "outline"}>
                    {isActive ? "Open" : "Closed"}
                  </Badge>
                </div>

                {isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => handleAddInterval(day_of_week)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Interval</span>
                  </Button>
                )}
              </div>

              {/* Intervals Content */}
              {isActive && (
                <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                  {intervals.map((inv, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Interval {index + 1}:</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={inv.start_time}
                          onChange={(e) =>
                            handleTimeChange(
                              day_of_week,
                              index,
                              "start_time",
                              e.target.value
                            )
                          }
                          className="w-28 sm:w-32 text-xs font-mono"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={inv.end_time}
                          onChange={(e) =>
                            handleTimeChange(
                              day_of_week,
                              index,
                              "end_time",
                              e.target.value
                            )
                          }
                          className="w-28 sm:w-32 text-xs font-mono"
                        />
                      </div>

                      {intervals.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:bg-destructive/10 ml-auto"
                          onClick={() => handleRemoveInterval(day_of_week, index)}
                          title="Remove interval"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-6">
          <Save className="size-4" />
          <span>{saving ? "Saving..." : "Save Working Hours"}</span>
        </Button>
      </div>
    </div>
  );
}
