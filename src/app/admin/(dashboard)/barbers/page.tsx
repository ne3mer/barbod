import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/auth/session";
import { BarbersManager } from "@/components/admin/barbers-manager";

export const metadata = {
  title: "Barbers & Staff Management | Barbod Admin",
};

export default async function AdminBarbersPage() {
  const context = await requireAdminContext();

  if (context.role === "staff") {
    redirect("/admin/profile");
  }

  const business = context.business;

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

  // Fetch linked emails for barbers with user_id
  const userEmailMap: Record<string, string> = {};
  const linkedUserIds = (barbers ?? []).map((b) => b.user_id).filter(Boolean) as string[];

  if (linkedUserIds.length > 0) {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersData?.users) {
        usersData.users.forEach((u) => {
          userEmailMap[u.id] = u.email || "";
        });
      }
    }
  }

  // Ensure owner user email is always mapped even if auth list is cached/delayed
  if (context.user.id && context.user.email) {
    userEmailMap[context.user.id] = userEmailMap[context.user.id] || context.user.email;
  }

  const barbersWithServices = (barbers ?? []).map((b) => ({
    ...b,
    assignedServiceIds: bsMap[b.id] || [],
    linkedEmail: b.user_id ? userEmailMap[b.user_id] || null : null,
  }));

  return (
    <BarbersManager
      barbers={barbersWithServices}
      allServices={services ?? []}
      ownerUserId={context.user.id}
    />
  );
}
