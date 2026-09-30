import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/session";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata = {
  title: "Settings | Barbod Admin",
};

export default async function AdminSettingsPage() {
  const context = await requireAdminContext();

  if (context.role === "staff") {
    redirect("/admin/appointments");
  }

  return <SettingsEditor business={context.business} />;
}

