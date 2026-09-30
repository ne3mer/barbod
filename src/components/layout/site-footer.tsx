"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground"
            >
              <Scissors className="size-4 text-primary" />
              <span className="font-serif tracking-wider uppercase text-sm">
                Barbod Barber
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-md">
              Budapest, Hungary · Premium Barbershop & Precision Grooming
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link href="/#services" className="hover:text-foreground transition-colors">
              {t.navServices}
            </Link>
            <Link href="/#portfolio" className="hover:text-foreground transition-colors">
              {t.navPortfolio}
            </Link>
            <Link href="/#hours" className="hover:text-foreground transition-colors">
              {t.navHours}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              {t.adminLogin}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>© {new Date().getFullYear()} Barbod Barber. All rights reserved.</p>
          <p className="text-xs opacity-75">Budapest, Europe/Budapest</p>
        </div>
      </div>
    </footer>
  );
}
