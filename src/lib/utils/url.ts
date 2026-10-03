/**
 * Resolves the canonical base URL for the application dynamically.
 * Priority:
 * 1. Request headers (x-forwarded-host / host + x-forwarded-proto)
 *    -> Always matches the exact domain the admin/user is currently browsing on!
 * 2. NEXT_PUBLIC_SITE_URL environment variable
 * 3. VERCEL_PROJECT_PRODUCTION_URL environment variable (e.g. barbod-gold.vercel.app)
 * 4. VERCEL_URL environment variable (e.g. deployment host)
 * 5. Production fallback: https://barbod-gold.vercel.app
 * 6. Development fallback: http://localhost:3000
 */
export async function getCanonicalSiteUrl(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    if (host) {
      const proto =
        headerList.get("x-forwarded-proto") ||
        (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // headers() might throw outside of a request context or outside Next.js runtime
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://barbod-gold.vercel.app";
  }
  return "http://localhost:3000";
}
