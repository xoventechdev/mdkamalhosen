import Link from "next/link";
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
  { href: "/admin/messages", label: "Messages", iconName: "Mail" },
  { href: "/admin/settings", label: "Settings", iconName: "Settings" },
];

// Auth is enforced by middleware (see src/middleware.ts) which:
// • Has access to the request pathname
// • Skips the auth check for /admin/login
// • Redirects every other /admin/* path to /admin/login when no session or
//   email mismatches ADMIN_EMAIL.
// Server-side double-check is intentionally not repeated here to avoid an
// infinite redirect loop on /admin/login itself. RLS in Postgres remains
// the third defense layer. Every Server Action and admin route handler
// independently calls requireAdmin() from src/lib/auth.ts.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <form action="/admin/auth/signout" method="post">
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
