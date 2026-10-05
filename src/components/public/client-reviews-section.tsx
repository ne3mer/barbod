"use client";

import * as React from "react";
import Link from "next/link";
import { Star, CheckCircle2, Quote, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { DEMO_REVIEWS, DEMO_BUSINESS } from "@/lib/config/demo-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ClientReviewsSection() {
  const { lang } = useLanguage();
  const [filterRating, setFilterRating] = React.useState<number | "all">("all");

  const reviews = React.useMemo(() => {
    if (filterRating === "all") return DEMO_REVIEWS;
    return DEMO_REVIEWS.filter((r) => r.rating === filterRating);
  }, [filterRating]);

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-12">
      {/* Header & Rating Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            <span>{lang === "hu" ? "VENDÉGÉLMÉNYEK & ÉRTÉKELÉSEK" : "PATRON EXPERIENCES · REVIEWS"}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground font-serif uppercase">
            {lang === "hu" ? "Kifinomult férfiak" : "Words from"}
            <br />
            <span className="italic font-extralight text-primary">
              {lang === "hu" ? "őszinte véleménye." : "Refined Gentlemen."}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-lg">
            {lang === "hu"
              ? "Vendégeink bizalma a legnagyobb büszkeségünk. Olvassa el a Budapest szívében átélt élményeket."
              : "Read unvarnished feedback from local residents, expatriates, and travelers who trust Barbod Barber Atelier."}
          </p>
        </div>

        {/* Aggregate Social Proof Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-sm border border-white/10 bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-serif font-bold text-foreground">
              {DEMO_BUSINESS.rating.toFixed(2)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground block">
                {DEMO_BUSINESS.reviewCount}+ {lang === "hu" ? "hitelesített értékelés" : "verified reviews"}
              </span>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <Link href="/book">
            <Button size="sm" className="gap-2 text-xs uppercase tracking-wider font-semibold">
              <span>{lang === "hu" ? "Időpontfoglalás" : "Book Your Cut"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((rev) => {
          const comment = lang === "hu" ? rev.commentHu : rev.commentEn;
          const serviceName = lang === "hu" ? rev.serviceNameHu : rev.serviceNameEn;

          return (
            <div
              key={rev.id}
              className="group relative flex flex-col justify-between rounded-sm border border-white/10 bg-card p-6 hover:border-primary/40 transition-all duration-300 shadow-md"
            >
              <div className="space-y-4">
                {/* Header: Stars & Verified Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-primary">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-primary text-primary" />
                    ))}
                  </div>

                  {rev.isVerified && (
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 py-0 px-2 font-normal">
                      <CheckCircle2 className="size-2.5" />
                      <span>{lang === "hu" ? "Ellenőrzött Vendég" : "Verified Client"}</span>
                    </Badge>
                  )}
                </div>

                {/* Quote Text */}
                <div className="relative">
                  <Quote className="size-6 text-primary/15 absolute -top-1 -left-1 -z-0 pointer-events-none" />
                  <p className="text-sm text-foreground/90 font-light leading-relaxed relative z-10 italic">
                    &ldquo;{comment}&rdquo;
                  </p>
                </div>
              </div>

              {/* Footer: Author Info & Service Metadata */}
              <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-medium font-serif text-foreground truncate">
                    {rev.authorName}
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {rev.origin}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-primary font-medium block truncate max-w-[140px]">
                    {serviceName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 block">
                    {lang === "hu" ? "Borbély: " : "With "}
                    {rev.barberName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
