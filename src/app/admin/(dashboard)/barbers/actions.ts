"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  findAuthUserByEmail,
  findAuthUserById,
  inviteNewUserByEmail,
  generateInviteLink,
  generatePasswordRecoveryLink,
  sendPasswordResetEmail,
  updateAuthUserEmail,
} from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/auth/session";
import { getCanonicalSiteUrl } from "@/lib/utils/url";
import type { TablesUpdate } from "@/types/database";


export type BarberInput = {
  name: string;
  profile_photo_url?: string | null;
  bio_en?: string | null;
  bio_hu?: string | null;
  is_active?: boolean;
  display_order?: number;
  serviceIds?: string[];
  user_id?: string | null;
};

export async function createBarberAction(input: BarberInput) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const business = context.business;

  if (!input.name?.trim()) {
    return { error: "Barber name is required." };
  }

  const supabase = await createClient();

  // 1. Insert Barber row
  const { data: barber, error } = await supabase
    .from("barbers")
    .insert({
      business_id: business.id,
      user_id: input.user_id || null,
      name: input.name.trim(),
      profile_photo_url: input.profile_photo_url?.trim() || null,
      bio_en: input.bio_en?.trim() || null,
      bio_hu: input.bio_hu?.trim() || null,
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !barber) {
    console.error("Failed to create barber", error?.message);
    return { error: "Failed to create barber." };
  }

  // 2. Insert barber_services if provided
  if (input.serviceIds && input.serviceIds.length > 0) {
    const rows = input.serviceIds.map((serviceId) => ({
      barber_id: barber.id,
      service_id: serviceId,
    }));

    const { error: bsErr } = await supabase.from("barber_services").insert(rows);
    if (bsErr) {
      console.error("Failed to assign barber services", bsErr.message);
    }
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true, barber };
}

export async function updateBarberAction(id: string, input: BarberInput) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const supabase = await createClient();

  // Staff can update their own profile fields via staff profile route
  if (context.role === "staff") {
    if (id !== context.barber?.id) {
      return { error: "Unauthorized: You can only update your own profile." };
    }
    const { error } = await supabase
      .from("barbers")
      .update({
        name: input.name.trim(),
        profile_photo_url: input.profile_photo_url?.trim() || null,
        bio_en: input.bio_en?.trim() || null,
        bio_hu: input.bio_hu?.trim() || null,
      })
      .eq("id", id)
      .eq("business_id", context.business.id);

    if (error) return { error: "Failed to update profile." };
    revalidatePath("/admin/profile");
    revalidatePath("/admin/barbers");
    revalidatePath("/");
    return { success: true };
  }

  if (context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const business = context.business;

  if (!input.name?.trim()) {
    return { error: "Barber name is required." };
  }

  // 1. Update Barber row
  const updateData: TablesUpdate<"barbers"> = {

    name: input.name.trim(),
    profile_photo_url: input.profile_photo_url?.trim() || null,
    bio_en: input.bio_en?.trim() || null,
    bio_hu: input.bio_hu?.trim() || null,
    is_active: input.is_active ?? true,
    display_order: input.display_order ?? 0,
  };

  if (input.user_id !== undefined) {
    updateData.user_id = input.user_id || null;
  }


  const { error } = await supabase
    .from("barbers")
    .update(updateData)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to update barber", error.message);
    return { error: "Failed to update barber." };
  }

  // 2. Update service assignments if provided
  if (input.serviceIds !== undefined) {
    await supabase.from("barber_services").delete().eq("barber_id", id);

    if (input.serviceIds.length > 0) {
      const rows = input.serviceIds.map((serviceId) => ({
        barber_id: id,
        service_id: serviceId,
      }));
      await supabase.from("barber_services").insert(rows);
    }
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true };
}


export async function linkBarberUserAction(barberId: string, targetUserId: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const supabase = await createClient();

  // Ensure target user is not already linked to another barber
  const { data: existing } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("user_id", targetUserId.trim())
    .neq("id", barberId)
    .maybeSingle();

  if (existing) {
    return { error: `User ID is already linked to ${existing.name}.` };
  }

  const { error } = await supabase
    .from("barbers")
    .update({ user_id: targetUserId.trim() || null })
    .eq("id", barberId)
    .eq("business_id", context.business.id);

  if (error) {
    return { error: `Failed to link account: ${error.message}` };
  }

  revalidatePath("/admin/barbers");
  return { success: true };
}

