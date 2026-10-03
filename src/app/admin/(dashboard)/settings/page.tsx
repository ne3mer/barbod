import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/session";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { OwnerAccountEmailCard } from "@/components/admin/owner-account-email-card";

export const metadata = {
  title: "Settings | Barbod Admin",
};

export default async function AdminSettingsPage() {
  const context = await requireAdminContext();

  if (context.role === "staff") {
    redirect("/admin/appointments");
  }

  return (
    <div className="space-y-8">
      <SettingsEditor business={context.business} />
      <OwnerAccountEmailCard currentEmail={context.user.email ?? ""} />
    </div>
  );
}

