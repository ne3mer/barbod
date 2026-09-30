"use client";

import Link from "next/link";
import { ArrowRight, Scissors } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-base font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity group"
        >
          <div className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary border border-primary/25">
            <Scissors className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-[0.2em] uppercase text-base font-medium text-foreground leading-none">
              BARBOD
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-sans mt-0.5">
              BARBER ATELIER
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <Link href="/#services" className="hover:text-primary transition-colors">
              {t.navServices}
            </Link>
            <Link href="/#portfolio" className="hover:text-primary transition-colors">
              {t.navPortfolio}
            </Link>
            <Link href="/#hours" className="hover:text-primary transition-colors">
              {t.navHours}
            </Link>
          </div>

          <LanguageSwitcher />

          <Link
            href="/book"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <span>{t.bookNow}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
