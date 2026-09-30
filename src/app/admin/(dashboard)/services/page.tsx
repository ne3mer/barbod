import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/admin/services-manager";

export const metadata = {
  title: "Services | Barbod Admin",
};

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <div className="p-4 text-center">No business found for user.</div>;
  }

  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading services", error.message);
  }

  const resolvedParams = await searchParams;
  const initialNewModalOpen = resolvedParams.action === "new";

  return (
    <ServicesManager
      initialServices={services ?? []}
      initialNewModalOpen={initialNewModalOpen}
    />
  );
}
