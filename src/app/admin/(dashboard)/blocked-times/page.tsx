import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BlockedTimesManager } from "@/components/admin/blocked-times-manager";

export const metadata = {
  title: "Blocked Times | Barbod Admin",
};

export default async function AdminBlockedTimesPage() {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <div className="p-4 text-center">No business found for user.</div>;
  }

  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("blocked_times")
    .select("*")
    .eq("business_id", business.id)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error loading blocked times", error.message);
  }

  return <BlockedTimesManager initialItems={items ?? []} />;
}
