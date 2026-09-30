"use client";

import * as React from "react";
import { User, Upload, Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  updateBarberAction,
  uploadBarberProfilePhotoAction,
  deleteBarberProfilePhotoAction,
} from "@/app/admin/(dashboard)/barbers/actions";

interface StaffProfileManagerProps {
  barber: Tables<"barbers">;
}

export function StaffProfileManager({ barber }: StaffProfileManagerProps) {

  const [name, setName] = React.useState(barber.name);
  const [bioEn, setBioEn] = React.useState(barber.bio_en || "");
  const [bioHu, setBioHu] = React.useState(barber.bio_hu || "");
  const [photoUrl, setPhotoUrl] = React.useState(barber.profile_photo_url || "");

  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("barberId", barber.id);

    const res = await uploadBarberProfilePhotoAction(formData);
    setUploadingPhoto(false);

    if (res.error) {
      setPhotoError(res.error);
    } else if (res.publicUrl) {
      setPhotoUrl(res.publicUrl);
      setStatusMsg("Profile photo updated successfully.");
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError(null);
    setUploadingPhoto(true);

    const res = await deleteBarberProfilePhotoAction(barber.id);
    setUploadingPhoto(false);

    if (res.error) {
      setPhotoError(res.error);
    } else {
      setPhotoUrl("");
      setStatusMsg("Profile photo removed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);

    const res = await updateBarberAction(barber.id, {
      name: name.trim(),
      profile_photo_url: photoUrl,
      bio_en: bioEn.trim() || null,
      bio_hu: bioHu.trim() || null,
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setStatusMsg("Profile updated successfully!");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          My Staff Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your public profile photo, name, and English/Hungarian bios.
        </p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-sm bg-emerald-500/15 p-4 text-xs font-medium text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-sm bg-destructive/15 p-4 text-xs font-medium text-destructive border border-destructive/30">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Photo Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif">Profile Photo</CardTitle>
          <CardDescription className="text-xs">
            Upload a high-quality portrait photo (JPEG, PNG, WEBP, max 5 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative size-24 shrink-0 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={photoUrl} alt={name} className="size-full object-cover" />
              ) : (
                <User className="size-12 text-muted-foreground/50" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="staff_photo_upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    {uploadingPhoto ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    <span>{photoUrl ? "Replace Photo" : "Upload Photo"}</span>
                  </div>
                  <Input
                    id="staff_photo_upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </Label>

                {photoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>

              {photoError && (
                <p className="text-xs text-destructive">{photoError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-serif">Public Details & Bios</CardTitle>
            <CardDescription className="text-xs">
              These details appear on the Barbod homepage and public booking team selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="space-y-2">
              <Label htmlFor="staff_name" className="text-xs uppercase font-semibold text-muted-foreground">
                Display Name *
              </Label>
              <Input
                id="staff_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_bio_en" className="text-xs uppercase font-semibold text-muted-foreground">
                Bio (English)
              </Label>
              <Textarea
                id="staff_bio_en"
                value={bioEn}
                onChange={(e) => setBioEn(e.target.value)}
                placeholder="Traditional precision cutting and hot towel beard styling specialist."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_bio_hu" className="text-xs uppercase font-semibold text-muted-foreground">
                Bio (Hungarian)
              </Label>
              <Textarea
                id="staff_bio_hu"
                value={bioHu}
                onChange={(e) => setBioHu(e.target.value)}
                placeholder="Prémium férfi hajvágás és szakállápolás szakértője."
                rows={3}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitting} className="gap-2 px-8 font-semibold uppercase text-xs">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>Save Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
