"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnedBusiness, requireAuthUser } from "@/lib/auth/session";

export type BarberInput = {
  name: string;
  profile_photo_url?: string | null;
  bio_en?: string | null;
  bio_hu?: string | null;
  is_active?: boolean;
  display_order?: number;
  serviceIds?: string[];
};

export async function createBarberAction(input: BarberInput) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized: Business not found." };
  }

  if (!input.name?.trim()) {
    return { error: "Barber name is required." };
  }

  const supabase = await createClient();

  // 1. Insert Barber row
  const { data: barber, error } = await supabase
    .from("barbers")
    .insert({
      business_id: business.id,
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
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized: Business not found." };
  }

  if (!input.name?.trim()) {
    return { error: "Barber name is required." };
  }

  const supabase = await createClient();

  // 1. Update Barber row
  const { error } = await supabase
    .from("barbers")
    .update({
      name: input.name.trim(),
      profile_photo_url: input.profile_photo_url?.trim() || null,
      bio_en: input.bio_en?.trim() || null,
      bio_hu: input.bio_hu?.trim() || null,
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
    })
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

export async function toggleBarberActiveAction(id: string, is_active: boolean) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized." };
  }

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
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized." };
  }

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
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized: Business not found." };
  }

  const file = formData.get("file") as File | null;
  const barberId = formData.get("barberId") as string | null;

  if (!file || !barberId) {
    return { error: "File and Barber ID are required." };
  }

  // 1. Validate file size (<= 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
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
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true, publicUrl };
}

export async function deleteBarberProfilePhotoAction(barberId: string) {
  const user = await requireAuthUser();
  const business = await getOwnedBusiness(user.id);

  if (!business) {
    return { error: "Unauthorized." };
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
  revalidatePath("/admin/appointments");
  revalidatePath("/");
  revalidatePath("/book");

  return { success: true };
}
