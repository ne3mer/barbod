import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BlockedTimesManager } from "@/components/admin/blocked-times-manager";

export const metadata = {
  title: "Blocked Times | Barbod Admin",
};

export default async function AdminBlockedTimesPage() {
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

  // Load blocked times
  let blockedQuery = supabase
    .from("blocked_times")
    .select("*")
    .eq("business_id", business.id)
    .order("start_at", { ascending: true });

  if (isStaff) {
    blockedQuery = blockedQuery.eq("barber_id", context.barber!.id);
  }

  const { data: items, error } = await blockedQuery;

  if (error) {
    console.error("Error loading blocked times", error.message);
  }

  return (
    <BlockedTimesManager
      initialItems={items ?? []}
      barbers={barbers ?? []}
    />
  );
}

