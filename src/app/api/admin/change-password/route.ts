import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connect, AdminUserModel } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { take, reset as resetRateLimit } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(200, "Password is too long."),
});

const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60_000;

/**
 * POST /api/admin/change-password
 *
 * Authenticated. Body: { currentPassword, newPassword }.
 *
 * Verifies the current password, then sets the new one. After a
 * successful change the caller's session cookie becomes invalid
 * (sessionVersion is bumped), so the next page navigation will
 * redirect to /admin/login. The response body includes a hint so
 * the UI can show a "you'll be signed out shortly" toast.
 */
export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = changeSchema.safeParse(body);
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
  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must differ from the current one." },
      { status: 400 },
    );
  }

  const rl = take(`change:${ctx.userId}`, RATE_LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  await connect();
  const user = await AdminUserModel.findById(ctx.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  resetRateLimit(`change:${ctx.userId}`);

  return NextResponse.json({
    ok: true,
    sessionInvalidated: true,
  });
}
