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
  Send,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  KeyRound,
  Copy,
  Check,
  AtSign,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  inviteOrConnectBarberAction,
  sendBarberPasswordResetAction,
  unlinkBarberUserAction,
  changeBarberLoginEmailAction,
} from "@/app/admin/(dashboard)/barbers/actions";

export type BarberWithServices = Tables<"barbers"> & {
  assignedServiceIds: string[];
  linkedEmail?: string | null;
};

interface BarbersManagerProps {
  barbers: BarberWithServices[];
  allServices: Tables<"services">[];
  ownerUserId?: string | null;
}

export function BarbersManager({ barbers, allServices, ownerUserId }: BarbersManagerProps) {
  const router = useRouter();
  const [prevBarbers, setPrevBarbers] = React.useState(barbers);
  const [barberList, setBarberList] = React.useState<BarberWithServices[]>(barbers);

  if (prevBarbers !== barbers) {
    setPrevBarbers(barbers);
    setBarberList(barbers);
  }

  // Change Login Email Dialog State
  const [emailBarber, setEmailBarber] = React.useState<BarberWithServices | null>(null);
  const [newBarberEmail, setNewBarberEmail] = React.useState("");
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const handleOpenEmailModal = (barber: BarberWithServices) => {
    setEmailBarber(barber);
    setNewBarberEmail("");
    setEmailStatus(null);
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailBarber || !newBarberEmail.trim()) return;
    setIsChangingEmail(true);
    setEmailStatus(null);
    const res = await changeBarberLoginEmailAction(emailBarber.id, newBarberEmail);
    setIsChangingEmail(false);
    if (res.error) {
      setEmailStatus({ type: "error", msg: res.error });
    } else {
      const updatedEmail = res.email ?? newBarberEmail.trim().toLowerCase();
      setEmailStatus({
        type: "success",
        msg: res.isOwner
          ? `Admin login email updated to ${updatedEmail}. You now sign in with this email (password unchanged). Notifications and contact settings synchronized.`
          : `Login email updated. ${emailBarber.name} now signs in with ${updatedEmail} (password unchanged). Notifications will go to the new address.`,
      });
      setNewBarberEmail("");
      setBarberList((prev) =>
        prev.map((b) => (b.id === emailBarber.id ? { ...b, linkedEmail: updatedEmail } : b))
      );
      setEmailBarber((prev) => (prev ? { ...prev, linkedEmail: updatedEmail } : null));
      router.refresh();
    }
  };
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

  // Invitation / Connect Dialog State
  const [invitingBarber, setInvitingBarber] = React.useState<BarberWithServices | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);
  const [inviteStatus, setInviteStatus] = React.useState<{
    type: "success" | "error";
    msg: string;
    link?: string | null;
  } | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = React.useState(false);

  // Reset Password Dialog State
  const [resetBarber, setResetBarber] = React.useState<BarberWithServices | null>(null);
  const [isSendingReset, setIsSendingReset] = React.useState(false);
  const [resetStatus, setResetStatus] = React.useState<{
    type: "success" | "error";
    msg: string;
    link?: string | null;
  } | null>(null);
  const [copiedResetLink, setCopiedResetLink] = React.useState(false);

  const handleOpenInviteModal = (barber: BarberWithServices) => {
    setInvitingBarber(barber);
    setInviteEmail(barber.linkedEmail || "");
    setInviteStatus(null);
    setCopiedInviteLink(false);
  };

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingBarber || !inviteEmail.trim()) return;
    setIsSendingInvite(true);
    setInviteStatus(null);
    setCopiedInviteLink(false);

    const res = await inviteOrConnectBarberAction(invitingBarber.id, inviteEmail);
    setIsSendingInvite(false);

    if (res.error) {
      setInviteStatus({ type: "error", msg: res.error });
    } else {
      const targetEmail = res.email || inviteEmail.trim().toLowerCase();
      setBarberList((prev) =>
        prev.map((b) =>
          b.id === invitingBarber.id ? { ...b, linkedEmail: targetEmail, user_id: b.user_id || "linked" } : b
        )
      );
      router.refresh();
      if (res.mode === "connected") {
        setInviteStatus({
          type: "success",
          msg: `Account (${res.email}) linked! Password setup email dispatched with real website link.`,
          link: res.actionLink,
        });
      } else {
        setInviteStatus({
          type: "success",
          msg: `Auth invitation email sent to ${res.email}! Account created & linked with real website link.`,
          link: res.actionLink,
        });
      }
    }
  };

  const handleSendPasswordReset = async (barber: BarberWithServices) => {
    setResetBarber(barber);
    setResetStatus(null);
    setCopiedResetLink(false);
    setIsSendingReset(true);

    const res = await sendBarberPasswordResetAction(barber.id);
    setIsSendingReset(false);

    if (res.error) {
      setResetStatus({ type: "error", msg: res.error });
    } else {
      setResetStatus({
        type: "success",
        msg: `Password reset email dispatched to ${res.email} with real website link!`,
        link: res.actionLink,
      });
    }
  };

  const handleUnlinkAccount = async (barber: BarberWithServices) => {
    if (!confirm(`Are you sure you want to unlink the Auth account from ${barber.name}?`)) {
      return;
    }

    const res = await unlinkBarberUserAction(barber.id);
    if (res.error) {
      alert(res.error);
    } else {
      setBarberList((prev) =>
        prev.map((b) => (b.id === barber.id ? { ...b, linkedEmail: null, user_id: null } : b))
      );
      router.refresh();
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

    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setPhotoError("Invalid file format. Only JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError("File size exceeds 5 MB. Please choose a smaller image.");
      return;
    }

    setPhotoError(null);

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
      const res = await createBarberAction(payload);
      if (res.error || !res.barber) {
        setSubmitting(false);
        setErrorMsg(res.error || "Failed to create barber.");
        return;
      }

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
      {barberList.length === 0 ? (
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
          {barberList.map((barber) => {
            const assignedCount = barber.assignedServiceIds.length;
            const isLinked = Boolean(barber.user_id);
            const isOwnerBarber = Boolean(ownerUserId && barber.user_id === ownerUserId);

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <CardTitle className="text-base font-serif font-semibold">
                          {barber.name}
                        </CardTitle>
                        {isOwnerBarber && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary py-0 px-1.5 font-normal">
                            Owner
                          </Badge>
                        )}
                      </div>
                      {barber.linkedEmail ? (
                        <p className="text-[11px] font-mono text-primary truncate max-w-[160px]" title={barber.linkedEmail}>
                          {barber.linkedEmail}
                        </p>
                      ) : (
                        <CardDescription className="text-xs font-mono">
                          Order #{barber.display_order}
                        </CardDescription>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={barber.is_active ? "success" : "secondary"}>
                      {barber.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={isLinked ? "info" : "outline"} className="text-[10px]">
                      {isLinked ? (isOwnerBarber ? "Admin Login" : "Linked Login") : "Unlinked Staff"}
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

                  {/* Account Management & Actions */}
                  <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between gap-1.5">
                      {isLinked ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleSendPasswordReset(barber)}
                            className="gap-1 text-[11px] text-primary border-primary/30 hover:bg-primary/10"
                            title="Send Password Reset Link"
                          >
                            <KeyRound className="size-3" />
                            <span>Reset Password</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEmailModal(barber)}
                            className="gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={isOwnerBarber ? "Change Admin / Barber Login Email" : "Change Barber Login Email"}
                          >
                            <AtSign className="size-3 text-primary" />
                            <span>Email</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleUnlinkAccount(barber)}
                            className="gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                            title="Unlink Auth Account"
                          >
                            <Unlink className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenInviteModal(barber)}
                          className="gap-1 text-[11px] text-primary border-primary/30 hover:bg-primary/10"
                        >
                          <Link2 className="size-3" />
                          <span>Connect / Invite</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggleActive(barber)}
                          className="gap-1 text-xs"
                          title={barber.is_active ? "Deactivate Barber" : "Activate Barber"}
                        >
                          <Power className={`size-3.5 ${barber.is_active ? "text-emerald-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEdit(barber)}
                          className="gap-1 text-xs"
                        >
                          <Edit2 className="size-3" />
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite / Connect Barber Auth Dialog */}
      {invitingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-2xl space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="size-5 text-primary" />
                <h2 className="text-lg font-bold font-serif">
                  Connect Account: {invitingBarber.name}
                </h2>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setInvitingBarber(null)}>
                ✕
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the barber&apos;s email address. If the email is brand new, an official invitation email will be sent. If an account already exists in Supabase Auth, it will be securely linked to this barber profile and a password setup email will be triggered.
            </p>

            {inviteStatus && (
              <div className="space-y-3">
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

                {inviteStatus.link && (
                  <div className="space-y-1.5 rounded-sm bg-muted/60 p-3 border border-border">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Link2 className="size-3.5 text-primary" />
                      Direct Setup Link (Real Website)
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      You can copy this link and send it directly to the barber via WhatsApp, SMS, or email:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        readOnly
                        value={inviteStatus.link}
                        className="text-xs font-mono bg-background select-all h-8"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (inviteStatus.link) {
                            navigator.clipboard.writeText(inviteStatus.link);
                            setCopiedInviteLink(true);
                            setTimeout(() => setCopiedInviteLink(false), 2500);
                          }
                        }}
                        className="shrink-0 gap-1.5 text-xs h-8 px-3"
                      >
                        {copiedInviteLink ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
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
                  placeholder="e.g. ne3mero@gmail.com"
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
                      <span>Processing Account...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Connect / Send Setup Email</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Login Email Modal */}
      {emailBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-2xl space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <AtSign className="size-5 text-primary shrink-0" />
                <h2 className="text-lg font-bold font-serif truncate">
                  Change Login Email: {emailBarber.name}
                </h2>
                {ownerUserId && emailBarber.user_id === ownerUserId && (
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary shrink-0 py-0.5 font-normal">
                    Admin / Owner
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="xs" onClick={() => setEmailBarber(null)}>
                ✕
              </Button>
            </div>

            <div className="rounded-sm border border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Current: </span>
              <span className="font-mono text-foreground break-all">{emailBarber.linkedEmail || "—"}</span>
            </div>

            {emailStatus && (
              <div
                className={`p-3 text-xs rounded-sm border flex items-start gap-2 ${
                  emailStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {emailStatus.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <span>{emailStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="new_barber_email" className="text-xs uppercase tracking-wider font-semibold">
                  New Login Email *
                </Label>
                <Input
                  id="new_barber_email"
                  type="email"
                  value={newBarberEmail}
                  onChange={(e) => setNewBarberEmail(e.target.value)}
                  placeholder="barber@example.com"
                  disabled={isChangingEmail}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {ownerUserId && emailBarber.user_id === ownerUserId
                    ? "Your password stays unchanged. You will sign in with this new email immediately, and atelier appointment alerts will be routed here."
                    : "The barber keeps their password and signs in with the new email immediately. All notifications will be delivered to this address."}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setEmailBarber(null)}>
                  {emailStatus?.type === "success" ? "Done" : "Cancel"}
                </Button>
                <Button size="sm" type="submit" disabled={isChangingEmail} className="gap-2">
                  {isChangingEmail ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <AtSign className="size-4" />
                  )}
                  <span>{isChangingEmail ? "Updating..." : "Change Email"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-2xl space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                <h2 className="text-lg font-bold font-serif">
                  Reset Password: {resetBarber.name}
                </h2>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setResetBarber(null)}>
                ✕
              </Button>
            </div>

            {isSendingReset ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Sending password reset email...</p>
              </div>
            ) : resetStatus ? (
              <div className="space-y-4">
                <div
                  className={`p-3 text-xs rounded-sm border flex items-start gap-2 ${
                    resetStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  {resetStatus.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  )}
                  <span>{resetStatus.msg}</span>
                </div>

                {resetStatus.link && (
                  <div className="space-y-1.5 rounded-sm bg-muted/60 p-3 border border-border">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Link2 className="size-3.5 text-primary" />
                      Direct Reset Link (Real Website)
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      You can copy this link and send it directly to the barber:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        readOnly
                        value={resetStatus.link}
                        className="text-xs font-mono bg-background select-all h-8"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (resetStatus.link) {
                            navigator.clipboard.writeText(resetStatus.link);
                            setCopiedResetLink(true);
                            setTimeout(() => setCopiedResetLink(false), 2500);
                          }
                        }}
                        className="shrink-0 gap-1.5 text-xs h-8 px-3"
                      >
                        {copiedResetLink ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-border">
                  <Button size="sm" onClick={() => setResetBarber(null)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
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

              {editingBarber && (
                <div className="rounded-sm border border-border bg-muted/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <AtSign className="size-3.5 text-primary" />
                      Login Account Email
                    </span>
                    {ownerUserId && editingBarber.user_id === ownerUserId && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-normal">
                        Admin / Owner
                      </Badge>
                    )}
                  </div>

                  {editingBarber.linkedEmail ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Current Sign-in Email:</p>
                        <p className="text-xs font-mono text-foreground font-medium truncate">
                          {editingBarber.linkedEmail}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setIsOpen(false);
                          handleOpenEmailModal(editingBarber);
                        }}
                        className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                      >
                        <AtSign className="size-3" />
                        <span>Change Email</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div>
                        <p className="text-xs font-medium text-foreground">No auth account connected</p>
                        <p className="text-[11px] text-muted-foreground">
                          Connect an email to allow this barber to log in and receive notifications.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setIsOpen(false);
                          handleOpenInviteModal(editingBarber);
                        }}
                        className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                      >
                        <Link2 className="size-3" />
                        <span>Connect / Invite</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
