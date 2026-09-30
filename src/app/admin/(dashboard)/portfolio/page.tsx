import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PortfolioManager } from "@/components/admin/portfolio-manager";

export const metadata = {
  title: "Portfolio | Barbod Admin",
};

export default async function AdminPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const context = await requireAdminContext();
  const business = context.business;
  const isStaff = context.role === "staff" && context.barber !== null;

  const supabase = await createClient();

  let query = supabase
    .from("portfolio_items")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (isStaff) {
    query = query.eq("barber_id", context.barber!.id);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error loading portfolio items", error.message);
  }

  const resolvedParams = await searchParams;
  const initialNewModalOpen = resolvedParams.action === "new";

  return (
    <PortfolioManager
      businessId={business.id}
      initialItems={items ?? []}
      initialNewModalOpen={initialNewModalOpen}
    />
  );
}

