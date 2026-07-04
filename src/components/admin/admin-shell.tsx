"use client";

/**
 * Client-side shell for the admin section.
 *
 * Why a client component:
 *   We need `usePathname()` to detect when the user is on `/admin/login`,
 *   and the simplest place to gate the sidebar on that is here. The actual
 *   data work (auth checks, data fetching) still lives in the server-side
 *   `AdminLayout` and the page Server Components.
 *
 * Behaviour:
 *   - On public auth pages (`/admin/login`, `/admin/forgot-password`,
 *     `/admin/reset-password`), the sidebar and mobile header are NOT
 *     rendered, and the main content takes the full viewport (no left
 *     padding). This keeps these forms clean and centred, and prevents
 *     the nav and "Sign out" button from appearing to a not-yet-
 *     authenticated visitor.
 *   - On every other `/admin/*` path (gated by middleware), the full
 *     sidebar with all admin sections is shown.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { Toaster } from "sonner";
import { NavLink } from "@/components/admin/nav-link";

const nav = [
  { href: "/admin", label: "Dashboard", iconName: "LayoutDashboard", exact: true },
  { href: "/admin/profile", label: "Profile", iconName: "User" },
  { href: "/admin/experience", label: "Experience", iconName: "FolderGit2" },
  { href: "/admin/education", label: "Education", iconName: "GraduationCap" },
  { href: "/admin/certifications", label: "Certifications", iconName: "Award" },
  { href: "/admin/projects", label: "Projects", iconName: "FolderGit2" },
  { href: "/admin/skills", label: "Skills", iconName: "Wrench" },
  { href: "/admin/blog", label: "Blog", iconName: "FileText" },
  { href: "/admin/comments", label: "Comments", iconName: "MessageSquare" },
  { href: "/admin/messages", label: "Messages", iconName: "Mail" },
  { href: "/admin/settings", label: "Settings", iconName: "Settings" },
];

// Single source of truth for the public auth pages. The middleware
// (src/middleware.ts) also exempts these from the auth check. Mirror
// that list here so the sidebar stays hidden on every public page.
const PUBLIC_PATHS = new Set<string>([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

export function AdminShell({
  children,
  pendingComments = 0,
}: {
  children: React.ReactNode;
  pendingComments?: number;
}) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Public auth pages: no sidebar, no mobile header, full-width content.
  if (isPublic) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Toaster richColors position="top-right" closeButton />
        <main className="p-6 md:p-10">{children}</main>
      </div>
    );
  }

  // Authenticated admin pages: full sidebar + mobile header.
  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster richColors position="top-right" closeButton />
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center border-b border-border px-5 font-mono text-sm font-semibold">
          <Link href="/admin" className="flex items-center gap-1">
            <span className="text-accent">/</span>admin
          </Link>
        </div>
        <nav className="px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              iconName={item.iconName}
              exact={item.exact}
              badge={
                item.href === "/admin/comments" && pendingComments > 0
                  ? pendingComments
                  : undefined
              }
            />
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> View public site
          </Link>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-60">
        <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6 md:hidden">
          <span className="font-mono text-sm font-semibold">
            <span className="text-accent">/</span>admin
          </span>
        </div>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
