import "server-only";
import { cookies } from "next/headers";
import { connect, AdminUserModel, type AdminRole } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  signSession,
  verifySession,
  sessionCookieOptions,
} from "@/lib/admin-session";

/**
 * Shape returned to authenticated callers. All admin code paths go
 * through `requireAdmin()` so we never have to scatter the DB lookup.
 */
export interface AdminContext {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * Server-side admin guard. Call at the top of every Server Action and
 * admin route handler. Verifies the HMAC-signed session cookie,
 * loads the user from MongoDB, and checks `isActive` and the
 * `sessionVersion` carried in the payload. Throws on any failure.
 *
 * The middleware performs the same check for `/admin/*` page
 * requests; this is the per-action defense in depth.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySession(token);
  if (!payload) throw new Error("UNAUTHORIZED");

  await connect();
  const user = await AdminUserModel.findById(payload.userId).lean();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!user.isActive) throw new Error("FORBIDDEN");
  if (user.sessionVersion !== payload.sessionVersion) {
    throw new Error("SESSION_REVOKED");
  }
  return {
    userId: String(user._id),
    email: user.email,
    role: user.role,
  };
}

/**
 * Read-only variant: returns the admin context when authenticated,
 * or `null` when not. Never throws. Use this in server components
 * that just need to know "is the visitor an admin?" without forcing
 * a redirect.
 */
export async function currentAdmin(): Promise<AdminContext | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

/**
 * Issue a fresh session cookie for a freshly-authenticated admin.
 * Used by /api/admin/login (success path) and /api/admin/reset-password
 * (after a successful reset). The caller is responsible for setting
 * the cookie on the response (we return the token + cookie options
 * so both API route handlers and server actions can use this).
 */
export async function issueSessionCookie(user: {
  _id: unknown;
  email: string;
  sessionVersion: number;
}): Promise<{ token: string; opts: ReturnType<typeof sessionCookieOptions> }> {
  const token = await signSession({
    userId: String(user._id),
    email: user.email,
    sessionVersion: user.sessionVersion,
  });
  return { token, opts: sessionCookieOptions() };
}

/**
 * Invalidate every live session for the given admin by bumping their
 * `sessionVersion`. The next request carrying a cookie signed at the
 * old version will be rejected by `requireAdmin()` and middleware.
 */
export async function bumpSessionVersion(userId: string): Promise<void> {
  await connect();
  await AdminUserModel.updateOne(
    { _id: userId },
    { $inc: { sessionVersion: 1 } },
  );
}
