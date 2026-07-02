import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/admin-session";

export const runtime = "nodejs";

/**
 * POST /api/admin/logout
 *
 * Clears the `admin_session` cookie and redirects to the public site
 * (`/`). This route is wired up via a plain HTML form in
 * `src/components/admin/admin-shell.tsx`, so it MUST return a
 * navigable response (a 303 redirect). Returning JSON here would leave
 * the browser displaying the raw `{ ok: true }` payload on what looks
 * like a new page (because the form's action URL is /api/admin/logout
 * — the browser renders the response of the POST at that URL).
 *
 * We use 303 See Other so the browser performs a GET on the redirect
 * target regardless of the original method — that's the correct
 * status for a POST that should result in a fresh page load.
 */
export async function POST(_request: NextRequest) {
  const opts = sessionCookieOptions();
  const redirectUrl = new URL("/", _request.nextUrl.origin);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(opts.name, "", {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: 0,
  });
  // Belt-and-suspenders: explicitly delete in case the set above no-ops.
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}