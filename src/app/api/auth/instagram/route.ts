import { NextResponse } from "next/server";
import crypto from "crypto";

import { getAdminContext } from "@/lib/auth/session";
import { getInstagramAppCredentials, getInstagramRedirectUri } from "@/lib/instagram/config";

export async function GET() {
  // 1. Verify user is logged in as Business Owner
  const context = await getAdminContext();
  if (!context || context.role !== "owner") {
    const fallbackBase = getInstagramRedirectUri();
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", fallbackBase));
  }

  const { appId } = getInstagramAppCredentials();
  const redirectUri = getInstagramRedirectUri();

  if (!appId) {
    return NextResponse.redirect(new URL("/admin/instagram?error=missing_app_id", redirectUri));
  }

  // 2. Generate secure CSRF state
  const state = crypto.randomBytes(32).toString("hex");

  // 3. Build Meta Instagram Authorization URL (Instagram Platform API with Instagram Login)
  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("enable_fb_login", "0");
  authUrl.searchParams.set("force_authentication", "1");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "instagram_business_basic");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());

  // 4. Store state in HTTP-only secure cookie for validation in callback
  response.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
