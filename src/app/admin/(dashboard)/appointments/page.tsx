import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsManager } from "@/components/admin/appointments-manager";

export const metadata = {
  title: "Appointments | Barbod Admin",
};

export default async function AdminAppointmentsPage({
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

  // Load services for dropdown
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  // Load appointments with joined services
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*, services(*)")
    .eq("business_id", business.id)
    .order("start_at", { ascending: false });

  if (error) {
    console.error("Error loading appointments", error.message);
  }

  const resolvedParams = await searchParams;
  const initialNewModalOpen = resolvedParams.action === "new";

  return (
    <AppointmentsManager
      initialAppointments={appointments ?? []}
      services={services ?? []}
      initialNewModalOpen={initialNewModalOpen}
    />
  );
}
