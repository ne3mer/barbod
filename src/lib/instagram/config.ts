import "server-only";

export function getInstagramRedirectUri(): string {
  if (process.env.INSTAGRAM_REDIRECT_URI) {
    return process.env.INSTAGRAM_REDIRECT_URI;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    return `${baseUrl}/api/auth/instagram/callback`;
  }
  if (process.env.VERCEL_URL) {
    const baseUrl = `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
    return `${baseUrl}/api/auth/instagram/callback`;
  }
  return "http://localhost:3000/api/auth/instagram/callback";
}

export function getInstagramAppCredentials() {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
  return { appId, appSecret };
}
