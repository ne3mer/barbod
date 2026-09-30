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

  // Calendar View Mode: "day" | "week" | "table"
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "table">("day");

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

  // Reschedule Form State
  const [rescheduleBarberId, setRescheduleBarberId] = React.useState("");
  const [rescheduleServiceId, setRescheduleServiceId] = React.useState("");
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Date Navigation
  const handlePrevDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === "week" ? 7 : 1));
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
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
      router.refresh();
    }
  };

  const handleOpenReschedule = (app: AppointmentRow) => {
    setRescheduleApp(app);
    const parts = utcToBudapestParts(app.start_at);
    setRescheduleBarberId(app.barber_id);
    setRescheduleServiceId(app.service_id);
    setRescheduleDate(parts.dateStr);
    setRescheduleTime(parts.timeStr);
    setErrorMsg(null);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApp) return;

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
      router.refresh();
    }
  };

  // Filtered Barbers for Column Layout
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Barbershop Schedule & Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-staff column schedule view with real-time double-booking protection.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* View Switcher */}
          <div className="flex items-center rounded-sm border border-border p-1 bg-muted/20">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("day")}
              className="gap-1 text-xs"
            >
              <Columns className="size-3.5" />
              <span>Day View</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              className="gap-1 text-xs"
            >
              <List className="size-3.5" />
              <span>List View</span>
            </Button>
          </div>

          <Button onClick={() => handleOpenCreate()} className="gap-2 text-xs font-semibold uppercase tracking-wider">
            <Plus className="size-4" />
            <span>New Booking</span>
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-sm border border-border shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={handlePrevDate}>
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="w-auto h-8 text-xs font-mono"
          />
          <Button variant="outline" size="xs" onClick={handleNextDate}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}
            className="text-xs text-muted-foreground font-mono"
          >
            Today
          </Button>
        </div>

        {/* Barber Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <Select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="h-8 text-xs w-44"
            >
              <option value="all">All Barbers ({barbers.length})</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs w-36"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs w-40"
            />
          </div>
        </div>
      </div>

      {/* DAY VIEW — MULTI-BARBER COLUMN CALENDAR */}
      {viewMode === "day" && (
        <div className="rounded-sm border border-border bg-card overflow-hidden shadow-xl">
          {/* Calendar Header Columns */}
          <div
            className="grid border-b border-border bg-muted/40 divide-x divide-border"
            style={{
              gridTemplateColumns: `60px repeat(${displayedBarbers.length}, minmax(180px, 1fr))`,
            }}
          >
            <div className="p-3 text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-semibold flex items-center justify-center">
              TIME
            </div>
            {displayedBarbers.map((barber) => (
              <div key={barber.id} className="p-3 text-center flex items-center justify-between gap-2">
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
                  className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                  title={`Book for ${barber.name}`}
                >
                  <Plus className="size-3.5" />
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
                  className="grid divide-x divide-border/60 min-h-[72px]"
                  style={{
                    gridTemplateColumns: `60px repeat(${displayedBarbers.length}, minmax(180px, 1fr))`,
                  }}
                >
                  {/* Time label */}
                  <div className="p-2 text-[11px] font-mono text-muted-foreground text-center font-semibold bg-muted/10 shrink-0">
                    {hourStr}
                  </div>

                  {/* Barber Slots Column */}
                  {displayedBarbers.map((barber) => {
                    // Find appointments matching date, barber, and starting in this hour
                    const cellApps = filteredAppointments.filter((app) => {
                      if (app.barber_id !== barber.id) return false;
                      const parts = utcToBudapestParts(app.start_at);
                      if (parts.dateStr !== currentDate) return false;
                      const appHour = parseInt(parts.timeStr.split(":")[0], 10);
                      return appHour === hour;
                    });

                    // Find blocked times matching date & barber
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
                          // If background clicked, open create modal with this time
                          if (e.target === e.currentTarget) {
                            handleOpenCreate(barber.id, hourStr);
                          }
                        }}
                        className="p-1.5 relative group hover:bg-white/[0.02] transition-colors min-h-[72px] space-y-1.5"
                      >
                        {/* Render Blocked Times */}
                        {cellBlocks.map((bt) => (
                          <div
                            key={bt.id}
                            className="p-2 rounded-sm bg-destructive/10 border border-destructive/30 text-[11px] font-mono text-destructive flex items-center gap-1.5"
                          >
                            <Ban className="size-3 shrink-0" />
                            <span className="truncate">BLOCKED: {bt.reason || "Internal"}</span>
                          </div>
                        ))}

                        {/* Render Appointments */}
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
                              className={`p-2.5 rounded-sm border ${bgClass} cursor-pointer hover:scale-[1.01] transition-all shadow-xs space-y-1`}
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
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === "table" && (
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
                      <div className="flex items-center justify-end gap-1">
                        {app.status === "pending" && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => handleStatusUpdate(app.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                        )}
                        {app.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => handleStatusUpdate(app.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        {(app.status === "pending" || app.status === "confirmed") && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(app.id, "cancelled")}
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
      )}

      {/* Manual Create Appointment Dialog */}
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

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleApp} onOpenChange={() => setRescheduleApp(null)}>
        <DialogHeader onClose={() => setRescheduleApp(null)}>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Change barber, date, or service for {rescheduleApp?.customer_name}.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-sm">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r_date">New Date *</Label>
              <Input
                id="r_date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r_time">New Start Time *</Label>
              <Input
                id="r_time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleApp(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Validating..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogHeader onClose={() => setSelectedApp(null)}>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>Full appointment details and status management</DialogDescription>
        </DialogHeader>

        {selectedApp && (
          <div className="space-y-4 text-sm">
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
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
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
              <span className="text-xs text-muted-foreground block">Date & Time</span>
              <span className="font-mono font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="size-3.5 text-primary" />
                {utcToBudapestParts(selectedApp.start_at).formattedDateTime} –{" "}
                {utcToBudapestParts(selectedApp.end_at).formattedTime}
              </span>
            </div>

            {selectedApp.notes && (
              <div className="border-t border-border pt-3">
                <span className="text-xs text-muted-foreground block">Notes</span>
                <p className="mt-1 bg-muted/40 p-3 rounded-md text-xs text-foreground font-light">
                  {selectedApp.notes}
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteTarget(selectedApp);
                  setSelectedApp(null);
                }}
              >
                Delete Booking
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation */}
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
