import { BUSINESS_TIMEZONE } from "@/types";
import type { AdminBusiness } from "@/lib/auth/session";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin",
};

const PLACEHOLDER_SECTIONS = [
  "Calendar",
  "Appointments",
  "Services",
  "Working Hours",
  "Portfolio",
  "Settings",
] as const;

function budapestDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getAppointmentOverview(businessId: string) {
  const supabase = await createClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("appointments")
    .select("id, start_at, status")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString())
    .order("start_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Failed to load appointment overview", error.message);
    return { todayCount: 0, upcomingCount: 0 };
  }

  const todayKey = budapestDayKey(now);
  let todayCount = 0;
  let upcomingCount = 0;

  for (const row of data ?? []) {
    const start = new Date(row.start_at);
    if (budapestDayKey(start) === todayKey) {
      todayCount += 1;
    }
    if (start.getTime() >= now.getTime()) {
      upcomingCount += 1;
    }
  }

  return { todayCount, upcomingCount };
}

function NoBusinessState() {
  return (
    <div className="mx-auto max-w-lg space-y-3 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Setup required
      </p>
      <h1 className="text-2xl font-medium tracking-tight">
        No business configured
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Your account is signed in, but no business is linked to it yet. Ask an
        administrator to attach a business to this owner, or run the project
        seed for your profile.
      </p>
    </div>
  );
}

function DashboardOverview({
  business,
  todayCount,
  upcomingCount,
}: {
  business: AdminBusiness;
  todayCount: number;
  upcomingCount: number;
}) {
  const statusBits = [
    business.phone ? "Phone on file" : "Phone missing",
    business.email ? "Email on file" : "Email missing",
    business.address ? "Address on file" : "Address missing",
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="text-3xl font-medium tracking-tight">{business.name}</h1>
        <p className="text-sm text-muted-foreground">
          slug <span className="font-mono text-foreground">{business.slug}</span>
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <OverviewStat label="Today’s appointments" value={String(todayCount)} />
        <OverviewStat
          label="Upcoming appointments"
          value={String(upcomingCount)}
        />
        <div className="border border-border/70 bg-background px-4 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Business status
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Active · {statusBits.join(" · ")}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <p className="text-sm text-muted-foreground">
          Management tools will be connected in the next phase. These sections
          are placeholders only.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_SECTIONS.map((section) => (
            <div
              key={section}
              className="border border-dashed border-border/80 px-4 py-4 text-sm text-muted-foreground"
            >
              {section}
              <span className="mt-1 block text-xs">Coming soon</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/70 bg-background px-4 py-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <NoBusinessState />;
  }

  const overview = await getAppointmentOverview(business.id);

  return (
    <DashboardOverview
      business={business}
      todayCount={overview.todayCount}
      upcomingCount={overview.upcomingCount}
    />
  );
}
