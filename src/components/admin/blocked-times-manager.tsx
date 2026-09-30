"use client";

import * as React from "react";
import { Plus, Edit2, Trash2, Ban, AlertCircle } from "lucide-react";

import type { Tables } from "@/types/database";
import { utcToBudapestParts } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createBlockedTimeAction,
  updateBlockedTimeAction,
  deleteBlockedTimeAction,
} from "@/app/admin/(dashboard)/blocked-times/actions";

type BlockedTimeRow = Tables<"blocked_times">;

const REASON_PRESETS = [
  "Personal appointment",
  "Holiday",
  "Lunch",
  "Closed early",
];

export function BlockedTimesManager({
  initialItems,
}: {
  initialItems: BlockedTimeRow[];
}) {
  const [items] = React.useState<BlockedTimeRow[]>(initialItems);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<BlockedTimeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BlockedTimeRow | null>(null);

  // Form states
  const [startDate, setStartDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("12:00");
  const [endDate, setEndDate] = React.useState("");
  const [endTime, setEndTime] = React.useState("13:00");
  const [reason, setReason] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const resetForm = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setStartDate(todayStr);
    setStartTime("12:00");
    setEndDate(todayStr);
    setEndTime("13:00");
    setReason("");
    setEditingItem(null);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: BlockedTimeRow) => {
    setEditingItem(item);
    const startParts = utcToBudapestParts(item.start_at);
    const endParts = utcToBudapestParts(item.end_at);

    setStartDate(startParts.dateStr);
    setStartTime(startParts.timeStr);
    setEndDate(endParts.dateStr);
    setEndTime(endParts.timeStr);
    setReason(item.reason ?? "");
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      startDate,
      startTime,
      endDate,
      endTime,
      reason,
    };

    let res;
    if (editingItem) {
      res = await updateBlockedTimeAction(editingItem.id, payload);
    } else {
      res = await createBlockedTimeAction(payload);
    }

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteBlockedTimeAction(deleteTarget.id);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Blocked Times
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage holidays, breaks, and manual blockouts in Europe/Budapest timezone.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          <span>Add Blocked Period</span>
        </Button>
      </div>

      {/* List / Table */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <Ban className="size-10 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">No blocked times</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            There are currently no blocked periods scheduled.
          </p>
          <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" />
            <span>Create Blocked Time</span>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Time (Budapest)</TableHead>
              <TableHead>End Time (Budapest)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const startParts = utcToBudapestParts(item.start_at);
              const endParts = utcToBudapestParts(item.end_at);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {startParts.formattedDateTime}
                  </TableCell>
                  <TableCell className="font-medium">
                    {endParts.formattedDateTime}
                  </TableCell>
                  <TableCell>
                    {item.reason ? (
                      <Badge variant="secondary">{item.reason}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No reason</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>
            {editingItem ? "Edit Blocked Period" : "Create Blocked Period"}
          </DialogTitle>
          <DialogDescription>
            Specify start and end date/time in Europe/Budapest timezone.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Note</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lunch break, Personal appointment"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : editingItem
                ? "Save Changes"
                : "Create Blocked Time"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this blocked time period?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Blocked Time"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
