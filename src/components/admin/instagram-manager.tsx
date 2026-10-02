"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Key,
} from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import type { InstagramFeedResponse } from "@/lib/instagram/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { refreshInstagramFeedCacheAction } from "@/app/admin/(dashboard)/instagram/actions";

interface InstagramManagerProps {
  feed: InstagramFeedResponse;
}

export function InstagramManager({ feed }: InstagramManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setMsg(null);
    const res = await refreshInstagramFeedCacheAction();
    setLoading(false);
    if (res.error) {
      setMsg(`Error: ${res.error}`);
    } else {
      setMsg("Instagram feed cache successfully refreshed!");
      router.refresh();
    }
  };

  const isConnected = !feed.isFallback;

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-1">
            <InstagramIcon className="size-4 shrink-0" />
            <span>INSTAGRAM PLATFORM API</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Atelier Instagram Feed
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Manage real-time Instagram Platform API connection (Instagram Login for Professional Accounts), view synced media, and revalidate cache for @barbod.barber.hu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2 text-xs font-semibold uppercase tracking-wider min-h-[40px] px-5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Feed Cache"}</span>
          </Button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-lg bg-card border border-border text-xs font-mono text-primary flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>
      )}

      {/* 2. Connection Status & Account Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Status Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <span className="eyebrow block text-[10px]">API STATUS</span>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {isConnected ? "Connected" : "Fallback Mode"}
            </h3>
            {isConnected ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" /> Live API
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="size-3" /> Token Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-light">
            {isConnected
              ? "Instagram Platform API token is active and serving live posts."
              : "Serving curated Barbod Atelier fallback posts. Add INSTAGRAM_ACCESS_TOKEN to connect live account."}
          </p>
        </div>

        {/* Account Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <span className="eyebrow block text-[10px]">ACCOUNT</span>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground font-mono">
              @barbod.barber.hu
            </h3>
            <a
              href="https://www.instagram.com/barbod.barber.hu"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
            >
              <span>View Profile</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Professional Account (Business or Creator)
          </p>
        </div>

        {/* Cache Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <span className="eyebrow block text-[10px]">LAST SYNCED</span>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground font-mono text-sm">
              {new Date(feed.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {feed.data.length} Posts
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Automatic 1-hour server-side revalidation cache.
          </p>
        </div>
      </div>

      {/* 3. Media Grid Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Synced Media Posts ({feed.data.length})
          </h3>
          <span className="text-xs font-mono text-muted-foreground">
            Displayed on Homepage
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feed.data.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between space-y-4 shadow-sm"
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
                    <span>@{item.username || "barbod.barber.hu"}</span>
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

      {/* 4. Credentials Setup Guide */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Key className="size-4 text-primary" />
          <span>Meta / Instagram API Configuration Guide (Instagram Platform API with Instagram Login)</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To connect your live <strong className="text-foreground">@barbod.barber.hu</strong> Professional Instagram account (Business or Creator), add the access token to Vercel and your <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">.env.local</code> file:
        </p>
        <div className="bg-muted p-4 rounded-lg font-mono text-xs text-foreground space-y-1 overflow-x-auto">
          <div><span className="text-muted-foreground"># Server-only Instagram User Access Token (Instagram Platform API)</span></div>
          <div>INSTAGRAM_ACCESS_TOKEN=IGQJ...</div>
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Setup & Authentication Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>Account Type:</strong> Instagram Professional Account (Business or Creator). Personal accounts are not supported.</li>
            <li><strong>Auth Method:</strong> Instagram API with Instagram Login.</li>
            <li><strong>Minimal Permission:</strong> <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">instagram_business_basic</code> (read profile & media).</li>
            <li><strong>Endpoint Used:</strong> <code className="font-mono text-foreground">https://graph.instagram.com/v22.0/me/media</code></li>
          </ul>
          <p className="pt-2"><strong>Steps to obtain Access Token:</strong></p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Log into <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">developers.facebook.com</a> and create a Meta App.</li>
            <li>Add product: <strong>Instagram Platform API</strong> (Instagram Login for Business/Creator).</li>
            <li>Authorize @barbod.barber.hu with permission <code className="font-mono text-primary">instagram_business_basic</code>.</li>
            <li>Generate a long-lived Access Token.</li>
            <li>Set <code className="font-mono text-primary">INSTAGRAM_ACCESS_TOKEN</code> in Vercel project settings under Environment Variables.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