export async function inviteOrConnectBarberAction(barberId: string, email: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { error: "A valid email address is required." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      error:
        "Server configuration missing: SUPABASE_SERVICE_ROLE_KEY environment variable is required to manage barber accounts.",
    };
  }

  const supabase = await createClient();

  // Verify barber exists and belongs to owner's business
  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, name, user_id, business_id")
    .eq("id", barberId)
    .single();

  if (barErr || !barber || barber.business_id !== context.business.id) {
    return { error: "Barber record not found." };
  }

  const siteUrl = await getCanonicalSiteUrl();
  const resetRedirectUrl = `${siteUrl}/admin/reset-password`;

  // Check if auth user already exists for this email
  const { user: existingAuthUser, error: lookupErr } = await findAuthUserByEmail(trimmedEmail);
  if (lookupErr) {
    return { error: `Auth lookup failed: ${lookupErr}` };
  }

  if (existingAuthUser) {
    // CASE B: Existing Auth User
    // Check if this Auth user is already linked to another barber
    const { data: alreadyLinked } = await supabase
      .from("barbers")
      .select("id, name")
      .eq("user_id", existingAuthUser.id)
      .neq("id", barberId)
      .maybeSingle();

    if (alreadyLinked) {
      return {
        error: `Account (${trimmedEmail}) is already linked to barber "${alreadyLinked.name}".`,
      };
    }

    // Link user_id to barber
    const { error: updateErr } = await supabase
      .from("barbers")
      .update({ user_id: existingAuthUser.id })
      .eq("id", barberId)
      .eq("business_id", context.business.id);

    if (updateErr) {
      return { error: `Failed to link account to barber record: ${updateErr.message}` };
    }

    // Generate action link so owner can view/copy link directly if needed
    const linkRes = await generatePasswordRecoveryLink(trimmedEmail, resetRedirectUrl);

    // Send password setup / recovery email via Supabase Auth
    const emailRes = await sendPasswordResetEmail(trimmedEmail, resetRedirectUrl);
    if (emailRes.error && !linkRes.actionLink) {
      return {
        error: `Account linked successfully, but sending password setup email failed: ${emailRes.error}`,
      };
    }

    revalidatePath("/admin/barbers");
    return {
      success: true,
      mode: "connected" as const,
      email: trimmedEmail,
      userId: existingAuthUser.id,
      actionLink: linkRes.actionLink || null,
    };
  } else {
    // CASE A: New Barber Email -> Invite
    // Generate direct invite action link
    const linkRes = await generateInviteLink(trimmedEmail, resetRedirectUrl);

    // Also dispatch official invite email via Supabase Auth Admin API
    const inviteRes = await inviteNewUserByEmail(trimmedEmail, resetRedirectUrl);

    const newUserId = inviteRes.user?.id || linkRes.user?.id;
    if (!newUserId) {
      return { error: inviteRes.error || linkRes.error || "Failed to create auth invitation." };
    }

    // Link newly invited user_id to barber
    const { error: updateErr } = await supabase
      .from("barbers")
      .update({ user_id: newUserId })
      .eq("id", barberId)
      .eq("business_id", context.business.id);

    if (updateErr) {
      return {
        error: `Invitation created, but failed to link account to barber record: ${updateErr.message}`,
      };
    }

    revalidatePath("/admin/barbers");
    return {
      success: true,
      mode: "invited" as const,
      email: trimmedEmail,
      userId: newUserId,
      actionLink: linkRes.actionLink || null,
    };
  }
}

export async function sendBarberPasswordResetAction(barberId: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const supabase = await createClient();

  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, name, user_id, business_id")
    .eq("id", barberId)
    .single();

  if (barErr || !barber || barber.business_id !== context.business.id) {
    return { error: "Barber record not found." };
  }

  if (!barber.user_id) {
    return { error: "This barber does not have a linked user account." };
  }

  const authUserRes = await findAuthUserById(barber.user_id);
  if (authUserRes.error || !authUserRes.user?.email) {
    return { error: authUserRes.error || "Linked Auth user not found." };
  }

  const siteUrl = await getCanonicalSiteUrl();
  const resetRedirectUrl = `${siteUrl}/admin/reset-password`;

  // Generate direct link for owner convenience
  const linkRes = await generatePasswordRecoveryLink(authUserRes.user.email, resetRedirectUrl);

  const emailRes = await sendPasswordResetEmail(authUserRes.user.email, resetRedirectUrl);
  if (emailRes.error && !linkRes.actionLink) {
    return { error: emailRes.error };
  }

  revalidatePath("/admin/barbers");
  return {
    success: true,
    email: authUserRes.user.email,
    actionLink: linkRes.actionLink || null,
  };
}

