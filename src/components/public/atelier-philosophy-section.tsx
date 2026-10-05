"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import { Scissors, Flame, Coffee, Armchair, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function AtelierPhilosophySection() {
  const { lang } = useLanguage();

  const pillars = [
    {
      icon: Scissors,
      titleEn: "Bespoke Cranial Architecture",
      titleHu: "Egyéni Fejforma-Konzultáció",
      descEn:
        "Every cut commences with a thorough assessment of bone structure, facial contours, and natural cowlicks. We design profiles tailored strictly to your individual anatomy.",
      descHu:
        "Minden vágás a csontszerkezet, az arcvonások és a természetes forgók alapos felmérésével kezdődik. Kizárólag az Ön egyéni anatómiájához tervezzük a formát.",
    },
    {
      icon: Flame,
      titleEn: "Traditional Straight-Razor Rituals",
      titleHu: "Hagyományos Pengés Rituálék",
      descEn:
        "Steamed eucalyptus towels, rich badger-hair lather, and surgeon-precise straight razor passes ensure impeccable line work and restorative relaxation.",
      descHu:
        "Gőzölt eukaliptuszos törölközők, meleg borotvahab és sebészi pontosságú pengés vonalvezetés a kifogástalan megjelenésért és a teljes ellazulásért.",
    },
    {
      icon: Coffee,
      titleEn: "Complimentary Atelier Bar",
      titleHu: "Díjmentes Kávé & Italok",
      descEn:
        "Relax before or after your service with freshly pulled single-origin Ethiopian espresso, chilled mineral water, or selected Japanese craft spirits.",
      descHu:
        "Kényelmes feltöltődés a vágás előtt vagy után: frissen őrölt etióp eszpresszó, hűtött ásványvíz vagy prémium minőségű válogatott párlatok.",
    },
    {
      icon: Armchair,
      titleEn: "Vintage Belmont Comfort",
      titleHu: "Eredeti Belmont Bőrfotelek",
      descEn:
        "Authentic restored Japanese Belmont hydraulic leather chairs, providing ergonomic posture support for maximum comfort throughout extended treatments.",
      descHu:
        "Autentikus, felújított japán Belmont hidraulikus bőrfotelek, amelyek ergonómikus tartást és teljes kényelmet biztosítanak a hosszabb rituálék során is.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full space-y-16">
      {/* Intro Header */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end border-b border-white/10 pb-10">
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-primary">
            <ShieldCheck className="size-3.5" />
            <span>{lang === "hu" ? "AZ ATELIER FILOZÓFIA" : "THE ATELIER PHILOSOPHY"}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground font-serif uppercase leading-[1.05]">
            {lang === "hu" ? "Nem csupán egy hajvágás." : "More Than A Haircut."}
            <br />
            <span className="italic font-extralight text-primary">
              {lang === "hu" ? "Egy rituálé a férfiaknak." : "A Grooming Sanctuary."}
            </span>
          </h2>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            {lang === "hu"
              ? "A Barbod Barberben a klasszikus borbélyhagyományt ötvözzük a modern precizitással. Itt nem sietünk: a minőségre, a figyelemre és a megérdemelt nyugalomra fókuszálunk."
              : "At Barbod Barber Atelier, grooming is restored to an unhurried craft. Designed for gentlemen who appreciate craftsmanship, silence, and deliberate execution."}
          </p>
          <Link href="/book" className="inline-block">
            <Button variant="outline" size="sm" className="group gap-2 text-xs uppercase tracking-wider font-semibold">
              <span>{lang === "hu" ? "Időpont foglalása" : "Book An Appointment"}</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          const title = lang === "hu" ? item.titleHu : item.titleEn;
          const desc = lang === "hu" ? item.descHu : item.descEn;

          return (
            <div
              key={idx}
              className="group relative rounded-sm border border-white/10 bg-card p-6 flex flex-col justify-between hover:border-primary/40 transition-all duration-300 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-sm bg-primary/10 border border-primary/25 text-primary transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal font-serif text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>0{idx + 1} / 04</span>
                <span className="text-primary/70 uppercase tracking-widest text-[9px]">ATELIER PILLAR</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Atmosphere Showcase */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative aspect-4/3 rounded-sm overflow-hidden border border-white/10 bg-card group">
          <img
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80"
            alt="Barbod Barber Interior Atmosphere"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex items-end">
            <span className="text-xs font-serif text-white tracking-widest uppercase">
              {lang === "hu" ? "Klasszikus Enteriőr · Budapest" : "Atelier Interior · Budapest"}
            </span>
          </div>
        </div>

        <div className="relative aspect-4/3 rounded-sm overflow-hidden border border-white/10 bg-card group">
          <img
            src="https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&w=1200&q=80"
            alt="Handcrafted Barber Shears and Equipment"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex items-end">
            <span className="text-xs font-serif text-white tracking-widest uppercase">
              {lang === "hu" ? "Japán Kézműves Eszközök" : "Handcrafted Japanese Shears"}
            </span>
          </div>
        </div>

        <div className="relative aspect-4/3 rounded-sm overflow-hidden border border-white/10 bg-card group">
          <img
            src="https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80"
            alt="Restored Leather Belmont Chair"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex items-end">
            <span className="text-xs font-serif text-white tracking-widest uppercase">
              {lang === "hu" ? "Belmont Bőrfotelek Kényelme" : "Restored Belmont Leather Comfort"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
