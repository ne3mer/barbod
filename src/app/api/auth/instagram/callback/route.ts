import { NextRequest, NextResponse } from "next/server";

import { getAdminContext } from "@/lib/auth/session";
import { getInstagramAppCredentials, getInstagramRedirectUri } from "@/lib/instagram/config";
import { encryptToken } from "@/lib/instagram/crypto";
import { createClient } from "@/lib/supabase/server";
import { fetchInstagramFeed } from "@/lib/instagram/client";

export async function GET(request: NextRequest) {
  const redirectUri = getInstagramRedirectUri();
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Read CSRF state from cookie
  const cookieState = request.cookies.get("instagram_oauth_state")?.value;

  // Create redirect response builder helper to ensure state cookie is deleted
  const buildRedirect = (urlPath: string) => {
    const res = NextResponse.redirect(new URL(urlPath, redirectUri));
    res.cookies.delete("instagram_oauth_state");
    return res;
  };

  // 1. CSRF State Validation
  if (!state || !cookieState || state !== cookieState) {
    console.error("[Instagram OAuth Error]: CSRF State Mismatch or missing state cookie.");
    return buildRedirect("/admin/instagram?error=state_mismatch");
  }

  // 2. OAuth Error or Denied Authorization
  if (oauthError) {
    console.warn("[Instagram OAuth Error]: User denied or OAuth error:", oauthError, errorDescription);
    return buildRedirect("/admin/instagram?error=access_denied");
  }

  if (!code) {
    console.error("[Instagram OAuth Error]: Missing authorization code.");
    return buildRedirect("/admin/instagram?error=missing_code");
  }

  // 3. Verify Admin Context (Must be Business Owner)
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    return buildRedirect("/admin/login?error=unauthorized");
  }

  const { appId, appSecret } = getInstagramAppCredentials();
  if (!appId || !appSecret) {
    console.error("[Instagram OAuth Error]: Missing INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET");
    return buildRedirect("/admin/instagram?error=missing_app_credentials");
  }

  try {
    // 4. Exchange authorization code for short-lived access token
    const tokenForm = new URLSearchParams();
    tokenForm.set("client_id", appId);
    tokenForm.set("client_secret", appSecret);
    tokenForm.set("grant_type", "authorization_code");
    tokenForm.set("redirect_uri", redirectUri);
    tokenForm.set("code", code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm.toString(),
    });

    if (!tokenRes.ok) {
      const errJson = await tokenRes.json().catch(() => ({}));
      console.error("[Instagram Token Exchange Error]:", tokenRes.status, errJson);
      throw new Error(errJson?.error_message || `Short-lived token HTTP ${tokenRes.status}`);
    }

    const shortTokenData = await tokenRes.json();
    const shortLivedToken = shortTokenData?.access_token;
    const initialUserId = shortTokenData?.user_id ? String(shortTokenData.user_id) : "";

    if (!shortLivedToken) {
      throw new Error("No access_token returned from Instagram authorization code exchange.");
    }

    // 5. Exchange short-lived token for long-lived access token (60 days)
    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
    const longTokenRes = await fetch(longTokenUrl, {
      headers: { Accept: "application/json" },
    });

    let finalAccessToken = shortLivedToken;
    let expiresSeconds = 60 * 60 * 24 * 60; // 60 days default

    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json();
      if (longTokenData?.access_token) {
        finalAccessToken = longTokenData.access_token;
      }
      if (typeof longTokenData?.expires_in === "number") {
        expiresSeconds = longTokenData.expires_in;
      }
    } else {
      console.warn("[Instagram Long-Lived Token Warning]: Falling back to short-lived token.");
    }

    // 6. Fetch Instagram profile info to confirm username and user ID
    const profileUrl = `https://graph.instagram.com/v22.0/me?fields=id,username&access_token=${encodeURIComponent(finalAccessToken)}`;
    const profileRes = await fetch(profileUrl, {
      headers: { Accept: "application/json" },
    });

    let username = "barbod.barber.hu";
    let instagramUserId = initialUserId || "unknown";

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      if (profileData?.username) username = profileData.username;
      if (profileData?.id) instagramUserId = String(profileData.id);
    }

    // 7. Encrypt access token server-side
    const encryptedAccessToken = encryptToken(finalAccessToken);
    const tokenExpiresAt = new Date(Date.now() + expiresSeconds * 1000).toISOString();

    // 8. Persist Instagram connection record in Supabase for business.id
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("instagram_connections")
      .upsert(
        {
          business_id: context.business.id,
          instagram_user_id: instagramUserId,
          username: username,
          encrypted_access_token: encryptedAccessToken,
          token_expires_at: tokenExpiresAt,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" }
      );

    if (dbError) {
      console.error("[Instagram Connection DB Error]:", dbError.message);
      throw new Error(`Failed to save Instagram connection: ${dbError.message}`);
    }

    // 9. Force feed refresh to fetch live posts immediately
    await fetchInstagramFeed(true);

    return buildRedirect("/admin/instagram?success=connected");

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OAuth connection failed";
    console.error("[Instagram Callback Exception]:", msg);
    return buildRedirect(`/admin/instagram?error=${encodeURIComponent(msg)}`);
  }
}
