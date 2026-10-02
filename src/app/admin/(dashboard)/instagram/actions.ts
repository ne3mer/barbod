"use server";

import { requireAdminContext } from "@/lib/auth/session";
import { fetchInstagramFeed } from "@/lib/instagram/client";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function refreshInstagramFeedCacheAction() {
  try {
    const context = await requireAdminContext();
    await fetchInstagramFeed(true, context.business.id);
    revalidatePath("/");
    revalidatePath("/admin/instagram");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to refresh Instagram cache.";
    return { error: message };
  }
}

export async function disconnectInstagramAction() {
  try {
    const context = await requireAdminContext();
    if (context.role !== "owner") {
      return { error: "Only the business owner can disconnect Instagram." };
    }

    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("instagram_connections")
      .delete()
      .eq("business_id", context.business.id);

    if (dbError) {
      console.error("[Instagram Disconnect Error]:", dbError.message);
      return { error: `Failed to disconnect Instagram: ${dbError.message}` };
    }

    // Force refresh cache to revert to fallback/disconnected state immediately
    await fetchInstagramFeed(true, context.business.id);

    revalidatePath("/");
    revalidatePath("/admin/instagram");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Instagram.";
    return { error: message };
  }
}
