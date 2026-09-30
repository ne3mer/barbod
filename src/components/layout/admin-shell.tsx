import Link from "next/link";

import { signOutAction } from "@/app/admin/(dashboard)/actions";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
  businessName?: string | null;
};

export function AdminShell({ children, businessName }: AdminShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin" className="text-sm font-medium shrink-0">
              Admin
            </Link>
            {businessName ? (
              <span className="truncate text-xs text-muted-foreground">
                {businessName}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              View site
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
