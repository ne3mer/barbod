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
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Change the login email of an existing Supabase Auth user (server-only, service role).
 * The new email is marked confirmed immediately because the change is performed by
 * the authenticated business owner. Rejects emails already used by another account.
 */
export async function updateAuthUserEmail(userId: string, newEmail: string) {
  const adminClient = createAdminClient();
  if (!adminClient) return { error: "Supabase Admin client not configured (SUPABASE_SERVICE_ROLE_KEY missing)." };

  const target = newEmail.trim().toLowerCase();
  if (!isValidEmail(target)) return { error: "Please enter a valid email address." };

  const { user: existing, error: lookupErr } = await findAuthUserByEmail(target);
  if (lookupErr) return { error: `Auth lookup failed: ${lookupErr}` };
  if (existing && existing.id !== userId) {
    return { error: `The email ${target} is already used by another account.` };
  }
  if (existing && existing.id === userId) {
    return { error: "This is already the current login email." };
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    email: target,
    email_confirm: true,
  });

  if (error || !data.user) {
    return { error: error?.message || "Failed to update login email." };
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

