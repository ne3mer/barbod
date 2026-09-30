import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
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
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <div className="p-4 text-center">No business found for user.</div>;
  }

  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

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
