import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connect, AdminUserModel, PasswordResetTokenModel } from "@/lib/db";
import { issueSessionCookie } from "@/lib/auth";
import { take } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "Password is too long."),
});

const RATE_LIMIT = 10;
const WINDOW_MS = 15 * 60_000;

/**
 * POST /api/admin/reset-password
 *
 * Body: { token, password }
 *
 * Consumes a one-time password-reset token, sets a new bcrypt hash
 * on the user, and bumps the user's `sessionVersion` so any cookie
 * issued before this reset is invalidated. The response sets a fresh
 * session cookie (carrying the new sessionVersion) so the user lands
 * signed-in on /admin.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_input",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;

  // Per-IP rate limit (10 / 15 min). Token hash is also a fine key
  // but using IP keeps the bucket small and prevents an attacker
  // from burning through a single user's tokens at speed.
  const ip = readClientIp(request);
  const rlKey = ip ? `reset:${ip}` : `reset:global`;
  const rl = take(rlKey, RATE_LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  await connect();
  const tokenHash = sha256(token);
  const tokenDoc = await PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!tokenDoc) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const user = await AdminUserModel.findById(tokenDoc.userId);
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const newHash = await bcrypt.hash(password, 12);
  user.passwordHash = newHash;
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Issue a fresh session cookie for the now-reset user. The bumped
  // sessionVersion is already in the saved user document.
  const { token: sessionToken, opts } = await issueSessionCookie({
    _id: user._id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(opts.name, sessionToken, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return response;
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function readClientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return null;
}
