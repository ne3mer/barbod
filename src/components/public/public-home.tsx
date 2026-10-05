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
  User,
  Star,
  Clock,
  Sparkles,
  CheckCircle2,
  Navigation,
} from "lucide-react";

import type {
  PublicBusiness,
  PublicBarber,
  PublicService,
  PublicPortfolioItem,
  PublicWorkingHours,
} from "@/lib/public/business";
import type { InstagramMediaItem } from "@/lib/instagram/types";
import { AtelierInstagramFeed } from "@/components/public/atelier-instagram-feed";
import { AtelierPhilosophySection } from "@/components/public/atelier-philosophy-section";
import { ClientReviewsSection } from "@/components/public/client-reviews-section";
import { useLanguage } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_BUSINESS, DEMO_SERVICES } from "@/lib/config/demo-content";

interface PublicHomeProps {
  business: PublicBusiness;
  barbers: PublicBarber[];
  services: PublicService[];
  portfolio: PublicPortfolioItem[];
  workingHours: PublicWorkingHours[];
  instagramItems?: InstagramMediaItem[];
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
  barbers,
  services,
  portfolio,
  workingHours,
  instagramItems = [],
}: PublicHomeProps) {
  const { lang, t } = useLanguage();
  const [selectedBarberFilter, setSelectedBarberFilter] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedServiceCategory, setSelectedServiceCategory] = React.useState<string>("all");
  const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);

  const getPublicUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
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
    let result = portfolio;
    if (selectedBarberFilter !== "all") {
      result = result.filter((p) => p.barber_id === selectedBarberFilter);
    }
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [portfolio, selectedBarberFilter, selectedCategory]);

  const filteredServices = React.useMemo(() => {
    if (selectedServiceCategory === "all") return services;
    // Match based on category or service name keywords
    return services.filter((s) => {
      const matchDemo = DEMO_SERVICES.find((ds) => ds.id === s.id || ds.nameEn === s.name_en);
      if (matchDemo) {
        return matchDemo.category === selectedServiceCategory;
      }
      if (selectedServiceCategory === "Haircut") return !s.name_en.toLowerCase().includes("beard") || s.name_en.toLowerCase().includes("cut");
      if (selectedServiceCategory === "Beard") return s.name_en.toLowerCase().includes("beard") || s.name_en.toLowerCase().includes("shave");
      return true;
    });
  }, [services, selectedServiceCategory]);

  const heroFeaturedImage =
    portfolio.length > 0 && portfolio[0]?.image_path
      ? getPublicUrl(portfolio[0].image_path)
      : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="flex flex-col gap-20 sm:gap-28 pb-24 w-full min-w-0 max-w-full">
      {/* 1. 12-Column Editorial Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-12 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-card/40 to-background w-full max-w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 min-w-0">
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-12 lg:items-center min-w-0">
            {/* Left 7-Cols */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 min-w-0">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">
                <Scissors className="size-3.5 shrink-0" />
                <span className="truncate">BUDAPEST · ATELIER EST. 2026</span>
              </div>

              <h1 className="text-4xl xs:text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight text-foreground font-serif leading-[1.02] sm:leading-[0.98] uppercase break-words min-w-0">
                THE CRAFT
                <br />
                <span className="italic font-extralight text-primary">OF BESPOKE</span>
                <br />
                GROOMING.
              </h1>

              <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-light">
                {getLocalizedField(business, "description", lang) || DEMO_BUSINESS.descriptionEn}
              </p>

              <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 sm:gap-4 pt-2 w-full min-w-0">
                <Link href="/book" className="w-full xs:w-auto">
                  <Button size="lg" className="w-full xs:w-auto min-h-[50px] group gap-3 px-8 text-xs uppercase tracking-[0.18em] font-semibold shadow-lg">
                    <span>{t.heroPrimaryCta}</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                  </Button>
                </Link>
                <Link href="#services" className="w-full xs:w-auto">
                  <Button size="lg" variant="outline" className="w-full xs:w-auto min-h-[50px] px-8 text-xs uppercase tracking-[0.18em] font-semibold border-white/20 hover:bg-white/5">
                    {lang === "hu" ? "SZOLGÁLTATÁSOK" : "VIEW SERVICES"}
                  </Button>
                </Link>
              </div>

              {/* Social Proof Mini Bar */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">4.95</span>
                  <span>(180+ Reviews)</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>District VI · Terézváros</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Mon–Fri 09:00–20:00</span>
                </div>
              </div>
            </div>

            {/* Right 5-Cols */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-sm border border-white/15 bg-card p-2 shadow-2xl">
                <img
                  src={heroFeaturedImage}
                  alt="Barbod Barber Craft"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
                <div className="absolute inset-4 border border-white/10 pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-sm bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary block">
                      BUDAPEST ATELIER
                    </span>
                    <span className="font-serif text-sm tracking-wide">Paulay Ede utca 16</span>
                  </div>
                  <Link href="/book">
                    <span className="text-xs uppercase tracking-wider font-semibold text-primary hover:underline flex items-center gap-1">
                      <span>Book</span>
                      <ArrowRight className="size-3" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE ATELIER PHILOSOPHY & CRAFT PILLARS */}
      <AtelierPhilosophySection />

      {/* 3. MEET THE BARBERS / TEAM SECTION */}
      <section id="barbers" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <span className="eyebrow">{lang === "hu" ? "MESTERBORBÉLYAINK" : "OUR MASTER BARBERS"}</span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
              {lang === "hu" ? "Ismerje meg borbélyainkat" : "Meet The Atelier Team"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-xl">
              {lang === "hu"
                ? "Tapasztalt, nemzetközileg képzett borbélyok, akik a legapróbb részletekre is odafigyelnek."
                : "Experienced craftsmen dedicated to precision scissors-over-comb cuts, surgical skin fades, and traditional beard architecture."}
            </p>
          </div>
          <Link href="/book">
            <Button variant="outline" size="sm" className="group gap-2 text-xs uppercase tracking-wider font-semibold">
              <span>{lang === "hu" ? "FOGLALÁS BORBÉLYNÁL" : "BOOK WITH BARBER"}</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => {
            const bio = getLocalizedField(barber, "bio", lang);
            const isFounder = barber.name.toLowerCase().includes("barbod");
            const role = isFounder
              ? lang === "hu" ? "Alapító & Mesterborbély" : "Founder & Master Barber"
              : barber.name.toLowerCase().includes("viktor")
              ? lang === "hu" ? "Senior Stylist & Fade Specialista" : "Senior Stylist & Fade Specialist"
              : lang === "hu" ? "Szakállspecialista & Borotvamester" : "Beard Artisan & Shave Craftsman";

            const specialties = isFounder
              ? ["Master Scissor Cut", "Traditional Razor Shave", "Atelier Signature"]
              : barber.name.toLowerCase().includes("viktor")
              ? ["Skin Fade", "Textured Crop", "Modern Styling"]
              : ["Beard Sculpting", "Hot Towel Shave", "Beard Fade"];

            return (
              <div
                key={barber.id}
                className="group rounded-sm border border-white/10 bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-xl"
              >
                <div className="space-y-5">
                  <div className="relative aspect-4/5 rounded-sm overflow-hidden border border-white/10 bg-white/5">
                    {barber.profile_photo_url ? (
                      <img
                        src={barber.profile_photo_url}
                        alt={barber.name}
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/40">
                        <User className="size-16 stroke-[1]" />
                        <span className="text-xs font-serif uppercase tracking-widest mt-2">BARBOD</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-5 flex flex-col justify-end">
                      <Badge variant="outline" className="self-start text-[10px] font-mono uppercase tracking-wider text-primary border-primary/40 bg-black/60 backdrop-blur-xs py-0.5 px-2">
                        {role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-2xl font-normal font-serif text-foreground group-hover:text-primary transition-colors">
                        {barber.name}
                      </h3>
                      <span className="text-[11px] font-mono text-muted-foreground/70">
                        Budapest
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed font-light line-clamp-4">
                      {bio || "Master barber specializing in tailored cuts, traditional hot towel straight razor treatments, and bespoke styling."}
                    </p>

                    {/* Specialties Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {specialties.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] font-mono bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-sm text-foreground/80"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
                  <Link href={`/book?barber=${barber.id}`} className="flex-1">
                    <Button className="w-full group gap-2 text-xs uppercase tracking-wider font-semibold">
                      <span>{lang === "hu" ? `Foglalás nála` : `Book with ${barber.name}`}</span>
                      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. EDITORIAL SERVICES LIST & MENU */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <span className="eyebrow">{t.servicesSubtitle}</span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
              {t.servicesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-xl">
              {lang === "hu"
                ? "Minden szolgáltatásunk tartalmazza a személyre szabott konzultációt és a prémium hajmosást."
                : "Every treatment includes a bespoke cranial consultation, invigorating wash, and complimentary atelier bar."}
            </p>
          </div>

          {/* Service Category Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={selectedServiceCategory === "all" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedServiceCategory("all")}
              className="text-xs uppercase tracking-wider"
            >
              {lang === "hu" ? "Összes" : "All Services"}
            </Button>
            <Button
              variant={selectedServiceCategory === "Haircut" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedServiceCategory("Haircut")}
              className="text-xs uppercase tracking-wider"
            >
              {lang === "hu" ? "Hajvágás" : "Haircuts"}
            </Button>
            <Button
              variant={selectedServiceCategory === "Beard" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedServiceCategory("Beard")}
              className="text-xs uppercase tracking-wider"
            >
              {lang === "hu" ? "Szakáll" : "Beard"}
            </Button>
            <Button
              variant={selectedServiceCategory === "Grooming Packages" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedServiceCategory("Grooming Packages")}
              className="text-xs uppercase tracking-wider"
            >
              {lang === "hu" ? "Csomagok" : "Packages"}
            </Button>
          </div>
        </div>

        <div className="divide-y divide-white/10 border-t border-b border-white/10">
          {filteredServices.map((svc, idx) => {
            const name = getLocalizedField(svc, "name", lang);
            const desc = getLocalizedField(svc, "description", lang);
            const indexStr = String(idx + 1).padStart(2, "0");
            const priceEur = svc.price;
            // Approximate HUF conversion for dual realistic display
            const priceHuf = Math.round(priceEur * 395 / 500) * 500;

            const isPopular =
              svc.name_en.toLowerCase().includes("signature") ||
              svc.name_en.toLowerCase().includes("skin fade") ||
              svc.name_en.toLowerCase().includes("classic tailored");

            return (
              <Link
                key={svc.id}
                href={`/book?service=${svc.id}`}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-7 px-3 sm:px-4 transition-colors duration-200 hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-5 sm:gap-8 min-w-0">
                  <span className="font-mono text-sm font-semibold text-primary/70 pt-1 shrink-0">
                    {indexStr}
                  </span>

                  <div className="space-y-1.5 max-w-2xl min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground font-serif group-hover:text-primary transition-colors">
                        {name}
                      </h3>
                      {isPopular && (
                        <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary py-0 px-2 font-normal">
                          <Sparkles className="size-2.5 mr-1" />
                          Signature Choice
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                      {desc || t.defaultServiceDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0">
                  <div className="text-left md:text-right shrink-0">
                    <div className="text-xs font-mono text-muted-foreground flex items-center md:justify-end gap-1">
                      <Clock className="size-3 text-primary/70" />
                      <span>{svc.duration_minutes} {t.duration}</span>
                    </div>
                    <div className="text-lg font-sans font-bold text-primary mt-0.5">
                      €{priceEur}
                      <span className="text-xs font-mono font-normal text-muted-foreground ml-1.5">
                        · {new Intl.NumberFormat("hu-HU").format(priceHuf)} HUF
                      </span>
                    </div>
                  </div>

                  <div className="flex size-9 items-center justify-center rounded-sm border border-white/10 group-hover:border-primary group-hover:bg-primary/10 transition-colors shrink-0">
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. ASYMMETRIC EDITORIAL PORTFOLIO GRID */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <span className="eyebrow">{t.portfolioSubtitle}</span>
              <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-foreground font-serif">
                {t.portfolioTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-xl">
                {lang === "hu"
                  ? "Válogatás az atelierben készült legfrissebb prémium frizurákból és szakállakból."
                  : "A curated curation of precision tapers, bespoke scissor silhouettes, and sculpted beard profiles."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setSelectedCategory("all")}
                    className="text-xs uppercase tracking-wider"
                  >
                    {t.allCategories}
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="xs"
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs uppercase tracking-wider"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Asymmetric Gallery Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {filteredPortfolio.map((item, idx) => {
              const url = getPublicUrl(item.image_path);
              const title = getLocalizedField(item, "title", lang);
              const barberName = barbers.find((b) => b.id === item.barber_id)?.name;
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
                  className={`group relative overflow-hidden rounded-sm border border-white/10 bg-card cursor-pointer shadow-sm ${colSpanClass}`}
                >
                  <img
                    src={url}
                    alt={title || "Portfolio showcase"}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                    {title && (
                      <span className="text-lg font-normal text-white font-serif tracking-wide">
                        {title}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {barberName && (
                        <span className="text-xs text-primary font-mono font-semibold uppercase tracking-wider">
                          BY {barberName}
                        </span>
                      )}
                      {item.category && (
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-sans">
                          · {item.category}
                        </span>
                      )}
                    </div>
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

      {/* 6. CLIENT REVIEWS & SOCIAL PROOF */}
      <ClientReviewsSection />

      {/* 7. OPENING HOURS & BUDAPEST LOCATION */}
      <section id="hours" className="mx-auto max-w-7xl px-4 sm:px-6 w-full scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column: Opening Hours */}
          <div className="space-y-8 border-b lg:border-b-0 lg:border-r border-white/10 pb-12 lg:pb-0 lg:pr-12">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                <Clock className="size-3.5" />
                <span>{lang === "hu" ? "NYITVATARTÁS" : "HOURS & SCHEDULE"}</span>
              </div>
              <h3 className="text-3xl font-normal tracking-tight text-foreground font-serif">
                {t.hoursTitle}
              </h3>
              <p className="text-xs text-muted-foreground font-light">
                {lang === "hu"
                  ? "Időpontjaink előre foglalhatók online a garantált várakozásmentes kiszolgálásért."
                  : "Appointments are scheduled in advance to ensure an unhurried, private experience."}
              </p>
            </div>

            <div className="space-y-3.5">
              {DAY_ORDER.map((dayNum) => {
                const dayName = DAY_NAMES[dayNum][lang];
                const dayRow = workingHours.find((wh) => wh.day_of_week === dayNum && wh.is_active);
                const isToday = new Date().getDay() === dayNum;

                return (
                  <div
                    key={dayNum}
                    className={`flex items-center justify-between text-sm py-2.5 px-3 rounded-sm border transition-colors ${
                      isToday
                        ? "bg-primary/10 border-primary/30"
                        : "border-transparent border-b-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isToday ? "text-primary font-semibold" : "text-foreground"}`}>
                        {dayName}
                      </span>
                      {isToday && (
                        <Badge variant="outline" className="text-[9px] font-mono uppercase text-primary border-primary/40 py-0 px-1.5 font-normal">
                          {lang === "hu" ? "MA" : "TODAY"}
                        </Badge>
                      )}
                    </div>
                    {!dayRow ? (
                      <Badge variant="outline" className="text-xs font-normal border-white/10 text-muted-foreground">
                        {t.closed}
                      </Badge>
                    ) : (
                      <div className="text-right text-xs font-mono font-semibold text-primary">
                        {dayRow.start_time.slice(0, 5)} – {dayRow.end_time.slice(0, 5)}
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
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                <Navigation className="size-3.5" />
                <span>{DEMO_BUSINESS.district}</span>
              </div>
              <h3 className="text-3xl font-normal tracking-tight text-foreground font-serif">
                {t.locationTitle}
              </h3>
              <p className="text-xs text-muted-foreground font-light">
                {lang === "hu" ? DEMO_BUSINESS.landmarkHu : DEMO_BUSINESS.landmarkEn}
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-4 p-4 rounded-sm border border-white/10 bg-card">
                <div className="p-2.5 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <span className="eyebrow block mb-1">{t.address}</span>
                  <span className="font-medium text-foreground text-base block">{DEMO_BUSINESS.address}</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">{DEMO_BUSINESS.district}</span>
                  <span className="text-[11px] font-mono text-primary/80 block mt-1">
                    {lang === "hu" ? DEMO_BUSINESS.transitHu : DEMO_BUSINESS.transitEn}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3.5 rounded-sm border border-white/10 bg-card">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Phone className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow block mb-0.5">{t.phone}</span>
                    <a
                      href={`tel:${DEMO_BUSINESS.phone}`}
                      className="font-mono text-sm text-foreground hover:text-primary transition-colors block truncate font-medium"
                    >
                      {DEMO_BUSINESS.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-sm border border-white/10 bg-card">
                  <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Mail className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow block mb-0.5">{t.email}</span>
                    <a
                      href={`mailto:${DEMO_BUSINESS.email}`}
                      className="font-mono text-xs text-foreground hover:text-primary transition-colors block truncate font-medium"
                    >
                      {DEMO_BUSINESS.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Maps link */}
              <div className="pt-2">
                <a
                  href={DEMO_BUSINESS.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full gap-2 text-xs uppercase tracking-wider font-semibold border-white/15 hover:bg-white/5">
                    <Navigation className="size-3.5 text-primary" />
                    <span>{lang === "hu" ? "Megnyitás a Google Térképen" : "Open in Google Maps"}</span>
                    <ExternalLink className="size-3 text-muted-foreground ml-auto" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/book">
                <Button className="group w-full gap-3 py-6 text-xs uppercase tracking-[0.18em] font-semibold">
                  <span>{t.heroPrimaryCta}</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FROM THE ATELIER - REAL-TIME INSTAGRAM FEED */}
      <AtelierInstagramFeed items={instagramItems} />

      {/* 9. FINAL EDITORIAL BOOKING CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full min-w-0">
        <div className="rounded-sm border border-white/15 bg-card p-8 sm:p-20 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl min-w-0">
          <div className="space-y-3 min-w-0">
            <span className="eyebrow block">BUDAPEST BARBER ATELIER · PAULAY EDE UTCA 16</span>
            <h2 className="text-3xl sm:text-6xl lg:text-7xl font-light tracking-tight font-serif max-w-3xl mx-auto uppercase leading-[0.98] break-words">
              READY FOR
              <br />
              <span className="italic font-extralight text-primary">YOUR NEXT</span> CUT?
            </h2>
          </div>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
            {lang === "hu"
              ? "Válasszon mesterborbélyt és foglalja le kényelmesen időpontját online pár kattintással."
              : "Experience the distinction of bespoke cranial consultation and master barbering in Budapest."}
          </p>

          <div className="pt-2 sm:pt-4">
            <Link href="/book" className="inline-block w-full xs:w-auto">
              <Button size="lg" className="w-full xs:w-auto group gap-3 px-10 text-xs uppercase tracking-[0.2em] font-semibold shadow-xl min-h-[50px]">
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
