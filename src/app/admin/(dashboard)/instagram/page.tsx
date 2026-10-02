import { requireAdminContext } from "@/lib/auth/session";
import { fetchInstagramFeed } from "@/lib/instagram/client";
import { InstagramManager } from "@/components/admin/instagram-manager";

export const metadata = {
  title: "Instagram Connection | Barbod Admin",
};

export default async function AdminInstagramPage() {
  const context = await requireAdminContext();
  const feed = await fetchInstagramFeed(false, context.business.id);

  return <InstagramManager feed={feed} userRole={context.role} />;
}
