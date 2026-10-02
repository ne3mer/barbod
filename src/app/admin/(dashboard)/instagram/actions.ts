"use server";

import { requireAdminContext } from "@/lib/auth/session";
import { fetchInstagramFeed } from "@/lib/instagram/client";
import { revalidatePath } from "next/cache";

export async function refreshInstagramFeedCacheAction() {
  try {
    await requireAdminContext();
    await fetchInstagramFeed(true);
    revalidatePath("/");
    revalidatePath("/admin/instagram");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to refresh Instagram cache.";
    return { error: message };
  }
}
