"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioCategory } from "@/types";
import type { TablesUpdate } from "@/types/database";

export type PortfolioInput = {
  barber_id?: string;
  title_en?: string | null;
  title_hu?: string | null;
  image_path: string;
  category?: PortfolioCategory | null;
  is_visible?: boolean;
};

export async function createPortfolioItemAction(data: PortfolioInput) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    if (!context.barber) {
      return { error: "Staff barber profile not found." };
    }
    data.barber_id = context.barber.id;
  }

  if (!data.image_path) {
    return { error: "Image path is required." };
  }

  // Determine barber_id
  let barberId = data.barber_id;
  if (!barberId) {
    const { data: firstBarber } = await supabase
      .from("barbers")
      .select("id")
      .eq("business_id", business.id)
      .limit(1)
      .single();
    barberId = firstBarber?.id;
  }

  if (!barberId) {
    return { error: "No barber found for business." };
  }

  // Get next sort order
  const { count } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("portfolio_items").insert({
    business_id: business.id,
    barber_id: barberId,
    title_en: data.title_en?.trim() || null,
    title_hu: data.title_hu?.trim() || null,
    image_path: data.image_path,
    category: data.category || "Haircuts",
    sort_order: count ?? 0,
    is_visible: data.is_visible ?? true,
  });

  if (error) {
    console.error("Failed to insert portfolio item", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePortfolioItemAction(
  id: string,
  data: Partial<PortfolioInput>
) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    const { data: targetItem } = await supabase
      .from("portfolio_items")
      .select("barber_id")
      .eq("id", id)
      .single();

    if (!targetItem || targetItem.barber_id !== context.barber?.id) {
      return { error: "Unauthorized: You can only edit your own portfolio items." };
    }
    data.barber_id = context.barber.id;
  }

  const updatePayload: TablesUpdate<"portfolio_items"> = {};
  if (data.barber_id !== undefined) updatePayload.barber_id = data.barber_id;
  if (data.title_en !== undefined) updatePayload.title_en = data.title_en?.trim() || null;
  if (data.title_hu !== undefined) updatePayload.title_hu = data.title_hu?.trim() || null;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.is_visible !== undefined) updatePayload.is_visible = data.is_visible;

  const { error } = await supabase
    .from("portfolio_items")
    .update(updatePayload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to update portfolio item", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/admin");
  return { success: true };
}

export async function togglePortfolioVisibilityAction(
  id: string,
  is_visible: boolean
) {
  return updatePortfolioItemAction(id, { is_visible });
}

export async function deletePortfolioItemAction(id: string, imagePath: string) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  if (context.role === "staff") {
    const { data: targetItem } = await supabase
      .from("portfolio_items")
      .select("barber_id")
      .eq("id", id)
      .single();

    if (!targetItem || targetItem.barber_id !== context.barber?.id) {
      return { error: "Unauthorized: You can only delete your own portfolio items." };
    }
  }

  // 1. Delete storage file
  const { error: storageErr } = await supabase.storage
    .from("portfolio")
    .remove([imagePath]);

  if (storageErr) {
    console.warn("Storage deletion warning", storageErr.message);
  }

  // 2. Delete database row
  const { error: dbErr } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (dbErr) {
    console.error("Failed to delete portfolio DB row", dbErr.message);
    return { error: dbErr.message };
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/admin");
  return { success: true };
}

export async function reorderPortfolioAction(orderedIds: string[]) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("portfolio_items")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("business_id", business.id)
  );

  await Promise.all(updates);

  revalidatePath("/admin/portfolio");
  return { success: true };
}

