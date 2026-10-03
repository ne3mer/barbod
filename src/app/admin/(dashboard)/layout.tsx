import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminContext } from "@/lib/auth/session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminContext();

  return (
    <AdminShell
      businessName={context.business.name}
      role={context.role}
      barberName={context.barber?.name ?? null}
      userEmail={context.user.email ?? null}
    >
      {children}
    </AdminShell>
  );
}

