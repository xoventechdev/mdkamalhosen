import { AdminShell } from "@/components/admin/admin-shell";
import { getPendingCommentCount } from "@/server/queries";

// Auth is enforced by middleware (see src/middleware.ts) which:
//   • Has access to the request pathname
//   • Skips the auth check for /admin/login
//   • Verifies the HMAC-signed `admin_session` cookie and the email allow-list
//   • Redirects every other /admin/* path to /admin/login on failure
// Server-side double-check is intentionally not repeated here to avoid an
// infinite redirect loop on /admin/login itself. Every Server Action and
// admin route handler independently calls requireAdmin() from src/lib/auth.ts.
//
// The shell (sidebar + mobile header) is rendered by <AdminShell> on the
// client so it can use `usePathname()` to hide itself on /admin/login.
// On every other /admin/* path the full sidebar with all admin sections
// is shown.

// Force-dynamic so the pending-comments badge stays fresh after an
// admin approves a comment in another tab.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The count is best-effort; if the DB is unavailable (cold start,
  // maintenance) the shell still renders without a badge rather than
  // crashing the entire admin tree.
  let pendingComments = 0;
  try {
    pendingComments = await getPendingCommentCount();
  } catch {
    pendingComments = 0;
  }
  return <AdminShell pendingComments={pendingComments}>{children}</AdminShell>;
}
