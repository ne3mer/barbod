import { requireAdminContext } from "@/lib/auth/session";
import { fetchInstagramFeed } from "@/lib/instagram/client";
import { InstagramManager } from "@/components/admin/instagram-manager";

export const metadata = {
  title: "Instagram Feed | Barbod Admin",
};

export default async function AdminInstagramPage() {
  await requireAdminContext();
  const feed = await fetchInstagramFeed();

  return <InstagramManager feed={feed} />;
}
