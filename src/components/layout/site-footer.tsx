"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-white/10 bg-card/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <Scissors className="size-4 text-primary" />
              <span className="font-serif tracking-widest uppercase text-base font-medium">
                Barbod Barber
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Budapest, Hungary · Premium Barbershop & Precision Grooming Atelier
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs uppercase font-medium tracking-wider text-muted-foreground">
            <Link href="/#services" className="hover:text-primary transition-colors">
              {t.navServices}
            </Link>
            <Link href="/#barbers" className="hover:text-primary transition-colors">
              {t.navBarbers}
            </Link>
            <Link href="/#portfolio" className="hover:text-primary transition-colors">
              {t.navPortfolio}
            </Link>
            <Link href="/#reviews" className="hover:text-primary transition-colors">
              {t.navReviews}
            </Link>
            <Link href="/#hours" className="hover:text-primary transition-colors">
              {t.navHours}
            </Link>
            <Link href="/admin/login" className="hover:text-primary transition-colors">
              {t.adminLogin}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>© {new Date().getFullYear()} Barbod Barber. All rights reserved.</p>
          <p className="text-xs text-muted-foreground/75 font-mono">Budapest, Europe/Budapest</p>
        </div>
      </div>
    </footer>
  );
}
