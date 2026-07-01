import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/admin-session";

export const runtime = "nodejs";

/**
 * POST /api/admin/logout
 * Clears the `admin_session` cookie. The login page calls this on sign-out.
 */
export async function POST(_request: NextRequest) {
  const opts = sessionCookieOptions();
  const response = NextResponse.json({ ok: true });
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