export async function changeBarberLoginEmailAction(barberId: string, newEmail: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const supabase = await createClient();
  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, name, user_id, business_id")
    .eq("id", barberId)
    .single();

  // Tenant isolation: barber must belong to the owner's business
  if (barErr || !barber || barber.business_id !== context.business.id) {
    return { error: "Barber record not found." };
  }
  if (!barber.user_id) {
    return { error: "This barber has no linked login account. Use \"Connect Account\" first." };
  }
  const isOwner = barber.user_id === context.user.id;

  const res = await updateAuthUserEmail(barber.user_id, newEmail);
  if (res.error) {
    return { error: res.error };
  }

  // If this barber is also the business owner, sync business contact email if it matched
  if (isOwner) {
    const currentBusinessEmail = context.business.email;
    if (!currentBusinessEmail || currentBusinessEmail.toLowerCase() === context.user.email?.toLowerCase()) {
      await supabase
        .from("businesses")
        .update({ email: newEmail.trim().toLowerCase() })
        .eq("id", context.business.id);
    }
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
  }

  revalidatePath("/admin/barbers");
  return {
    success: true,
    email: res.user?.email ?? newEmail.trim().toLowerCase(),
    isOwner,
  };
}

export async function unlinkBarberUserAction(barberId: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized: Owner access required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("barbers")
    .update({ user_id: null })
    .eq("id", barberId)
    .eq("business_id", context.business.id);

  if (error) {
    return { error: `Failed to unlink user account: ${error.message}` };
  }

  revalidatePath("/admin/barbers");
  return { success: true };
}

export async function toggleBarberActiveAction(id: string, is_active: boolean) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();
  const { error } = await supabase
    .from("barbers")
    .update({ is_active })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return { error: "Failed to update barber status." };
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true };
}

export async function deleteBarberAction(id: string) {
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const supabase = await createClient();
  const { error } = await supabase
    .from("barbers")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("Failed to delete barber", error.message);
    return { error: "Failed to delete barber. Ensure no active appointments exist." };
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true };
}

export async function uploadBarberProfilePhotoAction(formData: FormData) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;
  const file = formData.get("file") as File | null;
  const barberId = formData.get("barberId") as string | null;

  if (!file || !barberId) {
    return { error: "File and Barber ID are required." };
  }

  if (context.role === "staff" && barberId !== context.barber?.id) {
    return { error: "Unauthorized: You can only upload your own profile photo." };
  }

  // 1. Validate file size (<= 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { error: "File size exceeds maximum limit of 5 MB." };
  }

  // 2. Validate MIME type
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Allowed formats: JPEG, PNG, WEBP." };
  }

  const supabase = await createClient();

  // 3. Verify barber belongs to business
  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, business_id, profile_photo_url")
    .eq("id", barberId)
    .single();

  if (barErr || !barber || barber.business_id !== business.id) {
    return { error: "Barber not found or unauthorized." };
  }

  // 4. File extension & storage path
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `${business.id}/${barber.id}/${fileName}`;

  // 5. Convert file to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 6. Upload file to barber-profiles bucket
  const { error: uploadErr } = await supabase.storage
    .from("barber-profiles")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    console.error("Storage upload error", uploadErr.message);
    return { error: `Upload failed: ${uploadErr.message}` };
  }

  // 7. Get public URL
  const { data: urlData } = supabase.storage
    .from("barber-profiles")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // 8. If old photo existed in storage, safely remove old object
  if (barber.profile_photo_url && barber.profile_photo_url.includes("/barber-profiles/")) {
    try {
      const oldPath = barber.profile_photo_url.split("/barber-profiles/")[1];
      if (oldPath && oldPath !== storagePath) {
        await supabase.storage.from("barber-profiles").remove([oldPath]);
      }
    } catch (e) {
      console.warn("Failed to remove old profile photo", e);
    }
  }

  // 9. Update barber profile_photo_url
  const { error: updateErr } = await supabase
    .from("barbers")
    .update({ profile_photo_url: publicUrl })
    .eq("id", barber.id);

  if (updateErr) {
    return { error: "Failed to save photo URL to barber profile." };
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/profile");
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true, publicUrl };
}

export async function deleteBarberProfilePhotoAction(barberId: string) {
  const context = await getAdminContext();
  if (!context) {
    return { error: "Unauthorized." };
  }

  const business = context.business;

  if (context.role === "staff" && barberId !== context.barber?.id) {
    return { error: "Unauthorized: You can only remove your own profile photo." };
  }

  const supabase = await createClient();

  const { data: barber, error: barErr } = await supabase
    .from("barbers")
    .select("id, business_id, profile_photo_url")
    .eq("id", barberId)
    .single();

  if (barErr || !barber || barber.business_id !== business.id) {
    return { error: "Barber not found." };
  }

  if (barber.profile_photo_url && barber.profile_photo_url.includes("/barber-profiles/")) {
    const oldPath = barber.profile_photo_url.split("/barber-profiles/")[1];
    if (oldPath) {
      await supabase.storage.from("barber-profiles").remove([oldPath]);
    }
  }

  const { error: updateErr } = await supabase
    .from("barbers")
    .update({ profile_photo_url: null })
    .eq("id", barber.id);

  if (updateErr) {
    return { error: "Failed to remove photo URL." };
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/profile");
  revalidatePath("/");

  return { success: true };
}
