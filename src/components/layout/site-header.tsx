"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Scissors className="size-4" />
          </div>
          <span className="font-serif tracking-wider uppercase text-sm sm:text-base">
            Barbod Barber
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link href="/#services" className="hover:text-foreground transition-colors">
              {t.navServices}
            </Link>
            <Link href="/#portfolio" className="hover:text-foreground transition-colors">
              {t.navPortfolio}
            </Link>
            <Link href="/#hours" className="hover:text-foreground transition-colors">
              {t.navHours}
            </Link>
          </div>

          <LanguageSwitcher />

          <Link
            href="/book"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            {t.bookNow}
          </Link>
        </nav>
      </div>
    </header>
  );
}
