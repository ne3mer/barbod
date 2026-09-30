import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsManager } from "@/components/admin/appointments-manager";

export const metadata = {
  title: "Schedule & Appointments | Barbod Admin",
};

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const context = await requireAdminContext();
  const business = context.business;
  const isStaff = context.role === "staff" && context.barber !== null;

  const supabase = await createClient();

  // Load barbers
  let barbersQuery = supabase
    .from("barbers")
    .select("*")
    .eq("business_id", business.id)
    .order("display_order", { ascending: true });

  if (isStaff) {
    barbersQuery = barbersQuery.eq("id", context.barber!.id);
  }

  const { data: barbers } = await barbersQuery;

  // Load services (if staff, filter by assigned services if desired, or all business services)
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  // Load blocked times
  let blockedQuery = supabase
    .from("blocked_times")
    .select("*")
    .eq("business_id", business.id)
    .order("start_at", { ascending: true });

  if (isStaff) {
    blockedQuery = blockedQuery.eq("barber_id", context.barber!.id);
  }

  const { data: blockedTimes } = await blockedQuery;

  // Load appointments with joined services and barbers
  let appointmentsQuery = supabase
    .from("appointments")
    .select("*, services(*), barbers(*)")
    .eq("business_id", business.id)
    .order("start_at", { ascending: false });

  if (isStaff) {
    appointmentsQuery = appointmentsQuery.eq("barber_id", context.barber!.id);
  }

  const { data: appointments, error } = await appointmentsQuery;

  if (error) {
    console.error("Error loading appointments", error.message);
  }

  const resolvedParams = await searchParams;
  const initialNewModalOpen = resolvedParams.action === "new";

  return (
    <AppointmentsManager
      initialAppointments={appointments ?? []}
      barbers={barbers ?? []}
      services={services ?? []}
      blockedTimes={blockedTimes ?? []}
      initialNewModalOpen={initialNewModalOpen}
    />
  );
}

