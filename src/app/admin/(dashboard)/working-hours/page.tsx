import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { WorkingHoursEditor } from "@/components/admin/working-hours-editor";

export const metadata = {
  title: "Working Hours | Barbod Admin",
};

export default async function AdminWorkingHoursPage() {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <div className="p-4 text-center">No business found for user.</div>;
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("working_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error loading working hours", error.message);
  }

  return <WorkingHoursEditor initialRows={rows ?? []} />;
}
