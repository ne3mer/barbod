import { AdminShell } from "@/components/layout/admin-shell";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  return (
    <AdminShell businessName={business?.name ?? null}>{children}</AdminShell>
  );
}
