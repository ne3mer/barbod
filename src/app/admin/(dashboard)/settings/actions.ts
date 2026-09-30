"use server";

import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type BusinessSettingsInput = {
  name: string;
  description_en?: string | null;
  description_hu?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  instagram_url?: string | null;
  logo_url?: string | null;
};

export async function updateBusinessSettingsAction(data: BusinessSettingsInput) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "No business linked to user account." };
  }

  if (!data.name?.trim()) {
    return { error: "Business name is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      name: data.name.trim(),
      description_en: data.description_en?.trim() || null,
      description_hu: data.description_hu?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
    })
    .eq("id", business.id)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Failed to update business settings", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
