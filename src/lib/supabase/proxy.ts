import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Refresh the auth session and gate /admin routes.
 * Must return the response that carries refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Do not insert logic between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isAdminRoute) {
    if (!user && !isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return redirectWithSession(url, supabaseResponse);
    }

    if (user && isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return redirectWithSession(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = sessionResponse.headers.get(header);
    if (value) {
      redirectResponse.headers.set(header, value);
    }
  }
  return redirectResponse;
}
