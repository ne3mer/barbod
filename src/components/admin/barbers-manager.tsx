"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import {
  User,
  Plus,
  Edit2,
  Trash2,
  Scissors,
  Loader2,
  Power,
  Upload,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  createBarberAction,
  updateBarberAction,
  toggleBarberActiveAction,
  deleteBarberAction,
  uploadBarberProfilePhotoAction,
  deleteBarberProfilePhotoAction,
  inviteBarberUserAction,
} from "@/app/admin/(dashboard)/barbers/actions";

export type BarberWithServices = Tables<"barbers"> & {
  assignedServiceIds: string[];
};

interface BarbersManagerProps {
  barbers: BarberWithServices[];
  allServices: Tables<"services">[];
}

export function BarbersManager({ barbers, allServices }: BarbersManagerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingBarber, setEditingBarber] = React.useState<BarberWithServices | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState("");
  const [bioEn, setBioEn] = React.useState("");
  const [bioHu, setBioHu] = React.useState("");
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>([]);
  const [stagedFile, setStagedFile] = React.useState<File | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Invitation Dialog State
  const [invitingBarber, setInvitingBarber] = React.useState<BarberWithServices | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);
  const [inviteStatus, setInviteStatus] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleOpenInviteModal = (barber: BarberWithServices) => {
    setInvitingBarber(barber);
    setInviteEmail("");
    setInviteStatus(null);
  };

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingBarber || !inviteEmail.trim()) return;
    setIsSendingInvite(true);
    setInviteStatus(null);

    const res = await inviteBarberUserAction(invitingBarber.id, inviteEmail);
    setIsSendingInvite(false);

    if (res.error) {
      setInviteStatus({ type: "error", msg: res.error });
    } else {
      setInviteStatus({
        type: "success",
        msg: `Invitation sent to ${res.email}! Account is linked to ${invitingBarber.name}.`,
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingBarber(null);
    setName("");
    setUserId("");
    setProfilePhotoUrl("");
    setBioEn("");
    setBioHu("");
    setDisplayOrder(barbers.length);
    setIsActive(true);
    setSelectedServiceIds(allServices.map((s) => s.id));
    setStagedFile(null);
    setPhotoError(null);
    setErrorMsg(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (barber: BarberWithServices) => {
    setEditingBarber(barber);
    setName(barber.name);
    setUserId(barber.user_id || "");
    setProfilePhotoUrl(barber.profile_photo_url || "");
    setBioEn(barber.bio_en || "");
    setBioHu(barber.bio_hu || "");
    setDisplayOrder(barber.display_order);
    setIsActive(barber.is_active);
    setSelectedServiceIds(barber.assignedServiceIds);
    setStagedFile(null);
    setPhotoError(null);
    setErrorMsg(null);
    setIsOpen(true);
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Client-side MIME validation
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setPhotoError("Invalid file format. Only JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    // 2. Client-side Size validation (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError("File size exceeds 5 MB. Please choose a smaller image.");
      return;
    }

    setPhotoError(null);

    // If editing existing barber, upload immediately
    if (editingBarber) {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("barberId", editingBarber.id);

      const res = await uploadBarberProfilePhotoAction(formData);
      setUploadingPhoto(false);

      if (res.error) {
        setPhotoError(res.error);
      } else if (res.publicUrl) {
        setProfilePhotoUrl(res.publicUrl);
      }
    } else {
      // If adding new barber, stage file and preview locally
      setStagedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePhotoUrl(previewUrl);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError(null);
    if (editingBarber) {
      setUploadingPhoto(true);
      const res = await deleteBarberProfilePhotoAction(editingBarber.id);
      setUploadingPhoto(false);
      if (res.error) {
        setPhotoError(res.error);
      } else {
        setProfilePhotoUrl("");
      }
    } else {
      setStagedFile(null);
      setProfilePhotoUrl("");
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name,
      user_id: userId.trim() || null,
      profile_photo_url: profilePhotoUrl,
      bio_en: bioEn,
      bio_hu: bioHu,
      display_order: displayOrder,
      is_active: isActive,
      serviceIds: selectedServiceIds,
    };


    if (editingBarber) {
      const res = await updateBarberAction(editingBarber.id, payload);
      setSubmitting(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
      }
    } else {
      // Create barber first
      const res = await createBarberAction(payload);
      if (res.error || !res.barber) {
        setSubmitting(false);
        setErrorMsg(res.error || "Failed to create barber.");
        return;
      }

      // Upload photo if staged
      if (stagedFile) {
        const formData = new FormData();
        formData.append("file", stagedFile);
        formData.append("barberId", res.barber.id);
        await uploadBarberProfilePhotoAction(formData);
      }

      setSubmitting(false);
      setIsOpen(false);
    }
  };

  const handleToggleActive = async (barber: BarberWithServices) => {
    await toggleBarberActiveAction(barber.id, !barber.is_active);
  };

  const handleDelete = async (barber: BarberWithServices) => {
    if (!confirm(`Are you sure you want to delete ${barber.name}?`)) return;
    const res = await deleteBarberAction(barber.id);
    if (res.error) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Barbers & Staff Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage team profiles, upload barber profile photos, bios, and service offerings.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 text-xs font-semibold uppercase tracking-wider">
          <Plus className="size-4" />
          <span>Add New Barber</span>
        </Button>
      </div>

      {/* Barbers Grid */}
      {barbers.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <User className="size-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-medium">No Barbers Configured</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Click &quot;Add New Barber&quot; to create your first team member profile.
          </p>
          <Button onClick={handleOpenAdd} size="sm" className="mt-4 gap-2 text-xs">
            <Plus className="size-4" />
            <span>Create Primary Barber</span>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => {
            const assignedCount = barber.assignedServiceIds.length;

            return (
              <Card
                key={barber.id}
                className={`relative overflow-hidden transition-all duration-200 border ${
                  !barber.is_active ? "opacity-60 bg-muted/20" : "hover:border-primary/50"
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-3 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                      {barber.profile_photo_url ? (
                        <img
                          src={barber.profile_photo_url}
                          alt={barber.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-serif font-semibold">
                        {barber.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono">
                        Order #{barber.display_order}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={barber.is_active ? "success" : "secondary"}>
                      {barber.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={barber.user_id ? "info" : "outline"} className="text-[10px]">
                      {barber.user_id ? "Linked Login" : "Unlinked Staff"}
                    </Badge>
                  </div>

                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Bios */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {barber.bio_en && (
                      <p className="line-clamp-2">
                        <span className="font-semibold text-foreground">EN:</span> {barber.bio_en}
                      </p>
                    )}
                    {barber.bio_hu && (
                      <p className="line-clamp-2">
                        <span className="font-semibold text-foreground">HU:</span> {barber.bio_hu}
                      </p>
                    )}
                  </div>

                  {/* Services Offered Count */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <Scissors className="size-3.5 text-primary" />
                    <span>
                      Offers <strong className="text-foreground">{assignedCount}</strong> of {allServices.length} services
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleToggleActive(barber)}
                      className="gap-1.5 text-xs"
                    >
                      <Power className={`size-3.5 ${barber.is_active ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <span>{barber.is_active ? "Deactivate" : "Activate"}</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenInviteModal(barber)}
                        className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Mail className="size-3" />
                        <span>Invite</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(barber)}
                        className="gap-1 text-xs"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDelete(barber)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite Barber Auth Dialog */}
      {invitingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-2xl space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                <h2 className="text-lg font-bold font-serif">
                  Invite Barber Login: {invitingBarber.name}
                </h2>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setInvitingBarber(null)}>
                ✕
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Sends an official authentication invitation email via Supabase Auth Admin API.
              The barber will receive a password setup link, and their login account will be automatically linked to this barber profile upon confirmation.
            </p>

            {inviteStatus && (
              <div
                className={`p-3 text-xs rounded-sm border flex items-start gap-2 ${
                  inviteStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {inviteStatus.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <span>{inviteStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleSendInviteSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="inv_email" className="text-xs uppercase tracking-wider font-semibold">
                  Barber Email Address *
                </Label>
                <Input
                  id="inv_email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. barber@barbod.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setInvitingBarber(null)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={isSendingInvite} className="gap-2">
                  {isSendingInvite ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Send Auth Invitation</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif">
                {editingBarber ? `Edit Barber: ${editingBarber.name}` : "Add New Barber"}
              </h2>
              <Button variant="ghost" size="xs" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="b_name" className="text-xs uppercase tracking-wider font-semibold">
                  Barber Full Name *
                </Label>
                <Input
                  id="b_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Barbod, Alex, Marco"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="b_user_id" className="text-xs uppercase tracking-wider font-semibold">
                  Linked Auth User ID (Optional)
                </Label>
                <Input
                  id="b_user_id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Supabase Auth User ID (e.g. 58708539-...)"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Linking a Supabase Auth user ID enables independent staff login for this barber.
                </p>
              </div>


              {/* PROFILE PHOTO UPLOAD WIDGET */}
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-xs uppercase tracking-wider font-semibold block">
                  Profile Photo
                </Label>

                <div className="flex items-center gap-4 p-3 rounded-sm border border-border bg-muted/20">
                  <div className="relative size-16 rounded-full overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
                    {profilePhotoUrl ? (
                      <img
                        src={profilePhotoUrl}
                        alt="Barber photo preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="size-8 text-muted-foreground/60" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            <span>{profilePhotoUrl ? "Replace Photo" : "Upload Photo"}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingPhoto}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>

                      {profilePhotoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleRemovePhoto}
                          disabled={uploadingPhoto}
                          className="text-destructive hover:bg-destructive/10 border-destructive/30 text-xs"
                        >
                          <Trash2 className="size-3 mr-1" />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Allowed: JPEG, PNG, WEBP (Max size: 5 MB).
                    </p>

                    {photoError && (
                      <p className="text-xs text-destructive font-medium animate-in fade-in">
                        {photoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="b_bio_en" className="text-xs uppercase tracking-wider font-semibold">
                    Bio (English)
                  </Label>
                  <Textarea
                    id="b_bio_en"
                    value={bioEn}
                    onChange={(e) => setBioEn(e.target.value)}
                    placeholder="Master barber bio..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="b_bio_hu" className="text-xs uppercase tracking-wider font-semibold">
                    Bio (Hungarian)
                  </Label>
                  <Textarea
                    id="b_bio_hu"
                    value={bioHu}
                    onChange={(e) => setBioHu(e.target.value)}
                    placeholder="Borbély leírás magyarul..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="b_order" className="text-xs uppercase tracking-wider font-semibold">
                    Display Order
                  </Label>
                  <Input
                    id="b_order"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="b_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  <Label htmlFor="b_active" className="text-xs font-semibold">
                    Active Barber (Accepting Bookings)
                  </Label>
                </div>
              </div>

              {/* Service Assignments */}
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-xs uppercase tracking-wider font-semibold block">
                  Assigned Services ({selectedServiceIds.length}/{allServices.length})
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-sm bg-muted/20">
                  {allServices.map((svc) => {
                    const isChecked = selectedServiceIds.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`flex items-center gap-2 p-2 rounded-sm border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "border-primary/50 bg-primary/10 text-foreground font-medium"
                            : "border-border/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleService(svc.id)}
                          className="size-3.5 rounded border-border"
                        />
                        <span className="truncate">{svc.name_en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || uploadingPhoto} className="gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingBarber ? "Save Changes" : "Create Barber"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
