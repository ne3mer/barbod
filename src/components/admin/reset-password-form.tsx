"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, KeyRound, Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, setIsPending] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<string>("recovery");

  useEffect(() => {
    const supabase = createClient();

    // 1. Check URL Fragment (#error=...) or Query string for error parameters
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      const fullParams = new URLSearchParams(hash.replace(/^#/, "?") || search);

      const errCode = fullParams.get("error_code");
      const errDesc = fullParams.get("error_description");

      if (errCode === "otp_expired" || errDesc?.includes("expired") || errDesc?.includes("invalid")) {
        setTimeout(() => {
          setError(
            "This password setup link has expired or was consumed by an email scanner. Please request a new password setup link from your business owner."
          );
        }, 0);
      }

      // 2. Check for token_hash or PKCE code in query parameters
      const qParams = new URLSearchParams(search);
      const th = qParams.get("token_hash");
      const type = qParams.get("type");
      const code = qParams.get("code");

      if (th) {
        setTimeout(() => {
          setTokenHash(th);
          if (type) setOtpType(type);
        }, 0);
      }

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error: exErr }) => {
          if (exErr) {
            console.error("Session exchange error:", exErr.message);
          }
        });
      }
    }

    // 3. Listen to auth state changes for PASSWORD_RECOVERY
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setError(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);

    try {
      const supabase = createClient();

      // If token_hash exists in query string and session isn't active yet, verify OTP first
      if (tokenHash) {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (otpType as "recovery" | "invite" | "magiclink" | "email") || "recovery",
        });

        if (verifyErr) {
          setError(`Token verification failed: ${verifyErr.message}`);
          setIsPending(false);
          return;
        }
      }

      // Update password for the established session
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        setError(updateErr.message);
        setIsPending(false);
        return;
      }

      setSuccess(true);
      setIsPending(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsPending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in">
        <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif">Password Established!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your login account credentials have been updated successfully. You can now sign into your staff workspace.
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/admin/login");
            router.refresh();
          }}
          className="w-full font-semibold"
        >
          Proceed to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-sm flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          placeholder="••••••••"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isPending}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full gap-2" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Updating Password...</span>
          </>
        ) : (
          <>
            <KeyRound className="size-4" />
            <span>Set New Password</span>
          </>
        )}
      </Button>
    </form>
  );
}
