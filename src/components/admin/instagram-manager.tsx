"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Key,
  LogOut,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import type { InstagramFeedResponse } from "@/lib/instagram/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  refreshInstagramFeedCacheAction,
  disconnectInstagramAction,
} from "@/app/admin/(dashboard)/instagram/actions";

interface InstagramManagerProps {
  feed: InstagramFeedResponse;
  userRole: "owner" | "staff";
}

export function InstagramManager({ feed, userRole }: InstagramManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);
  const urlSuccess = searchParams.get("success");
  const urlError = searchParams.get("error");

  const [localMsg, setLocalMsg] = React.useState<{ text: string; isError: boolean } | null>(null);

  const msg = localMsg || (urlSuccess === "connected"
    ? { text: "Instagram account successfully authorized and connected!", isError: false }
    : urlError
    ? { text: `Connection Error: ${decodeURIComponent(urlError)}`, isError: true }
    : null);

  const handleRefresh = async () => {
    setLoading(true);
    setLocalMsg(null);
    const res = await refreshInstagramFeedCacheAction();
    setLoading(false);
    if (res.error) {
      setLocalMsg({ text: `Error: ${res.error}`, isError: true });
    } else {
      setLocalMsg({ text: "Instagram feed cache successfully refreshed!", isError: false });
      router.refresh();
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Instagram? This will remove the authorized credential and revert to fallback media.")) {
      return;
    }
    setDisconnecting(true);
    setLocalMsg(null);
    const res = await disconnectInstagramAction();
    setDisconnecting(false);
    if (res.error) {
      setLocalMsg({ text: `Error disconnecting: ${res.error}`, isError: true });
    } else {
      setLocalMsg({ text: "Instagram account disconnected.", isError: false });
      router.refresh();
    }
  };

  const isConnected = feed.connectionStatus === "CONNECTED";
  const isExpired = feed.connectionStatus === "EXPIRED";
  const accountName = feed.connectedAccount?.username || "barbod.barber.hu";
  const isOwner = userRole === "owner";

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-1">
            <InstagramIcon className="size-4 shrink-0" />
            <span>INSTAGRAM PLATFORM OAUTH</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Instagram Feed Connection
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Connect your Barbod Instagram account (@barbod.barber.hu) via official Meta OAuth authorization to display recent work in &quot;From the Atelier&quot;.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="gap-2 text-xs font-semibold uppercase tracking-wider min-h-[40px] px-4"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Feed Cache"}</span>
          </Button>

          {isConnected && isOwner && (
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="destructive"
              className="gap-2 text-xs font-semibold uppercase tracking-wider min-h-[40px] px-4"
            >
              <LogOut className="size-3.5" />
              <span>{disconnecting ? "Disconnecting..." : "Disconnect"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-4 rounded-lg border text-xs font-mono flex items-center justify-between ${
            msg.isError
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/30 text-primary"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setLocalMsg(null)} className="opacity-70 hover:opacity-100 text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* 2. Main OAuth Action & Connection Overview Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-foreground">
                Connection Status
              </h2>
              {isConnected ? (
                <Badge variant="success" className="gap-1 px-2.5 py-0.5 text-xs">
                  <CheckCircle2 className="size-3" /> CONNECTED ✓
                </Badge>
              ) : isExpired ? (
                <Badge variant="destructive" className="gap-1 px-2.5 py-0.5 text-xs">
                  <AlertTriangle className="size-3" /> TOKEN EXPIRED
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 text-xs">
                  NOT CONNECTED
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isConnected
                ? `Authorized as @${accountName}. Serving live media posts from Instagram Platform API.`
                : isExpired
                ? "Your Instagram Access Token has expired. Please re-authorize your account."
                : "No live Instagram account authorized. Authorize @barbod.barber.hu to replace fallback media with live posts."}
            </p>
          </div>

          {/* Connect / Reconnect CTA Button */}
          {(!isConnected || isExpired) && (
            <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
              {isOwner ? (
                <a
                  href="/api/auth/instagram"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <InstagramIcon className="size-4 shrink-0" />
                  <span>{isExpired ? "RECONNECT INSTAGRAM" : "CONNECT INSTAGRAM"}</span>
                </a>
              ) : (
                <Button disabled variant="outline" className="gap-2 text-xs">
                  <ShieldAlert className="size-3.5" />
                  <span>Owner Permission Required</span>
                </Button>
              )}
              <span className="text-[10px] font-mono text-muted-foreground">
                Official Meta OAuth Authorization
              </span>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-1">
            <span className="eyebrow block text-[10px]">AUTHORIZED USER</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold font-mono text-foreground">
                @{accountName}
              </span>
              <a
                href={`https://www.instagram.com/${accountName}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-1">
            <span className="eyebrow block text-[10px]">MEDIA STATUS</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold font-mono text-foreground">
                {feed.data.length} Posts Synced
              </span>
              {feed.isFallback ? (
                <span className="text-[10px] font-mono text-amber-500 font-bold">FALLBACK MODE</span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-500 font-bold">LIVE API</span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-1">
            <span className="eyebrow block text-[10px]">LAST SYNCED</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold font-mono text-foreground">
                {new Date(feed.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">1hr Server Cache</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Media Grid Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
            <span>Displayed Media Posts ({feed.data.length})</span>
            {feed.isFallback && (
              <Badge variant="warning" className="text-[10px]">
                Fallback Content
              </Badge>
            )}
          </h3>
          <span className="text-xs font-mono text-muted-foreground">
            Homepage &quot;From the Atelier&quot;
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feed.data.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={item.media_url}
                    alt={item.caption || "Instagram post"}
                    className="size-full object-cover"
                  />
                  {item.is_reel && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/80 border border-white/20 px-2.5 py-0.5 text-[10px] font-mono text-primary font-bold">
                      REEL
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>@{item.username || accountName}</span>
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-foreground/90 font-light line-clamp-2 leading-relaxed">
                    {item.caption || "No caption provided"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
                >
                  <span>Open Instagram</span>
                  <ExternalLink className="size-3" />
                </a>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {item.media_type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Meta Developer Configuration Guide */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Key className="size-4 text-primary" />
          <span>Meta Developer Setup & OAuth Architecture</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          For the owner to connect live Instagram data, configure the Meta App settings in Vercel and <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">.env.local</code>:
        </p>

        <div className="bg-muted p-4 rounded-lg font-mono text-xs text-foreground space-y-1 overflow-x-auto">
          <div><span className="text-muted-foreground"># Meta / Instagram OAuth Application Credentials</span></div>
          <div>INSTAGRAM_APP_ID=your_meta_app_id</div>
          <div>INSTAGRAM_APP_SECRET=your_meta_app_secret</div>
          <div className="pt-2"><span className="text-muted-foreground"># Server-Only Token Encryption Secret (32-byte fallback via SUPABASE_SERVICE_ROLE_KEY)</span></div>
          <div>INSTAGRAM_ENCRYPTION_SECRET=your_random_32_character_secret</div>
        </div>

        <div className="text-xs text-muted-foreground space-y-2 pt-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Meta Developer App Setup Checklist:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
            <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">developers.facebook.com</a> and select your Meta App.</li>
            <li>Add product: <strong>Instagram Platform API</strong> (Instagram Login).</li>
            <li>In Instagram Settings, add the exact OAuth Redirect URI:
              <br />
              <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded ml-4 inline-block my-1">
                https://barbod-gold.vercel.app/api/auth/instagram/callback
              </code>
            </li>
            <li>Request minimal permission: <code className="font-mono text-primary">instagram_business_basic</code>.</li>
            <li>Save App ID into <code className="font-mono text-primary">INSTAGRAM_APP_ID</code> and App Secret into <code className="font-mono text-primary">INSTAGRAM_APP_SECRET</code> in Vercel settings.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
