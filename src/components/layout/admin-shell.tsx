"use client";

import * as React from "react";
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
  Mail,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

import { signOutAction } from "@/app/admin/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { InstagramIcon } from "@/components/ui/icons";

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
  { href: "/admin/instagram", label: "Instagram", icon: InstagramIcon },
  { href: "/admin/notifications", label: "Email Logs", icon: Mail },
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navItems = role === "staff" ? STAFF_NAV_ITEMS : OWNER_NAV_ITEMS;

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20 text-foreground">
      {/* Top Main Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden size-9 p-0 border-border"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5 text-primary" /> : <Menu className="size-5" />}
            </Button>

            <Link
              href={role === "staff" ? "/admin/appointments" : "/admin"}
              className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="flex size-8 items-center justify-center rounded-sm bg-primary/10 text-primary border border-primary/20">
                <Briefcase className="size-4" />
              </div>
              <span className="font-serif text-base font-semibold">
                Barbod {role === "staff" ? "Staff" : "Admin"}
              </span>
            </Link>

            {role === "staff" ? (
              <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
            >
              <span>View site</span>
              <ExternalLink className="size-3.5" />
            </Link>

            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-xs">
                <LogOut className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-border/50 bg-background/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <nav className="flex space-x-1 py-1.5 overflow-x-auto scrollbar-none">
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
                      "flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-colors min-h-[36px]",
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

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border px-6 h-16">
            <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
              <Briefcase className="size-5 text-primary" />
              <span>Navigation Menu</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="size-9 p-0"
            >
              <X className="size-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-3.5 text-sm font-medium transition-colors min-h-[48px]",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="size-4 opacity-50" />
                </Link>
              );
            })}
          </div>

          <div className="p-6 border-t border-border bg-card">
            <form action={signOutAction}>
              <Button type="submit" variant="destructive" className="w-full gap-2 min-h-[44px]">
                <LogOut className="size-4" />
                <span>Log out</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
