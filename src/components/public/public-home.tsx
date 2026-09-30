"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import {
  Scissors,
  Clock,
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

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/40 border-b border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Scissors className="size-3.5" />
              <span>{t.heroTagline}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl font-serif leading-[1.1]">
              {t.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {getLocalizedField(business, "description", lang) || t.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/book">
                <Button size="lg" className="gap-2 px-8 text-base shadow-sm">
                  <span>{t.heroPrimaryCta}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="#services">
                <Button size="lg" variant="outline" className="px-6 text-base">
                  {t.heroSecondaryCta}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Ambient subtle backdrop design */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none hidden lg:flex items-center justify-center">
          <Scissors className="size-96 text-primary" />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
            {t.servicesTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{t.servicesSubtitle}</p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No services currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => {
              const name = getLocalizedField(svc, "name", lang);
              const desc = getLocalizedField(svc, "description", lang);
              const priceFormatted = new Intl.NumberFormat(
                lang === "hu" ? "hu-HU" : "en-US"
              ).format(svc.price);

              return (
                <div
                  key={svc.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold tracking-tight text-foreground">
                        {name}
                      </h3>
                      <div className="text-right shrink-0 font-bold text-primary text-base">
                        {priceFormatted} {svc.currency}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {desc || "Professional precision haircut and beard styling."}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {svc.duration_minutes} {t.duration}
                    </span>

                    <Link href={`/book?service=${svc.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <span>{t.bookService}</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Portfolio Section */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
              {t.portfolioTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.portfolioSubtitle}</p>
          </div>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
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

          {/* Gallery Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPortfolio.map((item) => {
              const url = getPublicUrl(item.image_path);
              const title = getLocalizedField(item, "title", lang);

              return (
                <div
                  key={item.id}
                  onClick={() => setLightboxImg(url)}
                  className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-muted cursor-pointer shadow-xs"
                >
                  <img
                    src={url}
                    alt={title || "Portfolio showcase"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    {title && (
                      <span className="text-sm font-semibold text-white">
                        {title}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs text-white/80">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in">
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
          >
            <X className="size-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Enlarged view"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      {/* Working Hours & Location Section */}
      <section id="hours" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Opening Hours */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Clock className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground font-serif">
                  {t.hoursTitle}
                </h3>
                <p className="text-xs text-muted-foreground">Europe/Budapest Timezone</p>
              </div>
            </div>

            <div className="space-y-3">
              {DAY_ORDER.map((dayNum) => {
                const dayName = DAY_NAMES[dayNum][lang];
                const dayRows = workingHours.filter((wh) => wh.day_of_week === dayNum);

                return (
                  <div
                    key={dayNum}
                    className="flex items-center justify-between text-sm border-b border-border/40 pb-2.5 last:border-0"
                  >
                    <span className="font-semibold text-foreground">{dayName}</span>
                    {dayRows.length === 0 ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {t.closed}
                      </Badge>
                    ) : (
                      <div className="text-right text-xs font-medium text-foreground space-y-0.5">
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

          {/* Location & Contact Info */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground font-serif">
                    {t.locationTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">Budapest, Hungary</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        {t.address}
                      </span>
                      <span className="font-medium text-foreground">{business.address}</span>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        {t.phone}
                      </span>
                      <a
                        href={`tel:${business.phone}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        {t.email}
                      </span>
                      <a
                        href={`mailto:${business.email}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {business.instagram_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        {t.instagram}
                      </span>
                      <a
                        href={business.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Follow on Instagram</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <Link href="/book">
                <Button className="w-full gap-2 py-6 text-base shadow-xs">
                  <span>{t.heroPrimaryCta}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final Booking CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif max-w-xl mx-auto">
            Ready for your next cut?
          </h2>
          <p className="text-sm sm:text-base opacity-90 max-w-md mx-auto">
            Book online in less than a minute. Choose your service, pick a date, and reserve your slot.
          </p>
          <div className="pt-2">
            <Link href="/book">
              <Button size="lg" variant="secondary" className="gap-2 px-8 text-base font-semibold">
                <span>{t.bookNow}</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
