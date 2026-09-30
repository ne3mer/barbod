"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  Briefcase,
  Image as ImageIcon,
  Settings,
  Scissors,
  LogOut,
  ExternalLink,
  Ban,
  LayoutDashboard,
  Users,
  UserCheck,
} from "lucide-react";

import { signOutAction } from "@/app/admin/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type AdminShellProps = {
  children: React.ReactNode;
  businessName?: string | null;
  role?: "owner" | "staff";
  barberName?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const OWNER_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Schedule", icon: Calendar },
  { href: "/admin/barbers", label: "Barbers", icon: Users },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/working-hours", label: "Working Hours", icon: Clock },
  { href: "/admin/blocked-times", label: "Blocked Times", icon: Ban },
  { href: "/admin/portfolio", label: "Portfolio", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const STAFF_NAV_ITEMS: NavItem[] = [
  { href: "/admin/appointments", label: "My Schedule", icon: Calendar },
  { href: "/admin/working-hours", label: "My Working Hours", icon: Clock },
  { href: "/admin/blocked-times", label: "My Blocked Times", icon: Ban },
  { href: "/admin/profile", label: "My Profile", icon: UserCheck },
  { href: "/admin/portfolio", label: "My Portfolio", icon: ImageIcon },
];


export function AdminShell({
  children,
  businessName,
  role = "owner",
  barberName,
}: AdminShellProps) {
  const pathname = usePathname();
  const navItems = role === "staff" ? STAFF_NAV_ITEMS : OWNER_NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={role === "staff" ? "/admin/appointments" : "/admin"}
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
            >
              <Briefcase className="size-4 text-primary" />
              <span>Barbod {role === "staff" ? "Staff" : "Admin"}</span>
            </Link>
            {role === "staff" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <UserCheck className="size-3" />
                <span>{barberName || "Staff Workspace"}</span>
              </span>
            ) : businessName ? (
              <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {businessName}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pr-2"
            >
              <span>View site</span>
              <ExternalLink className="size-3" />
            </Link>

            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-xs">
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-border/50 bg-background/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[36px]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

