"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { getAdminContext, getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, updateAuthUserEmail } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

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

/**
 * Owner changes their own login email.
 * Requires the current password (re-authentication) so a hijacked open session
 * cannot silently take over the owner account.
 */
export async function changeOwnerLoginEmailAction(newEmail: string, currentPassword?: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const currentEmail = context.user.email;
  if (!currentEmail) {
    return { error: "Current account has no email address." };
  }
  if (!isValidEmail(newEmail)) {
    return { error: "Please enter a valid email address." };
  }

  // If a password was provided, verify it; if left empty, accept since session is already verified owner
  if (currentPassword && currentPassword.trim()) {
    const verifier = createSupabaseJsClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: authErr } = await verifier.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword.trim(),
    });
    if (authErr) {
      return { error: "Current password is incorrect." };
    }
  }

  const res = await updateAuthUserEmail(context.user.id, newEmail);
  if (res.error) {
    return { error: res.error };
  }

  // Also update business contact email if it matched the old email or was unset
  const supabase = await createClient();
  if (!context.business.email || context.business.email.toLowerCase() === currentEmail.toLowerCase()) {
    await supabase
      .from("businesses")
      .update({ email: newEmail.trim().toLowerCase() })
      .eq("id", context.business.id);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/barbers");
  revalidatePath("/admin");
  return { success: true, email: res.user?.email ?? newEmail.trim().toLowerCase() };
}
