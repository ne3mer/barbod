import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { WorkingHoursEditor } from "@/components/admin/working-hours-editor";

export const metadata = {
  title: "Working Hours | Barbod Admin",
};

export default async function AdminWorkingHoursPage() {
  const context = await requireAdminContext();
  const business = context.business;
  const isStaff = context.role === "staff" && context.barber !== null;

  const supabase = await createClient();

  // Load barbers for selector
  let barbersQuery = supabase
    .from("barbers")
    .select("*")
    .eq("business_id", business.id)
    .order("display_order", { ascending: true });

  if (isStaff) {
    barbersQuery = barbersQuery.eq("id", context.barber!.id);
  }

  const { data: barbers } = await barbersQuery;

  let query = supabase
    .from("working_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (isStaff) {
    query = query.eq("barber_id", context.barber!.id);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("Error loading working hours", error.message);
  }

  return (
    <WorkingHoursEditor
      initialRows={rows ?? []}
      barbers={barbers ?? []}
      isOwner={context.role === "owner"}
      currentBarberId={context.barber?.id ?? null}
    />
  );
}

