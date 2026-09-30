"use client";

import * as React from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Scissors, AlertCircle } from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  createServiceAction,
  updateServiceAction,
  toggleServiceActiveAction,
  deleteServiceAction,
  reorderServicesAction,
} from "@/app/admin/(dashboard)/services/actions";

type Service = Tables<"services">;

interface ServicesManagerProps {
  initialServices: Service[];
  initialNewModalOpen?: boolean;
}

export function ServicesManager({
  initialServices,
  initialNewModalOpen = false,
}: ServicesManagerProps) {
  const [services, setServices] = React.useState<Service[]>(initialServices);

  const [isDialogOpen, setIsDialogOpen] = React.useState(initialNewModalOpen);
  const [editingService, setEditingService] = React.useState<Service | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = React.useState<Service | null>(null);

  // Form states
  const [nameEn, setNameEn] = React.useState("");
  const [nameHu, setNameHu] = React.useState("");
  const [descEn, setDescEn] = React.useState("");
  const [descHu, setDescHu] = React.useState("");
  const [price, setPrice] = React.useState<number | "">(10000);
  const [currency, setCurrency] = React.useState("HUF");
  const [durationMinutes, setDurationMinutes] = React.useState<number | "">(45);
  const [isActive, setIsActive] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const resetForm = () => {
    setNameEn("");
    setNameHu("");
    setDescEn("");
    setDescHu("");
    setPrice(10000);
    setCurrency("HUF");
    setDurationMinutes(45);
    setIsActive(true);
    setEditingService(null);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (svc: Service) => {
    setEditingService(svc);
    setNameEn(svc.name_en);
    setNameHu(svc.name_hu);
    setDescEn(svc.description_en ?? "");
    setDescHu(svc.description_hu ?? "");
    setPrice(svc.price);
    setCurrency(svc.currency);
    setDurationMinutes(svc.duration_minutes);
    setIsActive(svc.is_active);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      name_en: nameEn,
      name_hu: nameHu,
      description_en: descEn,
      description_hu: descHu,
      price: typeof price === "number" ? price : 0,
      currency: currency || "HUF",
      duration_minutes: typeof durationMinutes === "number" ? durationMinutes : 30,
      is_active: isActive,
    };

    let result;
    if (editingService) {
      result = await updateServiceAction(editingService.id, payload);
    } else {
      result = await createServiceAction({
        ...payload,
        sort_order: services.length,
      });
    }

    setLoading(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleToggleActive = async (svc: Service) => {
    const nextActive = !svc.is_active;
    // Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s.id === svc.id ? { ...s, is_active: nextActive } : s))
    );
    const res = await toggleServiceActiveAction(svc.id, nextActive);
    if (res.error) {
      // Revert on error
      setServices(initialServices);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteServiceAction(deleteTarget.id);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setDeleteTarget(null);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newServices = [...services];
    const [moved] = newServices.splice(index, 1);
    newServices.splice(targetIndex, 0, moved);

    setServices(newServices);
    await reorderServicesAction(newServices.map((s) => s.id));
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your barber services, pricing, durations, and visibility.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* Services Table */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <Scissors className="size-10 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">No services found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You haven&apos;t created any services yet. Click below to add your first service.
          </p>
          <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" />
            <span>Create First Service</span>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Order</TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((svc, index) => (
              <TableRow key={svc.id}>
                {/* Reorder arrows */}
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                      title="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === services.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                      title="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{svc.name_en}</span>
                    <span className="text-xs text-muted-foreground">
                      HU: {svc.name_hu}
                    </span>
                    {(svc.description_en || svc.description_hu) && (
                      <span className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
                        {svc.description_en || svc.description_hu}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell className="font-medium">
                  {new Intl.NumberFormat("hu-HU").format(svc.price)} {svc.currency}
                </TableCell>

                {/* Duration */}
                <TableCell>{svc.duration_minutes} mins</TableCell>

                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={svc.is_active}
                      onCheckedChange={() => handleToggleActive(svc)}
                    />
                    <Badge variant={svc.is_active ? "success" : "outline"}>
                      {svc.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenEdit(svc)}
                      title="Edit"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(svc)}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>
            {editingService ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            Configure pricing, language titles, and appointment duration.
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
              <Label htmlFor="name_en">English Name *</Label>
              <Input
                id="name_en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Haircut & Beard"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name_hu">Hungarian Name *</Label>
              <Input
                id="name_hu"
                value={nameHu}
                onChange={(e) => setNameHu(e.target.value)}
                placeholder="e.g. Hajvágás és Szakáll"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="HUF"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="duration">Duration (mins) *</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc_en">English Description</Label>
            <Textarea
              id="desc_en"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder="Brief description of service..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc_hu">Hungarian Description</Label>
            <Textarea
              id="desc_hu"
              value={descHu}
              onChange={(e) => setDescHu(e.target.value)}
              placeholder="Rövid leírás a szolgáltatásról..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="is_active" className="cursor-pointer text-xs">
              Enable this service for bookings
            </Label>
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
              {loading ? "Saving..." : editingService ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete service &quot;{deleteTarget?.name_en}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Service"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
