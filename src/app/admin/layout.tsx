import { AdminShell } from "@/components/admin/admin-shell";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
