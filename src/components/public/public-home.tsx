"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import {
  Scissors,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  X,
  ExternalLink,
  Globe,
} from "lucide-react";

import type {
  PublicBusiness,
  PublicService,
  PublicPortfolioItem,
  PublicWorkingHours,
} from "@/lib/public/business";
import { useLanguage } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PublicHomeProps {
  business: PublicBusiness;
  services: PublicService[];
  portfolio: PublicPortfolioItem[];
  workingHours: PublicWorkingHours[];
}

const DAY_NAMES: Record<number, { en: string; hu: string }> = {
  1: { en: "Monday", hu: "Hétfő" },
  2: { en: "Tuesday", hu: "Kedd" },
  3: { en: "Wednesday", hu: "Szerda" },
  4: { en: "Thursday", hu: "Csütörtök" },
  5: { en: "Friday", hu: "Péntek" },
  6: { en: "Saturday", hu: "Szombat" },
  0: { en: "Sunday", hu: "Vasárnap" },
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function PublicHome({
  business,
  services,
  portfolio,
  workingHours,
}: PublicHomeProps) {
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);

  const getPublicUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  };

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    portfolio.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [portfolio]);

  const filteredPortfolio = React.useMemo(() => {
    if (selectedCategory === "all") return portfolio;
    return portfolio.filter((p) => p.category === selectedCategory);
  }, [portfolio, selectedCategory]);

  const heroFeaturedImage = portfolio.length > 0 ? getPublicUrl(portfolio[0].image_path) : null;

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* 1. 12-Column Editorial Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left 7-Cols: Editorial Headline & Actions */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                <Scissors className="size-3.5" />
                <span>BUDAPEST · EST. 2026</span>
              </div>

              <h1 className="text-5xl font-light tracking-tight text-foreground sm:text-7xl lg:text-8xl font-serif leading-[0.98] uppercase">
                THE CRAFT
                <br />
                <span className="italic font-extralight text-primary">OF PRECISION</span>
                <br />
                GROOMING.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-light">
                {getLocalizedField(business, "description", lang) || t.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/book">
                  <Button size="lg" className="group gap-3 px-8 text-xs uppercase tracking-[0.15em] font-semibold">
                    <span>{t.heroPrimaryCta}</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                  </Button>
                </Link>
                <Link href="#portfolio">
                  <Button size="lg" variant="outline" className="px-8 text-xs uppercase tracking-[0.15em]">
                    {t.heroSecondaryCta}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right 5-Cols: Asymmetric Architectural Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-sm border border-white/10 bg-card p-2 shadow-2xl">
                {heroFeaturedImage ? (
                  <img
                    src={heroFeaturedImage}
                    alt="Barbod Barber Craft"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-card via-muted/50 to-card flex flex-col items-center justify-center p-8 text-center border border-white/5">
                    <Scissors className="size-16 text-primary/30 mb-4" />
                    <span className="font-serif text-2xl uppercase tracking-widest text-muted-foreground">
                      BARBOD ATELIER
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-mono mt-2">
                      BUDAPEST, HUNGARY
                    </span>
                  </div>
                )}
                {/* Decorative border overlay */}
                <div className="absolute inset-4 border border-white/10 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial Numbered Services List */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <span className="eyebrow">{t.servicesSubtitle}</span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
              {t.servicesTitle}
            </h2>
          </div>
          <Link href="/book">
            <Button variant="outline" size="sm" className="group gap-2 text-xs uppercase tracking-wider">
              <span>{t.bookNow}</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-sm bg-card/40">
            <p className="text-sm text-muted-foreground">
              No services currently available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {services.map((svc, idx) => {
              const name = getLocalizedField(svc, "name", lang);
              const desc = getLocalizedField(svc, "description", lang);
              const priceFormatted = new Intl.NumberFormat(
                lang === "hu" ? "hu-HU" : "en-US"
              ).format(svc.price);
              const indexStr = String(idx + 1).padStart(2, "0");

              return (
                <Link
                  key={svc.id}
                  href={`/book?service=${svc.id}`}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 px-2 transition-colors duration-200 hover:bg-white/[0.02]"
                >
                  <div className="flex items-start gap-6 md:gap-8">
                    <span className="font-mono text-sm font-semibold text-primary/70 pt-1 shrink-0">
                      {indexStr}
                    </span>

                    <div className="space-y-1.5 max-w-xl">
                      <h3 className="text-2xl font-normal tracking-tight text-foreground font-serif group-hover:text-primary transition-colors">
                        {name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        {desc || t.defaultServiceDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-left md:text-right shrink-0">
                      <div className="text-sm font-mono text-muted-foreground">
                        {svc.duration_minutes} {t.duration}
                      </div>
                      <div className="text-base font-sans font-bold text-primary mt-0.5">
                        {priceFormatted} {svc.currency}
                      </div>
                    </div>

                    <div className="flex size-9 items-center justify-center rounded-sm border border-white/10 group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Asymmetric Editorial Portfolio Grid */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <span className="eyebrow">{t.portfolioSubtitle}</span>
              <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
                {t.portfolioTitle}
              </h2>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="xs"
                  onClick={() => setSelectedCategory("all")}
                >
                  {t.allCategories}
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="xs"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Asymmetric Gallery Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {filteredPortfolio.map((item, idx) => {
              const url = getPublicUrl(item.image_path);
              const title = getLocalizedField(item, "title", lang);
              const colSpanClass =
                idx === 0
                  ? "lg:col-span-8 aspect-16/9"
                  : idx === 1
                  ? "lg:col-span-4 aspect-4/3 lg:aspect-auto"
                  : "lg:col-span-4 aspect-4/3";

              return (
                <div
                  key={item.id}
                  onClick={() => setLightboxImg(url)}
                  className={`group relative overflow-hidden rounded-sm border border-white/10 bg-card cursor-pointer shadow-xs ${colSpanClass}`}
                >
                  <img
                    src={url}
                    alt={title || "Portfolio showcase"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                    {title && (
                      <span className="text-lg font-normal text-white font-serif tracking-wide">
                        {title}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs text-primary/90 uppercase tracking-[0.2em] font-sans mt-0.5">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="size-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Enlarged view"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-sm border border-white/20 shadow-2xl"
          />
        </div>
      )}

      {/* 4. Architectural Opening Hours & Location Section */}
      <section id="hours" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column: Opening Hours */}
          <div className="space-y-8 border-b lg:border-b-0 lg:border-r border-white/10 pb-12 lg:pb-0 lg:pr-12">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <span className="eyebrow">{t.timezoneNotice}</span>
              <h3 className="text-3xl font-normal tracking-tight text-foreground font-serif">
                {t.hoursTitle}
              </h3>
            </div>

            <div className="space-y-4">
              {DAY_ORDER.map((dayNum) => {
                const dayName = DAY_NAMES[dayNum][lang];
                const dayRows = workingHours.filter((wh) => wh.day_of_week === dayNum);

                return (
                  <div
                    key={dayNum}
                    className="flex items-center justify-between text-sm border-b border-white/5 pb-3.5 last:border-0"
                  >
                    <span className="font-medium text-foreground">{dayName}</span>
                    {dayRows.length === 0 ? (
                      <Badge variant="outline" className="text-xs font-normal border-white/10 text-muted-foreground">
                        {t.closed}
                      </Badge>
                    ) : (
                      <div className="text-right text-xs font-mono font-semibold text-primary space-y-0.5">
                        {dayRows.map((row) => (
                          <div key={row.id}>
                            {row.start_time.slice(0, 5)} – {row.end_time.slice(0, 5)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Location & Contact Info */}
          <div className="space-y-8">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <span className="eyebrow">BUDAPEST, HUNGARY</span>
              <h3 className="text-3xl font-normal tracking-tight text-foreground font-serif">
                {t.locationTitle}
              </h3>
            </div>

            <div className="space-y-6 text-sm">
              {business.address && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="eyebrow block mb-1">{t.address}</span>
                    <span className="font-medium text-foreground text-base">{business.address}</span>
                  </div>
                </div>
              )}

              {business.phone && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <span className="eyebrow block mb-1">{t.phone}</span>
                    <a
                      href={`tel:${business.phone}`}
                      className="font-medium text-foreground text-base hover:text-primary transition-colors"
                    >
                      {business.phone}
                    </a>
                  </div>
                </div>
              )}

              {business.email && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <span className="eyebrow block mb-1">{t.email}</span>
                    <a
                      href={`mailto:${business.email}`}
                      className="font-medium text-foreground text-base hover:text-primary transition-colors"
                    >
                      {business.email}
                    </a>
                  </div>
                </div>
              )}

              {business.instagram_url && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <span className="eyebrow block mb-1">{t.instagram}</span>
                    <a
                      href={business.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1.5 text-base"
                    >
                      <span>{t.followInstagram}</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Link href="/book">
                <Button className="group w-full gap-3 py-6 text-xs uppercase tracking-[0.15em] font-semibold">
                  <span>{t.heroPrimaryCta}</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final Editorial Booking CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="rounded-sm border border-white/10 bg-card p-10 sm:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="space-y-3">
            <span className="eyebrow">BUDAPEST BARBER ATELIER</span>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight font-serif max-w-3xl mx-auto uppercase leading-[0.98]">
              READY FOR
              <br />
              <span className="italic font-extralight text-primary">YOUR NEXT</span> CUT?
            </h2>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
            {t.readySubtitle}
          </p>

          <div className="pt-4">
            <Link href="/book">
              <Button size="lg" className="group gap-3 px-10 text-xs uppercase tracking-[0.2em] font-semibold shadow-md">
                <span>{t.bookNow}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
