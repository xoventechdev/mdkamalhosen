"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { connect, AdminUserModel } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { take, reset as resetRateLimit } from "@/lib/auth-rate-limit";
import type { ActionResult } from "@/lib/schemas";

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "Password is too long."),
});

const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60_000;

/**
 * Server action: change the current admin's password.
 *
 * Verifies the current password, then sets a new bcrypt hash and
 * bumps `sessionVersion` so the caller's cookie is invalidated on
 * the next request. The client should show a "you'll be signed out
 * shortly" toast and the AdminShell will redirect to /admin/login
 * on the next navigation.
 */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<{ sessionInvalidated: true }>> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = changeSchema.safeParse({ currentPassword, newPassword });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return {
      ok: false,
      error: "New password must differ from the current one.",
    };
  }

  const rl = take(`change:${ctx.userId}`, RATE_LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes.",
    };
  }

  await connect();
  const user = await AdminUserModel.findById(ctx.userId);
  if (!user) return { ok: false, error: "Unauthorized" };

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!matches) {
    return { ok: false, error: "Current password is incorrect." };
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  resetRateLimit(`change:${ctx.userId}`);

  return { ok: true, data: { sessionInvalidated: true } };
}
