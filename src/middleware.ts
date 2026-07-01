import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  verifySession,
} from "@/lib/admin-session";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "mdkamalhosennn@gmail.com";

/**
 * Replaces the Supabase-based middleware. We verify the HMAC-signed cookie
 * and gate /admin/* routes (except /admin/login itself). On failure, redirect
 * to /admin/login with a `redirect` query so the user comes back where they
 * were after authenticating.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow the login route + the static login assets without redirect loops.
  if (path === "/admin/login") return NextResponse.next();

  // Only gate /admin routes — everything else passes through untouched.
  if (!path.startsWith("/admin")) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySession(token);

  if (!payload || payload.email !== ADMIN_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Refresh cookie expiry on every successful admin request so an active
  // user does not get logged out mid-session.
  const opts = sessionCookieOptions();
  const response = NextResponse.next({ request });
  response.cookies.set(opts.name, token!, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  // Block search engines from indexing any admin page.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
