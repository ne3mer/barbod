import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminBusiness = Tables<"businesses">;
export type AdminBarber = Tables<"barbers">;
export type AdminRole = "owner" | "staff";

export type AdminContext = {
  user: User;
  business: AdminBusiness;
  role: AdminRole;
  barber: AdminBarber | null;
};

export async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/** Require an authenticated user for admin pages. Proxy should already redirect. */
export async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

/**
 * Load the business owned by the authenticated user via RLS.
 * Never accepts a client-supplied business_id for authorization.
 */
export async function getOwnedBusiness(
  ownerId: string,
): Promise<AdminBusiness | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load owned business", error.message);
    return null;
  }

  return data;
}

/**
 * Determine authenticated admin context for Owner vs Staff Barber.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  // 1. Check if user is business owner
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (business) {
    const { data: ownerBarber } = await supabase
      .from("barbers")
      .select("*")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      user,
      business,
      role: "owner",
      barber: ownerBarber ?? null,
    };
  }

  // 2. Check if user is an active staff barber
  const { data: staffBarber } = await supabase
    .from("barbers")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (staffBarber) {
    const { data: staffBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", staffBarber.business_id)
      .single();

    if (staffBusiness) {
      return {
        user,
        business: staffBusiness,
        role: "staff",
        barber: staffBarber,
      };
    }
  }

  return null;
}

/**
 * Require valid AdminContext (Owner or Active Staff) for admin dashboard pages.
 */
export async function requireAdminContext(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) {
    redirect("/admin/login");
  }
  return context;
}

