"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Phone,
  Mail,
  User,
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
};
type ServiceRow = Tables<"services">;

interface AppointmentsManagerProps {
  initialAppointments: AppointmentRow[];
  services: ServiceRow[];
  initialNewModalOpen?: boolean;
}

export function AppointmentsManager({
  initialAppointments,
  services,
  initialNewModalOpen = false,
}: AppointmentsManagerProps) {
  const router = useRouter();
  const [appointments, setAppointments] =
    React.useState<AppointmentRow[]>(initialAppointments);
  const [prevInitial, setPrevInitial] =
    React.useState<AppointmentRow[]>(initialAppointments);

  if (prevInitial !== initialAppointments) {
    setPrevInitial(initialAppointments);
    setAppointments(initialAppointments);
  }

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(initialNewModalOpen);
  const [selectedApp, setSelectedApp] = React.useState<AppointmentRow | null>(
    null
  );
  const [rescheduleApp, setRescheduleApp] = React.useState<AppointmentRow | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = React.useState<AppointmentRow | null>(
    null
  );

  // Create Form State
  const [custName, setCustName] = React.useState("");
  const [custPhone, setCustPhone] = React.useState("");
  const [custEmail, setCustEmail] = React.useState("");
  const [selectedServiceId, setSelectedServiceId] = React.useState(
    services[0]?.id || ""
  );
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = React.useState("15:00");
  const [notes, setNotes] = React.useState("");
  const [appStatus, setAppStatus] = React.useState<AppointmentStatus>("confirmed");

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");
  const [rescheduleSvcId, setRescheduleSvcId] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Reset Create Form
  const resetCreateForm = () => {
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setSelectedServiceId(services[0]?.id || "");
    setStartDate(new Date().toISOString().split("T")[0]);
    setStartTime("15:00");
    setNotes("");
    setAppStatus("confirmed");
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await createAppointmentAction({
      service_id: selectedServiceId,
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

  const handleStatusUpdate = async (
    id: string,
    nextStatus: AppointmentStatus
  ) => {
    setLoading(true);
    // Optimistic UI update
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    const res = await updateAppointmentStatusAction(id, nextStatus);
    setLoading(false);

    if (res.error) {
      // Revert
      setAppointments(initialAppointments);
    } else {
      router.refresh();
    }
  };

  const handleOpenReschedule = (app: AppointmentRow) => {
    setRescheduleApp(app);
    const parts = utcToBudapestParts(app.start_at);
    setRescheduleDate(parts.dateStr);
    setRescheduleTime(parts.timeStr);
    setRescheduleSvcId(app.service_id);
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
      rescheduleSvcId
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

  // Filtered Appointments
  const filteredAppointments = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return appointments.filter((app) => {
      // Status filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }

      // Date filter
      const parts = utcToBudapestParts(app.start_at);
      if (dateFilter === "today" && parts.dateStr !== todayStr) {
        return false;
      }
      if (dateFilter === "upcoming" && new Date(app.start_at) < new Date()) {
        return false;
      }

      // Search query
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
  }, [appointments, statusFilter, dateFilter, searchQuery]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Appointments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customer bookings, reschedule, and create manual appointments.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          <span>New Appointment</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="upcoming">Upcoming</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <CalendarIcon className="size-10 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">
            No appointments found
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {appointments.length === 0
              ? "No appointments exist yet. Create your first manual appointment."
              : "No appointments match your active filters."}
          </p>
          <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" />
            <span>Create Appointment</span>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time (Budapest)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((app) => {
              const startParts = utcToBudapestParts(app.start_at);
              const endParts = utcToBudapestParts(app.end_at);
              const svcName = app.services
                ? `${app.services.name_en} (${app.services.duration_minutes}m)`
                : "Service";

              return (
                <TableRow key={app.id}>
                  {/* Customer */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {app.customer_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {app.customer_phone}
                      </span>
                      {app.customer_email && (
                        <span className="text-xs text-muted-foreground/80">
                          {app.customer_email}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Service */}
                  <TableCell className="font-medium text-xs">{svcName}</TableCell>

                  {/* Time */}
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">
                        {startParts.formattedDate}
                      </span>
                      <span className="text-muted-foreground">
                        {startParts.timeStr} – {endParts.timeStr}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{getStatusBadge(app.status)}</TableCell>

                  {/* Quick Actions */}
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
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenReschedule(app)}
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedApp(app)}
                      >
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Manual Create Appointment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogHeader onClose={() => setIsCreateOpen(false)}>
          <DialogTitle>New Manual Appointment</DialogTitle>
          <DialogDescription>
            Create an appointment directly in the admin system.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc_select">Select Service *</Label>
            <Select
              id="svc_select"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_en} ({s.duration_minutes} mins - {s.price} {s.currency})
                </option>
              ))}
            </Select>
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
              placeholder="e.g. Customer requested specific barber style..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Checking & Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleApp} onOpenChange={() => setRescheduleApp(null)}>
        <DialogHeader onClose={() => setRescheduleApp(null)}>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Change the date, start time, or service for {rescheduleApp?.customer_name}.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r_svc">Service</Label>
            <Select
              id="r_svc"
              value={rescheduleSvcId}
              onChange={(e) => setRescheduleSvcId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_en} ({s.duration_minutes} mins)
                </option>
              ))}
            </Select>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleApp(null)}
            >
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
          <DialogDescription>Full details and history</DialogDescription>
        </DialogHeader>

        {selectedApp && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Status
              </span>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground block">Customer Name</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <User className="size-3.5 text-primary" />
                  {selectedApp.customer_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Phone</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-3.5 text-primary" />
                  {selectedApp.customer_phone}
                </span>
              </div>
            </div>

            {selectedApp.customer_email && (
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-primary" />
                  {selectedApp.customer_email}
                </span>
              </div>
            )}

            <div className="border-t pt-3">
              <span className="text-xs text-muted-foreground block">Date & Time</span>
              <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="size-3.5 text-primary" />
                {utcToBudapestParts(selectedApp.start_at).formattedDateTime} –{" "}
                {utcToBudapestParts(selectedApp.end_at).formattedTime}
              </span>
            </div>

            {selectedApp.notes && (
              <div className="border-t pt-3">
                <span className="text-xs text-muted-foreground block">Notes</span>
                <p className="mt-1 bg-muted/40 p-3 rounded-md text-xs text-foreground">
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
