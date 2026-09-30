"use client";

import * as React from "react";
import { Save, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

import type { AdminBusiness } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessSettingsAction } from "@/app/admin/(dashboard)/settings/actions";

export function SettingsEditor({ business }: { business: AdminBusiness }) {
  const [name, setName] = React.useState(business.name);
  const [descEn, setDescEn] = React.useState(business.description_en ?? "");
  const [descHu, setDescHu] = React.useState(business.description_hu ?? "");
  const [phone, setPhone] = React.useState(business.phone ?? "");
  const [email, setEmail] = React.useState(business.email ?? "");
  const [address, setAddress] = React.useState(business.address ?? "");
  const [instagramUrl, setInstagramUrl] = React.useState(
    business.instagram_url ?? ""
  );
  const [logoUrl, setLogoUrl] = React.useState(business.logo_url ?? "");

  const [saving, setSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await updateBusinessSettingsAction({
      name,
      description_en: descEn,
      description_hu: descHu,
      phone,
      email,
      address,
      instagram_url: instagramUrl,
      logo_url: logoUrl,
    });

    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Business profile updated successfully!");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update business contact info, descriptions, and branding details.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2 shrink-0">
          <Save className="size-4" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Business Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            General Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b_name">Business Name *</Label>
              <Input
                id="b_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b_slug">Slug (URL identifier)</Label>
              <Input
                id="b_slug"
                value={business.slug}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b_desc_en">English Description</Label>
            <Textarea
              id="b_desc_en"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder="Tell customers about your barbershop..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b_desc_hu">Hungarian Description</Label>
            <Textarea
              id="b_desc_hu"
              value={descHu}
              onChange={(e) => setDescHu(e.target.value)}
              placeholder="Mondja el az ügyfeleknek a borbélyüzletéről..."
              rows={3}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Contact & Location
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b_phone">Phone Number</Label>
              <Input
                id="b_phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+36 30 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b_email">Contact Email</Label>
              <Input
                id="b_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@barbodbarber.hu"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b_address">Physical Address</Label>
            <Input
              id="b_address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1051 Budapest, Kossuth Lajos utca 12."
            />
          </div>
        </div>

        {/* Links & Branding */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Branding & Social
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b_instagram">Instagram Profile URL</Label>
              <Input
                id="b_instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/barbodbarber"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b_logo">Logo URL</Label>
              <Input
                id="b_logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="gap-2 px-6">
            <Save className="size-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
