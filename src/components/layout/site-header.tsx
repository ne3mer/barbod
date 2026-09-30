import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/app";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium tracking-wide text-foreground"
        >
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            aria-hidden
          >
            EN · HU
          </span>
          <Link
            href="/book"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Book
          </Link>
        </nav>
      </div>
    </header>
  );
}
