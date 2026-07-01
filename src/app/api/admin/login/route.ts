import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "mdkamalhosennn@gmail.com";

/**
 * POST /api/admin/login
 * Body: { username?: string, email: string, password: string }
 * On success: sets the HMAC-signed `admin_session` cookie and returns
 * `{ ok: true }`. The login page accepts either `email` or `username`
 * (the password is compared against the bcrypt-stored hash for `email`).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 },
    );
  }

  // Defense-in-depth: even if the password hash is correct, only the
  // allow-listed admin email may sign in.
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    console.error("[api/admin/login] ADMIN_PASSWORD_HASH not set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("[api/admin/login] bcrypt error", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const token = signSession({ email });
  const opts = sessionCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(opts.name, token, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return response;
}
