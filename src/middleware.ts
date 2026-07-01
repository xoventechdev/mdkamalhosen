import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  verifySession,
} from "@/lib/admin-session";

/**
 * Gates `/admin/*` *page* navigations by verifying the HMAC-signed
 * session cookie. The middleware is Edge-runtime, so it cannot import
 * Mongoose (which uses `eval` / `new Function` in its browser shim).
 * The sessionVersion cross-check against the live user row is
 * therefore enforced inside `requireAdmin()` (Node runtime) and
 * inside admin Server Components via `currentAdmin()`. A user with a
 * stale cookie may render one page before being redirected to
 * /admin/login — that's the documented trade-off for keeping the
 * middleware Edge-safe.
 *
 * Why API routes are NOT matched by this middleware:
 *   Each `/api/admin/*` route handler is responsible for calling
 *   `requireAdmin()` itself. The auth endpoints (login, logout,
 *   forgot-password, reset-password) deliberately do not call
 *   `requireAdmin()` because they ARE the auth surface. Routing API
 *   requests through this middleware would cause an unauthenticated
 *   POST to /api/admin/login to be redirected to the login page,
 *   which the browser's fetch() would then try to parse as JSON and
 *   fail with "Failed to fetch".
 *
 * Public admin pages (the ones with their own rate limiting or no
 * sensitive content) are listed explicitly so they skip the cookie
 * check entirely.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public admin pages — no auth required.
  const publicPaths = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
  ];
  if (publicPaths.includes(path)) return NextResponse.next();

  // Only gate /admin pages — API routes are handled in their own
  // route handlers (see comment above). Everything else passes
  // through untouched.
  if (!path.startsWith("/admin/")) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySession(token);
  if (!payload) {
    return redirectToLogin(request, path);
  }

  // Refresh cookie expiry on every successful admin request so an
  // active user does not get logged out mid-session.
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

function redirectToLogin(request: NextRequest, originalPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("redirect", originalPath);
  return NextResponse.redirect(url);
}

export const config = {
  // Match only admin page navigations, NOT /api/admin/* routes.
  // API routes handle their own auth via requireAdmin().
  matcher: ["/admin/:path*"],
};
