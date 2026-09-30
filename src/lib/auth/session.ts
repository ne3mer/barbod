import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminBusiness = Tables<"businesses">;

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
