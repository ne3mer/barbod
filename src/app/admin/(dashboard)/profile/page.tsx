import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/session";
import { StaffProfileManager } from "@/components/admin/staff-profile-manager";

export const metadata = {
  title: "My Profile | Barbod Staff",
};

export default async function StaffProfilePage() {
  const context = await requireAdminContext();

  if (!context.barber) {
    if (context.role === "owner") {
      redirect("/admin/barbers");
    }
    return <div className="p-4 text-center">No barber profile linked to your account.</div>;
  }

  return <StaffProfileManager barber={context.barber} />;

}
