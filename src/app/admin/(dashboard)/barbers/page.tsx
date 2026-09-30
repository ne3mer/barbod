import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { BarbersManager } from "@/components/admin/barbers-manager";

export const metadata = {
  title: "Barbers & Staff Management | Barbod Admin",
};

export default async function AdminBarbersPage() {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    redirect("/admin/login");
  }

  const supabase = await createClient();

  // Fetch barbers
  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("business_id", business.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Fetch all business services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  // Fetch all barber services assignments
  const { data: barberServices } = await supabase
    .from("barber_services")
    .select("*");

  const bsMap: Record<string, string[]> = {};
  (barberServices ?? []).forEach((row) => {
    if (!bsMap[row.barber_id]) bsMap[row.barber_id] = [];
    bsMap[row.barber_id].push(row.service_id);
  });

  const barbersWithServices = (barbers ?? []).map((b) => ({
    ...b,
    assignedServiceIds: bsMap[b.id] || [],
  }));

  return (
    <BarbersManager
      barbers={barbersWithServices}
      allServices={services ?? []}
    />
  );
}
