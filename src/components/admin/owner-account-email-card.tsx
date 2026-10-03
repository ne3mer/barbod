"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnerLoginEmailAction } from "@/app/admin/(dashboard)/settings/actions";

interface OwnerAccountEmailCardProps {
  currentEmail: string;
}

export function OwnerAccountEmailCard({ currentEmail }: OwnerAccountEmailCardProps) {
  const router = useRouter();
  const [emailOverride, setEmailOverride] = React.useState<string | null>(null);
  const email = emailOverride ?? currentEmail;

  const [newEmail, setNewEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!newEmail.trim()) {
      setStatus({ type: "error", msg: "Please enter the new email address." });
      return;
    }
    setSaving(true);
    const res = await changeOwnerLoginEmailAction(newEmail, password);
    setSaving(false);

    if (res.error) {
      setStatus({ type: "error", msg: res.error });
      return;
    }

    setEmailOverride(res.email ?? newEmail);
    setNewEmail("");
    setPassword("");
    setStatus({
      type: "success",
      msg: `Login email changed successfully. From now on, sign in with ${res.email}.`,
    });
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Account Login Email
          </h3>
          <p className="text-xs text-muted-foreground">
            The email you (the owner) use to sign in to the admin panel and receive barber notifications.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-muted/40 px-4 py-3 flex items-center gap-2 min-w-0">
        <AtSign className="size-4 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground shrink-0">Current:</span>
        <span className="text-sm font-mono text-foreground truncate">{email}</span>
      </div>

      {status && (
        <div
          className={`p-3 text-xs rounded-sm border flex items-start gap-2 ${
            status.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="owner_new_email">New Login Email</Label>
          <Input
            id="owner_new_email"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="owner@barbodbarber.hu"
            disabled={saving}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="owner_current_password">
            Current Password <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
          </Label>
          <Input
            id="owner_current_password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty or enter password"
            disabled={saving}
          />
        </div>
        <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Your password stays the same. Only the sign-in email changes.
          </p>
          <Button type="submit" disabled={saving} className="gap-2 shrink-0">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <AtSign className="size-4" />}
            <span>{saving ? "Updating..." : "Change Email"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
