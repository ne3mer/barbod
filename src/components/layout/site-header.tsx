"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Scissors, Menu, X, Globe } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/context";

export function SiteHeader() {
  const { lang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close menu on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-white/10 bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl w-full min-w-0 items-center justify-between px-4 sm:px-6 gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 text-base font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity group min-w-0 shrink"
        >
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-sm bg-primary/10 text-primary border border-primary/25 shrink-0">
            <Scissors className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-serif tracking-[0.12em] sm:tracking-[0.2em] uppercase text-sm sm:text-base font-medium text-foreground leading-none truncate">
              BARBOD
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.25em] uppercase text-muted-foreground font-sans mt-0.5 truncate hidden xs:block">
              BARBER ATELIER
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Desktop Anchor Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <Link href="/#services" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
              {t.navServices}
            </Link>
            <Link href="/#portfolio" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
              {t.navPortfolio}
            </Link>
            <Link href="/#hours" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
              {t.navHours}
            </Link>
          </div>

          {/* Desktop-only Language Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Desktop Book CTA */}
          <Link
            href="/book"
            className={`hidden md:inline-flex ${buttonVariants({ variant: "outline", size: "sm" })}`}
          >
            <span>{t.bookNow}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Minimal Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-9 p-0 text-foreground hover:bg-white/5 border border-white/10 shrink-0"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4 text-primary" /> : <Menu className="size-4" />}
          </Button>
        </nav>
      </div>

      {/* Editorial Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/98 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
            {/* Creative Mobile Language Selector */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 bg-white/[0.02] p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                <Globe className="size-3.5 text-primary shrink-0" />
                <span>{lang === "hu" ? "Nyelvválasztás" : "Language / Nyelv"}</span>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="flex flex-col space-y-4 text-sm font-semibold uppercase tracking-[0.15em] font-mono">
              <Link
                href="/#services"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-white/5 text-muted-foreground hover:text-primary transition-colors flex items-center justify-between"
              >
                <span>{t.navServices}</span>
                <ArrowRight className="size-3.5 opacity-50" />
              </Link>
              <Link
                href="/#portfolio"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-white/5 text-muted-foreground hover:text-primary transition-colors flex items-center justify-between"
              >
                <span>{t.navPortfolio}</span>
                <ArrowRight className="size-3.5 opacity-50" />
              </Link>
              <Link
                href="/#hours"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-white/5 text-muted-foreground hover:text-primary transition-colors flex items-center justify-between"
              >
                <span>{t.navHours}</span>
                <ArrowRight className="size-3.5 opacity-50" />
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full"
              >
                <Button className="w-full group gap-2 text-xs uppercase tracking-[0.15em] font-semibold py-5 shadow-lg">
                  <span>{t.bookNow}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

