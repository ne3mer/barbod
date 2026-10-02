"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Clock,
  Search,
  AlertCircle,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Ban,
  List,
  Columns,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Scissors,
} from "lucide-react";

import type { Tables, AppointmentStatus } from "@/types";
import { utcToBudapestParts } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createAppointmentAction,
  updateAppointmentStatusAction,
  rescheduleAppointmentAction,
  deleteAppointmentAction,
} from "@/app/admin/(dashboard)/appointments/actions";
import { fetchAvailableSlotsAction } from "@/app/(site)/book/actions";
import type { AvailableSlot } from "@/lib/booking/availability";

type AppointmentRow = Tables<"appointments"> & {
  services?: Tables<"services"> | null;
  barbers?: Tables<"barbers"> | null;
};
type BarberRow = Tables<"barbers">;
type ServiceRow = Tables<"services">;
type BlockedTimeRow = Tables<"blocked_times">;

interface AppointmentsManagerProps {
  initialAppointments: AppointmentRow[];
  barbers: BarberRow[];
  services: ServiceRow[];
  blockedTimes: BlockedTimeRow[];
  initialNewModalOpen?: boolean;
}

const HOURS_GRID = Array.from({ length: 13 }, (_, i) => i + 9); // 09:00 to 21:00

export function AppointmentsManager({
  initialAppointments,
  barbers,
  services,
  blockedTimes,
  initialNewModalOpen = false,
}: AppointmentsManagerProps) {
  const router = useRouter();
  const [appointments, setAppointments] = React.useState<AppointmentRow[]>(initialAppointments);
  const [prevInitial, setPrevInitial] = React.useState<AppointmentRow[]>(initialAppointments);

  if (prevInitial !== initialAppointments) {
    setPrevInitial(initialAppointments);
    setAppointments(initialAppointments);
  }

  // View Mode: "day" | "table"
  const [viewMode, setViewMode] = React.useState<"day" | "table">("day");

  // Filters
  const [selectedBarberId, setSelectedBarberId] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Selected Calendar Date
  const [currentDate, setCurrentDate] = React.useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(initialNewModalOpen);
  const [selectedApp, setSelectedApp] = React.useState<AppointmentRow | null>(null);
  const [rescheduleApp, setRescheduleApp] = React.useState<AppointmentRow | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<AppointmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AppointmentRow | null>(null);

  // Create Form State
  const [createBarberId, setCreateBarberId] = React.useState(barbers[0]?.id || "");
  const [createServiceId, setCreateServiceId] = React.useState(services[0]?.id || "");
  const [custName, setCustName] = React.useState("");
  const [custPhone, setCustPhone] = React.useState("");
  const [custEmail, setCustEmail] = React.useState("");
  const [startDate, setStartDate] = React.useState(currentDate);
  const [startTime, setStartTime] = React.useState("15:00");
  const [notes, setNotes] = React.useState("");
  const [appStatus, setAppStatus] = React.useState<AppointmentStatus>("confirmed");

  // Interactive Reschedule State
  const [rescheduleBarberId, setRescheduleBarberId] = React.useState("");
  const [rescheduleServiceId, setRescheduleServiceId] = React.useState("");
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");
  const [rescheduleSlots, setRescheduleSlots] = React.useState<AvailableSlot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Date Navigation
  const handlePrevDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const resetCreateForm = () => {
    setCreateBarberId(barbers[0]?.id || "");
    setCreateServiceId(services[0]?.id || "");
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setStartDate(currentDate);
    setStartTime("15:00");
    setNotes("");
    setAppStatus("confirmed");
    setErrorMsg(null);
  };

  const handleOpenCreate = (barberId?: string, timeStr?: string) => {
    resetCreateForm();
    if (barberId) setCreateBarberId(barberId);
    if (timeStr) setStartTime(timeStr);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await createAppointmentAction({
      barber_id: createBarberId,
      service_id: createServiceId,
      customer_name: custName,
      customer_phone: custPhone,
      customer_email: custEmail,
      startDate,
      startTime,
      notes,
      status: appStatus,
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsCreateOpen(false);
      resetCreateForm();
      router.refresh();
    }
  };

  const handleStatusUpdate = async (id: string, nextStatus: AppointmentStatus) => {
    setLoading(true);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    const res = await updateAppointmentStatusAction(id, nextStatus);
    setLoading(false);

    if (res.error) {
      setAppointments(initialAppointments);
    } else {
      setSelectedApp((prev) => (prev?.id === id ? { ...prev, status: nextStatus } : prev));
      router.refresh();
    }
  };

  // Open Reschedule Modal & Fetch Available Slots
  const handleOpenReschedule = (app: AppointmentRow) => {
    setRescheduleApp(app);
    const parts = utcToBudapestParts(app.start_at);
    setRescheduleBarberId(app.barber_id);
    setRescheduleServiceId(app.service_id);
    setRescheduleDate(parts.dateStr);
    setRescheduleTime(parts.timeStr);
    setErrorMsg(null);
  };

  // Dynamically load available slots for rescheduling when Barber, Service, or Date changes
  React.useEffect(() => {
    if (!rescheduleApp || !rescheduleBarberId || !rescheduleServiceId || !rescheduleDate) return;
    let isMounted = true;

    const loadSlots = async () => {
      setLoadingRescheduleSlots(true);
      const res = await fetchAvailableSlotsAction(
        rescheduleBarberId,
        rescheduleServiceId,
        rescheduleDate
      );
      if (!isMounted) return;
      setLoadingRescheduleSlots(false);
      if (res.slots) {
        setRescheduleSlots(res.slots);
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [rescheduleApp, rescheduleBarberId, rescheduleServiceId, rescheduleDate]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApp || !rescheduleTime) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await rescheduleAppointmentAction(
      rescheduleApp.id,
      rescheduleDate,
      rescheduleTime,
      rescheduleServiceId,
      rescheduleBarberId
    );

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setRescheduleApp(null);
      setSelectedApp(null);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteAppointmentAction(deleteTarget.id);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setDeleteTarget(null);
      setSelectedApp(null);
      router.refresh();
    }
  };

  // Metrics Summary
  const metrics = React.useMemo(() => {
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { pending, confirmed, completed, cancelled, total: appointments.length };
  }, [appointments]);

  // Filtered Barbers
  const displayedBarbers = React.useMemo(() => {
    if (selectedBarberId === "all") return barbers;
    return barbers.filter((b) => b.id === selectedBarberId);
  }, [barbers, selectedBarberId]);

  // Filtered Appointments
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter((app) => {
      if (selectedBarberId !== "all" && app.barber_id !== selectedBarberId) {
        return false;
      }
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = app.customer_name.toLowerCase().includes(query);
        const matchesPhone = app.customer_phone.toLowerCase().includes(query);
        const matchesEmail = (app.customer_email ?? "").toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, selectedBarberId, statusFilter, searchQuery]);

  // Mobile appointments list for selected date
  const mobileDateAppointments = React.useMemo(() => {
    return filteredAppointments.filter((app) => {
      const parts = utcToBudapestParts(app.start_at);
      return parts.dateStr === currentDate;
    });
  }, [filteredAppointments, currentDate]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "confirmed":
        return <Badge variant="info">Confirmed</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Appointments & Schedule
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational dashboard for staff appointments, confirmation, and instant rescheduling.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center rounded-md border border-border p-1 bg-card">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("day")}
              className="gap-1 text-xs min-h-[36px]"
            >
              <Columns className="size-3.5" />
              <span className="hidden xs:inline">Day View</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              className="gap-1 text-xs min-h-[36px]"
            >
              <List className="size-3.5" />
              <span className="hidden xs:inline">List View</span>
            </Button>
          </div>

          <Button onClick={() => handleOpenCreate()} className="gap-2 text-xs font-semibold uppercase tracking-wider min-h-[38px] px-4">
            <Plus className="size-4" />
            <span>New Booking</span>
          </Button>
        </div>
      </div>

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Card (Prominent Action Needed) */}
        <div
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            metrics.pending > 0
              ? "border-amber-500/50 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Clock className="size-3.5" /> Pending
            </span>
            {metrics.pending > 0 && (
              <Badge variant="warning" className="text-[10px] animate-pulse">
                Action Required
              </Badge>
            )}
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-foreground">
            {metrics.pending}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {metrics.pending === 1 ? "1 booking awaiting confirm" : `${metrics.pending} bookings awaiting confirm`}
          </p>
        </div>

        {/* Confirmed Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === "confirmed" ? "all" : "confirmed")}
          className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Confirmed
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-foreground">
            {metrics.confirmed}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Scheduled appointments</p>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
          className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-emerald-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Completed
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-foreground">
            {metrics.completed}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Fulfilled bookings</p>
        </div>

        {/* Cancelled Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === "cancelled" ? "all" : "cancelled")}
          className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-destructive/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <XCircle className="size-3.5" /> Cancelled
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-foreground">
            {metrics.cancelled}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Cancelled bookings</p>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDate} className="size-9 p-0">
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="w-auto h-9 text-xs font-mono rounded-lg"
          />
          <Button variant="outline" size="sm" onClick={handleNextDate} className="size-9 p-0">
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}
            className="text-xs font-mono"
          >
            Today
          </Button>
        </div>

        {/* Barber, Status & Search Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <Select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="h-9 text-xs w-36 sm:w-44 rounded-lg"
            >
              <option value="all">All Barbers ({barbers.length})</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-xs w-32 sm:w-36 rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs w-full rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 4. MOBILE CARDS VIEW (< 768px on Day View) */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            {currentDate} Appointments ({mobileDateAppointments.length})
          </span>
        </div>

        {mobileDateAppointments.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl text-center bg-card">
            <p className="text-xs text-muted-foreground font-light">
              No appointments scheduled for {currentDate}.
            </p>
          </div>
        ) : (
          mobileDateAppointments.map((app) => {
            const parts = utcToBudapestParts(app.start_at);
            const isPending = app.status === "pending";
            const isConfirmed = app.status === "confirmed";

            return (
              <div
                key={app.id}
                className={`rounded-xl border p-4 bg-card space-y-3 shadow-sm ${
                  isPending ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {parts.timeStr}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>
                  <span className="text-xs font-serif font-medium text-muted-foreground">
                    {app.barbers?.name || "Barber"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-foreground font-sans">
                    {app.customer_name}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Scissors className="size-3 text-primary" />
                    <span>{app.services?.name_en || "Service"}</span>
                    <span>· {app.services?.duration_minutes || 30} min</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="font-mono text-muted-foreground">{app.customer_phone}</span>

                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[36px] px-3 text-xs"
                        onClick={() => handleStatusUpdate(app.id, "confirmed")}
                      >
                        Confirm
                      </Button>
                    )}
                    {isConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-500 border-emerald-500/30 min-h-[36px] px-3 text-xs"
                        onClick={() => handleStatusUpdate(app.id, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[36px] px-3 text-xs"
                      onClick={() => handleOpenReschedule(app)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[36px] px-2 text-xs"
                      onClick={() => setSelectedApp(app)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DESKTOP DAY VIEW — MULTI-BARBER COLUMN CALENDAR (hidden on mobile) */}
      {viewMode === "day" && (
        <div className="hidden md:block rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[650px] lg:min-w-full">
              {/* Header Columns */}
              <div
                className="grid border-b border-border bg-muted/90 backdrop-blur-md divide-x divide-border sticky top-0 z-20 shadow-xs"
                style={{
                  gridTemplateColumns: `64px repeat(${displayedBarbers.length}, minmax(180px, 1fr))`,
                }}
              >
                <div className="p-3 text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-semibold flex items-center justify-center">
                  TIME
                </div>
                {displayedBarbers.map((barber) => (
                  <div key={barber.id} className="p-3 text-center flex items-center justify-between gap-2 bg-muted/40">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="size-7 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                        {barber.profile_photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={barber.profile_photo_url} alt={barber.name} className="size-full object-cover" />
                        ) : (
                          <User className="size-4 text-muted-foreground m-1" />
                        )}
                      </div>
                      <span className="font-serif font-semibold text-sm text-foreground truncate">
                        {barber.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenCreate(barber.id)}
                      className="h-7 px-2 hover:bg-primary/10 hover:text-primary flex items-center gap-1 text-xs"
                      title={`Book for ${barber.name}`}
                    >
                      <Plus className="size-3.5" />
                      <span className="hidden sm:inline text-[10px] uppercase font-mono">Book</span>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Time Rows & Appointment Tiles */}
              <div className="divide-y divide-border/60 max-h-[700px] overflow-y-auto">
                {HOURS_GRID.map((hour) => {
                  const hourStr = `${String(hour).padStart(2, "0")}:00`;

                  return (
                    <div
                      key={hour}
                      className="grid divide-x divide-border/60 min-h-[84px] sm:min-h-[72px]"
                      style={{
                        gridTemplateColumns: `64px repeat(${displayedBarbers.length}, minmax(180px, 1fr))`,
                      }}
                    >
                      {/* Time label */}
                      <div className="p-2 text-[11px] font-mono text-muted-foreground text-center font-semibold bg-muted/10 shrink-0 flex items-center justify-center">
                        {hourStr}
                      </div>

                      {/* Barber Slots Column */}
                      {displayedBarbers.map((barber) => {
                        const cellApps = filteredAppointments.filter((app) => {
                          if (app.barber_id !== barber.id) return false;
                          const parts = utcToBudapestParts(app.start_at);
                          if (parts.dateStr !== currentDate) return false;
                          const appHour = parseInt(parts.timeStr.split(":")[0], 10);
                          return appHour === hour;
                        });

                        const cellBlocks = blockedTimes.filter((bt) => {
                          if (bt.barber_id !== barber.id) return false;
                          const startParts = utcToBudapestParts(bt.start_at);
                          if (startParts.dateStr !== currentDate) return false;
                          const blockHour = parseInt(startParts.timeStr.split(":")[0], 10);
                          return blockHour === hour;
                        });

                        return (
                          <div
                            key={barber.id}
                            onClick={(e) => {
                              if (e.target === e.currentTarget) {
                                handleOpenCreate(barber.id, hourStr);
                              }
                            }}
                            className="p-1.5 relative group hover:bg-white/[0.03] active:bg-primary/5 transition-colors min-h-[84px] sm:min-h-[72px] space-y-1.5 cursor-pointer"
                          >
                            {cellApps.length === 0 && cellBlocks.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] font-mono text-primary/70 uppercase tracking-widest flex items-center gap-1 bg-background/90 px-2 py-1 rounded-sm border border-primary/20 shadow-xs">
                                  <Plus className="size-3" /> {hourStr}
                                </span>
                              </div>
                            )}

                            {cellBlocks.map((bt) => (
                              <div
                                key={bt.id}
                                className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-[11px] font-mono text-destructive flex items-center gap-1.5"
                              >
                                <Ban className="size-3 shrink-0" />
                                <span className="truncate">BLOCKED: {bt.reason || "Internal"}</span>
                              </div>
                            ))}

                            {cellApps.map((app) => {
                              const parts = utcToBudapestParts(app.start_at);
                              const isPending = app.status === "pending";
                              const isConfirmed = app.status === "confirmed";
                              const isCompleted = app.status === "completed";

                              const bgClass = isPending
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                : isConfirmed
                                ? "bg-primary/15 border-primary/40 text-primary-foreground"
                                : isCompleted
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                : "bg-muted border-border text-muted-foreground";

                              return (
                                <div
                                  key={app.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                  }}
                                  className={`p-2.5 rounded-lg border ${bgClass} cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xs space-y-1`}
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold truncate">{app.customer_name}</span>
                                    <span className="font-mono text-[10px] opacity-80">{parts.timeStr}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] opacity-75">
                                    <span className="truncate">{app.services?.name_en || "Service"}</span>
                                    <span className="capitalize">{app.status}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TABLE / LIST VIEW */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barber</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time (Budapest)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No appointments found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((app) => {
                  const startParts = utcToBudapestParts(app.start_at);
                  const endParts = utcToBudapestParts(app.end_at);
                  const svcName = app.services
                    ? `${app.services.name_en} (${app.services.duration_minutes}m)`
                    : "Service";
                  const barberName = app.barbers?.name || "Unassigned";

                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-serif font-semibold text-sm">
                        {barberName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{app.customer_name}</span>
                          <span className="text-xs text-muted-foreground">{app.customer_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{svcName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs font-mono">
                          <span>{startParts.formattedDate}</span>
                          <span className="text-muted-foreground">
                            {startParts.timeStr} – {endParts.timeStr}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === "pending" && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 font-semibold"
                              onClick={() => handleStatusUpdate(app.id, "confirmed")}
                            >
                              Confirm
                            </Button>
                          )}
                          {app.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                              onClick={() => handleStatusUpdate(app.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          {(app.status === "pending" || app.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-destructive border-destructive/40 hover:bg-destructive/10"
                              onClick={() => setCancelTarget(app)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button variant="ghost" size="xs" onClick={() => handleOpenReschedule(app)}>
                            Reschedule
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => setSelectedApp(app)}>
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 7. MANUAL CREATE APPOINTMENT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogHeader onClose={() => setIsCreateOpen(false)}>
          <DialogTitle>New Manual Booking</DialogTitle>
          <DialogDescription>
            Create an appointment assigned to a specific barber.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create_barber">Assigned Barber *</Label>
              <Select
                id="create_barber"
                value={createBarberId}
                onChange={(e) => setCreateBarberId(e.target.value)}
                required
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create_svc">Select Service *</Label>
              <Select
                id="create_svc"
                value={createServiceId}
                onChange={(e) => setCreateServiceId(e.target.value)}
                required
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_en} ({s.duration_minutes}m - {s.price} {s.currency})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c_name">Customer Name *</Label>
              <Input
                id="c_name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_phone">Customer Phone *</Label>
              <Input
                id="c_phone"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+36 30 123 4567"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_email">Customer Email (Optional)</Label>
            <Input
              id="c_email"
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="app_date">Date (Budapest) *</Label>
              <Input
                id="app_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app_time">Start Time *</Label>
              <Input
                id="app_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app_status">Initial Status</Label>
            <Select
              id="app_status"
              value={appStatus}
              onChange={(e) => setAppStatus(e.target.value as AppointmentStatus)}
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app_notes">Notes / Special Instructions</Label>
            <Textarea
              id="app_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requested specific style..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* 8. INTERACTIVE RESCHEDULE DIALOG */}
      <Dialog open={!!rescheduleApp} onOpenChange={() => setRescheduleApp(null)}>
        <DialogHeader onClose={() => setRescheduleApp(null)}>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date, time, or barber for {rescheduleApp?.customer_name}.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRescheduleSubmit} className="space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r_barber">Assigned Barber</Label>
              <Select
                id="r_barber"
                value={rescheduleBarberId}
                onChange={(e) => setRescheduleBarberId(e.target.value)}
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r_svc">Service</Label>
              <Select
                id="r_svc"
                value={rescheduleServiceId}
                onChange={(e) => setRescheduleServiceId(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_en} ({s.duration_minutes}m)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r_date">New Date (Budapest) *</Label>
            <Input
              id="r_date"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
              className="h-10 text-sm font-mono"
            />
          </div>

          {/* Time Slot Picker Grid for Rescheduling */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Select Available Time Slot *</span>
              {rescheduleTime && (
                <span className="font-mono font-bold text-primary">Selected: {rescheduleTime}</span>
              )}
            </Label>

            {loadingRescheduleSlots ? (
              <div className="flex items-center justify-center p-6 border border-border rounded-lg bg-card/60">
                <Loader2 className="size-4 animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground font-mono">Loading available slots...</span>
              </div>
            ) : rescheduleSlots.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center bg-card/40">
                <p className="text-xs text-muted-foreground">No available slots on this date with selected barber.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1 border border-border rounded-lg bg-card">
                {rescheduleSlots.map((slot) => {
                  const isSelected = rescheduleTime === slot.timeStr;
                  return (
                    <button
                      key={slot.timeStr}
                      type="button"
                      onClick={() => setRescheduleTime(slot.timeStr)}
                      className={`min-h-[40px] rounded-md border text-xs font-mono font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      {slot.formattedTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleApp(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !rescheduleTime}>
              {loading ? "Validating..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* 9. APPOINTMENT DETAILS DIALOG WITH QUICK ACTIONS */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogHeader onClose={() => setSelectedApp(null)}>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>Full appointment info and operational status management</DialogDescription>
        </DialogHeader>

        {selectedApp && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Status
              </span>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground block">Assigned Barber</span>
                <span className="font-serif font-semibold text-foreground flex items-center gap-1.5 mt-0.5 text-base">
                  <User className="size-4 text-primary" />
                  {selectedApp.barbers?.name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Customer Name</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 text-base">
                  <User className="size-4 text-primary" />
                  {selectedApp.customer_name}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
              <div>
                <span className="text-xs text-muted-foreground block">Phone</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 font-mono">
                  <Phone className="size-3.5 text-primary" />
                  {selectedApp.customer_phone}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-primary" />
                  {selectedApp.customer_email || "N/A"}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <span className="text-xs text-muted-foreground block">Date & Time (Budapest)</span>
              <span className="font-mono font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="size-3.5 text-primary" />
                {utcToBudapestParts(selectedApp.start_at).formattedDateTime} –{" "}
                {utcToBudapestParts(selectedApp.end_at).formattedTime} ({selectedApp.services?.duration_minutes || 30} min)
              </span>
            </div>

            {selectedApp.notes && (
              <div className="border-t border-border pt-3">
                <span className="text-xs text-muted-foreground block">Notes</span>
                <p className="mt-1 bg-muted/40 p-3 rounded-lg text-xs text-foreground font-light">
                  {selectedApp.notes}
                </p>
              </div>
            )}

            {/* Quick Actions Panel inside Detail Dialog */}
            <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedApp.status === "pending" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => handleStatusUpdate(selectedApp.id, "confirmed")}
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Confirm</span>
                  </Button>
                )}
                {selectedApp.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-500 border-emerald-500/40 gap-1.5"
                    onClick={() => handleStatusUpdate(selectedApp.id, "completed")}
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Complete</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReschedule(selectedApp)}
                  className="gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Reschedule</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {(selectedApp.status === "pending" || selectedApp.status === "confirmed") && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCancelTarget(selectedApp)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* 10. CANCELLATION CONFIRMATION DIALOG */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogHeader onClose={() => setCancelTarget(null)}>
          <DialogTitle>Cancel Appointment?</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel appointment for &quot;{cancelTarget?.customer_name}&quot;?
          </DialogDescription>
        </DialogHeader>

        {cancelTarget && (
          <div className="p-4 rounded-lg bg-card border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-semibold text-foreground">{cancelTarget.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Barber:</span>
              <span className="font-serif text-foreground">{cancelTarget.barbers?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="font-mono text-primary">{utcToBudapestParts(cancelTarget.start_at).formattedDateTime}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelTarget(null)}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (cancelTarget) {
                await handleStatusUpdate(cancelTarget.id, "cancelled");
                setCancelTarget(null);
              }
            }}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 11. DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete appointment for &quot;{deleteTarget?.customer_name}&quot;?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Appointment"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
