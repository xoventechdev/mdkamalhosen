import "server-only";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/admin-session";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "mdkamalhosennn@gmail.com";

/**
 * Server-side admin guard. Call at the top of every Server Action and
 * admin route handler. Reads the HMAC-signed cookie set by
 * /api/admin/login, verifies it, and checks the email allow-list.
 * Throws on failure so callers can catch and return a 401.
 *
 * Defense in depth: middleware also gates /admin/* in the request path;
 * RLS is no longer in play now that we have moved to MongoDB, but the
 * middleware/cookie-verification combo is still the primary protection
 * for the admin surface.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySession(token);

  if (!payload) throw new Error("UNAUTHORIZED");
  if (payload.email !== ADMIN_EMAIL) throw new Error("FORBIDDEN");
  return { email: payload.email };
}

/** Read-only variant for "is current user an admin?" — never throws. */
export async function currentAdmin(): Promise<{ email: string } | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
