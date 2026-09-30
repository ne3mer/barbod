import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Creates a server-only Supabase Admin client with service-role privileges.
 * DO NOT expose this client or service-role key to the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    return null;
  }
  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
