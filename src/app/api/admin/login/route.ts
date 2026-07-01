import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connect, AdminUserModel } from "@/lib/db";
import { issueSessionCookie } from "@/lib/auth";
import { take, reset as resetRateLimit } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MINUTES = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60_000;

/**
 * POST /api/admin/login
 *
 * Body: { email, password }
 *
 * On success: sets the HMAC-signed `admin_session` cookie and returns
 * `{ ok: true }`.
 *
 * Failure modes all return 401 with the same generic message to
 * avoid user enumeration. Rate-limit (5 / 15 min per email) returns
 * 429. A locked account returns 429 with "Account locked".
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }
  const { email, password } = parsed.data;

  // Per-email rate limit (5 attempts per 15 minutes).
  const rl = take(`login:${email}`, 5, RATE_LIMIT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  await connect();
  const user = await AdminUserModel.findOne({ email }).lean();
  if (!user || !user.isActive) {
    // Constant-ish work to mitigate timing-based user enumeration.
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvali");
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  // Account locked?
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    return NextResponse.json(
      {
        error: `Account locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      { status: 429 },
    );
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, user.passwordHash);
  } catch (err) {
    console.error("[api/admin/login] bcrypt error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  if (!ok) {
    // Increment failure count and lock the account after a threshold.
    const newCount = (user.failedLoginCount ?? 0) + 1;
    const update: Record<string, unknown> = { failedLoginCount: newCount };
    if (newCount >= LOGIN_LOCK_THRESHOLD) {
      update.lockedUntil = new Date(
        Date.now() + LOGIN_LOCK_MINUTES * 60_000,
      );
      update.failedLoginCount = 0;
    }
    await AdminUserModel.updateOne({ _id: user._id }, { $set: update });
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  // Success: clear failure state, stamp lastLoginAt, issue a new session.
  await AdminUserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    },
  );
  resetRateLimit(`login:${email}`);

  const { token, opts } = await issueSessionCookie(user);
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
