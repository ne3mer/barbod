"use server";

import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

export type ServiceFormData = {
  name_en: string;
  name_hu: string;
  description_en?: string | null;
  description_hu?: string | null;
  price: number;
  currency?: string;
  duration_minutes: number;
  is_active?: boolean;
  sort_order?: number;
};

export async function createServiceAction(data: ServiceFormData) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to user account." };
  }

  if (!data.name_en?.trim()) {
    return { error: "English name is required." };
  }
  if (!data.name_hu?.trim()) {
    return { error: "Hungarian name is required." };
  }
  if (data.price === undefined || data.price < 0) {
    return { error: "Price must be greater than or equal to 0." };
  }
  if (!data.duration_minutes || data.duration_minutes <= 0) {
    return { error: "Duration must be greater than 0 minutes." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name_en: data.name_en.trim(),
    name_hu: data.name_hu.trim(),
    description_en: data.description_en?.trim() || null,
    description_hu: data.description_hu?.trim() || null,
    price: data.price,
    currency: data.currency?.trim() || "HUF",
    duration_minutes: Math.round(data.duration_minutes),
    is_active: data.is_active ?? true,
    sort_order: data.sort_order ?? 0,
  });

  if (error) {
    console.error("Failed to create service", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateServiceAction(
  id: string,
  data: Partial<ServiceFormData>
) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to user account." };
  }

  if (data.name_en !== undefined && !data.name_en.trim()) {
    return { error: "English name cannot be blank." };
  }
  if (data.name_hu !== undefined && !data.name_hu.trim()) {
    return { error: "Hungarian name cannot be blank." };
  }
  if (data.price !== undefined && data.price < 0) {
    return { error: "Price must be >= 0." };
  }
  if (data.duration_minutes !== undefined && data.duration_minutes <= 0) {
    return { error: "Duration must be > 0 minutes." };
  }

  const supabase = await createClient();

  const updatePayload: TablesUpdate<"services"> = {};
  if (data.name_en !== undefined) updatePayload.name_en = data.name_en.trim();
  if (data.name_hu !== undefined) updatePayload.name_hu = data.name_hu.trim();
  if (data.description_en !== undefined)
    updatePayload.description_en = data.description_en ? data.description_en.trim() : null;
  if (data.description_hu !== undefined)
    updatePayload.description_hu = data.description_hu ? data.description_hu.trim() : null;
  if (data.price !== undefined) updatePayload.price = data.price;
  if (data.currency !== undefined)
    updatePayload.currency = data.currency.trim() || "HUF";
  if (data.duration_minutes !== undefined)
    updatePayload.duration_minutes = Math.round(data.duration_minutes);
  if (data.is_active !== undefined) updatePayload.is_active = data.is_active;
  if (data.sort_order !== undefined) updatePayload.sort_order = data.sort_order;

  const { error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to update service", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleServiceActiveAction(id: string, is_active: boolean) {
  return updateServiceAction(id, { is_active });
}

export async function deleteServiceAction(id: string) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to user account." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to delete service", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  return { success: true };
}

export async function reorderServicesAction(orderedIds: string[]) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to user account." };
  }

  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("services")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("business_id", business.id)
  );

  await Promise.all(updates);

  revalidatePath("/admin/services");
  return { success: true };
}
