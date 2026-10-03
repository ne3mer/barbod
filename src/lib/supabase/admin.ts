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

/**
 * Find a Supabase Auth user by email address.
 */
export async function findAuthUserByEmail(email: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const targetEmail = email.trim().toLowerCase();
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) return { error: error.message };

  const user = data.users.find((u) => u.email?.toLowerCase() === targetEmail);
  return { user: user || null };
}

/**
 * Find a Supabase Auth user by User ID.
 */
export async function findAuthUserById(userId: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data.user) return { error: error?.message || "Auth user not found." };

  return { user: data.user };
}

/**
 * Generate password recovery link for existing auth user.
 */
export async function generatePasswordRecoveryLink(email: string, redirectTo: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo,
    },
  });

  if (error || !data.properties?.action_link) {
    return { error: error?.message || "Failed to generate password setup link." };
  }

  return { actionLink: data.properties.action_link, user: data.user };
}

/**
 * Invite a brand new email via Supabase Auth Admin API.
 */
export async function inviteNewUserByEmail(email: string, redirectTo: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { redirectTo }
  );

  if (error || !data.user) {
    return { error: error?.message || "Failed to invite new user by email." };
  }

  return { user: data.user };
}

/**
 * Generate an invitation link for a new email via Supabase Auth Admin API without requiring SMTP.
 */
export async function generateInviteLink(email: string, redirectTo: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo,
    },
  });

  if (error || !data.properties?.action_link) {
    return { error: error?.message || "Failed to generate invite link." };
  }

  return { actionLink: data.properties.action_link, user: data.user };
}

/**
 * Triggers Supabase Auth to send a password reset / recovery email to the end user.
 * Uses adminClient.auth.resetPasswordForEmail() which dispatches the email via Supabase Auth email service.
 */
export async function sendPasswordResetEmail(email: string, redirectTo: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured." };

  const { data, error } = await adminClient.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo }
  );

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { error: "Email send rate limit exceeded. Please wait 60 seconds before requesting another email." };
    }
    return { error: error.message };
  }

  return { success: true, data };
}

