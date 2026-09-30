import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata = {
  title: "Settings | Barbod Admin",
};

export default async function AdminSettingsPage() {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return <div className="p-4 text-center">No business found for user.</div>;
  }

  return <SettingsEditor business={business} />;
}
