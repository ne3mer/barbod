"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { ExternalLink, Play } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import type { InstagramMediaItem } from "@/lib/instagram/types";
import { useLanguage } from "@/lib/i18n/context";

interface AtelierInstagramFeedProps {
  items: InstagramMediaItem[];
}

export function AtelierInstagramFeed({ items }: AtelierInstagramFeedProps) {
  const { lang } = useLanguage();
  const displayItems = items.length > 0 ? items.slice(0, 6) : [];

  const tTitle = lang === "hu" ? "AZ ATELIERBŐL" : "FROM THE ATELIER";
  const tSubtitle =
    lang === "hu"
      ? "Legújabb munkák, pillanatok és részletek a @barbod.barber.hu-tól"
      : "Recent work, moments & details from @barbod.barber.hu";
  const tFollow = lang === "hu" ? "KÖVESSE A @BARBOD.BARBER.HU-T ↗" : "FOLLOW @BARBOD.BARBER.HU ↗";
  const tViewOnInsta = lang === "hu" ? "MEGTEKINTÉS INSTAGRAMON ↗" : "VIEW ON INSTAGRAM ↗";

  if (displayItems.length === 0) return null;

  return (
    <section id="atelier" className="mx-auto max-w-7xl px-4 sm:px-6 w-full min-w-0 scroll-mt-24 space-y-8 sm:space-y-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 min-w-0">
        <div className="space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-primary">
            <InstagramIcon className="size-3.5 shrink-0" />
            <span>@BARBOD.BARBER.HU</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif break-words">
            {tTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-xl leading-relaxed">
            {tSubtitle}
          </p>
        </div>

        <a
          href="https://www.instagram.com/barbod.barber.hu"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        >
          <span>{tFollow}</span>
        </a>
      </div>

      {/* DESKTOP EDITORIAL ASYMMETRIC GRID (>= 768px) */}
      <div className="hidden md:grid grid-cols-12 gap-4 lg:gap-6 min-w-0">
        {displayItems.map((item, idx) => {
          // Asymmetric column distribution
          const colSpanClass =
            idx === 0
              ? "col-span-7 row-span-2 aspect-4/5"
              : idx === 1
              ? "col-span-5 aspect-16/10"
              : idx === 2
              ? "col-span-5 aspect-16/10"
              : idx === 3
              ? "col-span-4 aspect-4/5"
              : idx === 4
              ? "col-span-4 aspect-square"
              : "col-span-4 aspect-square";

          const isReel = item.is_reel || item.media_type === "VIDEO";
          const formattedDate = new Date(item.timestamp).toLocaleDateString(
            lang === "hu" ? "hu-HU" : "en-US",
            { month: "short", day: "numeric" }
          );

          return (
            <a
              key={item.id}
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              className={`group relative overflow-hidden rounded-sm border border-white/10 bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 ${colSpanClass}`}
            >
              {/* Media Container */}
              <img
                src={item.media_url}
                alt={item.caption || "Barbod Barber Instagram post"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />

              {/* REEL Badge */}
              {isReel && (
                <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary shadow-lg">
                  <Play className="size-3 fill-primary text-primary" />
                  <span>REEL</span>
                </div>
              )}

              {/* Hover Translucent Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-between">
                <div className="flex justify-end">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ExternalLink className="size-4" />
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-primary font-semibold uppercase tracking-wider">
                    <span>@{item.username || "barbod.barber.hu"}</span>
                    <span>{formattedDate}</span>
                  </div>

                  {item.caption && (
                    <p className="text-xs text-foreground/90 font-light line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}

                  <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-widest text-primary pt-1">
                    {tViewOnInsta}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* MOBILE HORIZONTAL EDITORIAL CAROUSEL (< 768px) */}
      <div className="md:hidden space-y-3 min-w-0">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3.5 pb-2 -mx-4 px-4 min-w-0">
          {displayItems.map((item) => {
            const isReel = item.is_reel || item.media_type === "VIDEO";
            const formattedDate = new Date(item.timestamp).toLocaleDateString(
              lang === "hu" ? "hu-HU" : "en-US",
              { month: "short", day: "numeric" }
            );

            return (
              <a
                key={item.id}
                href={item.permalink}
                target="_blank"
                rel="noreferrer"
                className="snap-center shrink-0 w-[78vw] max-w-[290px] aspect-4/5 relative rounded-sm border border-white/15 bg-card overflow-hidden group shadow-lg"
              >
                <img
                  src={item.media_url}
                  alt={item.caption || "Barbod Barber Instagram media"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* REEL Badge */}
                {isReel && (
                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-primary">
                    <Play className="size-2.5 fill-primary text-primary" />
                    <span>REEL</span>
                  </div>
                )}

                {/* Bottom Overlay Card */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-primary font-semibold">
                    <span>@{item.username || "barbod.barber.hu"}</span>
                    <span>{formattedDate}</span>
                  </div>
                  {item.caption && (
                    <p className="text-xs text-foreground/90 font-light line-clamp-2 leading-tight">
                      {item.caption}
                    </p>
                  )}
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary/90 flex items-center gap-1 pt-0.5">
                    <span>{tViewOnInsta}</span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Carousel Swipe Cue */}
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1 pt-1">
          <span>← Swipe to explore atelier feed</span>
          <span>{displayItems.length} Posts</span>
        </div>
      </div>
    </section>
  );
}
