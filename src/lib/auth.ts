import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "mdkamalhosennn@gmail.com";

/**
 * Server-side admin guard. Call at the top of every Server Action and
 * admin route handler. Re-checks the session via @supabase/ssr cookies and
 * verifies the email allow-list. Throws on failure.
 *
 * Defense in depth: middleware also gates /admin/* in the request path,
 * and RLS in Postgres restricts writes. Any single layer alone is
 * insufficient; this is the in-action belt.
 */
export async function requireAdmin(): Promise<{ email: string; id: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHORIZED");
  if (user.email !== ADMIN_EMAIL) throw new Error("FORBIDDEN");
  return { email: user.email!, id: user.id };
}
