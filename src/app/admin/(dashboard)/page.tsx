import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  Clock,
  Scissors,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";

import { BUSINESS_TIMEZONE } from "@/types";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { utcToBudapestParts } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Dashboard | Barbod Admin",
};

function budapestDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getDashboardMetrics(businessId: string) {
  const supabase = await createClient();
  const now = new Date();

  // 1. Appointments query
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, services(name_en, duration_minutes)")
    .eq("business_id", businessId)
    .order("start_at", { ascending: true });

  const todayKey = budapestDayKey(now);
  let todayCount = 0;
  let upcomingCount = 0;
  let pendingCount = 0;

  const upcomingList: typeof appointments = [];

  for (const row of appointments ?? []) {
    const start = new Date(row.start_at);

    if (row.status === "pending") {
      pendingCount += 1;
    }

    if (budapestDayKey(start) === todayKey && row.status !== "cancelled") {
      todayCount += 1;
    }

    if (start.getTime() >= now.getTime() && row.status !== "cancelled") {
      upcomingCount += 1;
      if (upcomingList.length < 5) {
        upcomingList.push(row);
      }
    }
  }

  // 2. Services count
  const { count: activeServicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true);

  // 3. Portfolio count
  const { count: portfolioCount } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  return {
    todayCount,
    upcomingCount,
    pendingCount,
    activeServicesCount: activeServicesCount ?? 0,
    portfolioCount: portfolioCount ?? 0,
    upcomingList,
  };
}

export default async function AdminDashboardPage() {
  const context = await requireAdminContext();

  if (context.role === "staff") {
    redirect("/admin/appointments");
  }

  const business = context.business;
  const metrics = await getDashboardMetrics(business.id);


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {business.name}
          </h1>
        </div>
        <div className="text-xs text-muted-foreground">
          Budapest Timezone · <span className="font-mono">{BUSINESS_TIMEZONE}</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Today’s Bookings
            </span>
            <Calendar className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{metrics.todayCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Upcoming
            </span>
            <Clock className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{metrics.upcomingCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Pending Approval
            </span>
            <Badge variant={metrics.pendingCount > 0 ? "warning" : "outline"}>
              {metrics.pendingCount}
            </Badge>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{metrics.pendingCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Active Services
            </span>
            <Scissors className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {metrics.activeServicesCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Portfolio Photos
            </span>
            <ImageIcon className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{metrics.portfolioCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/appointments?action=new"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-muted/30 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Plus className="size-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                New Appointment
              </span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/services?action=new"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-muted/30 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <Scissors className="size-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">Add Service</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/working-hours"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-muted/30 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400">
                <Clock className="size-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">Manage Hours</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/portfolio?action=new"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-muted/30 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                <ImageIcon className="size-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Upload Portfolio
              </span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Upcoming Appointments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Upcoming Appointments
          </h2>
          <Link
            href="/admin/appointments"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {metrics.upcomingList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
            <p className="text-sm text-muted-foreground">
              No upcoming appointments scheduled.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {metrics.upcomingList.map((app) => {
              const startParts = utcToBudapestParts(app.start_at);
              const endParts = utcToBudapestParts(app.end_at);
              const svc = app.services as { name_en?: string } | null;

              return (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary mt-0.5 shrink-0">
                      <User className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {app.customer_name}
                        </span>
                        <Badge
                          variant={
                            app.status === "pending"
                              ? "warning"
                              : app.status === "confirmed"
                              ? "info"
                              : "secondary"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {app.customer_phone}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-foreground">
                          {svc?.name_en || "Service"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs shrink-0 self-end sm:self-center">
                    <span className="font-semibold text-foreground block">
                      {startParts.formattedDate}
                    </span>
                    <span className="text-muted-foreground">
                      {startParts.timeStr} – {endParts.timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
