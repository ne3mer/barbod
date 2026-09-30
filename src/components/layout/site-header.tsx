"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Scissors, Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/context";

export function SiteHeader() {
  const { t } = useLanguage();
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

        <nav className="flex items-center gap-3 sm:gap-8">
          {/* Desktop Anchor Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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

          <LanguageSwitcher />

          {/* Desktop Book CTA */}
          <Link
            href="/book"
            className={`hidden sm:inline-flex ${buttonVariants({ variant: "outline", size: "sm" })}`}
          >
            <span>{t.bookNow}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Minimal Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-9 p-0 text-foreground hover:bg-white/5 border border-white/10"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4 text-primary" /> : <Menu className="size-4" />}
          </Button>
        </nav>
      </div>

      {/* Minimal Editorial Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/98 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
            <div className="flex flex-col space-y-4 text-sm font-semibold uppercase tracking-[0.2em] font-mono">
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
                className="block"
              >
                <Button className="w-full group gap-2 text-xs uppercase tracking-[0.15em] font-semibold py-5">
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

