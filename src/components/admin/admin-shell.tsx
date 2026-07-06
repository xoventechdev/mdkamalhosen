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
 *     sidebar is shown on desktop (≥ md) and a hamburger-triggered
 *     drawer is shown on mobile (< md). Both surfaces render the same
 *     `nav` array via `<AdminNavList />` so the pending-comments badge
 *     and link order stay in lockstep.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Settings, X } from "lucide-react";
import { Toaster } from "sonner";
import { NavLink } from "@/components/admin/nav-link";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const nav = [
  { href: "/admin", label: "Dashboard", iconName: "LayoutDashboard", exact: true },
  { href: "/admin/analytics", label: "Analytics", iconName: "BarChart3" },
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

/**
 * Shared render of the admin nav list — used by both the desktop
 * sidebar and the mobile drawer so a new entry only has to be added
 * in one place above.
 */
function AdminNavList({ pendingComments }: { pendingComments: number }) {
  return (
    <>
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
    </>
  );
}

/**
 * The "View public site" + "Sign out" block, used in both surfaces.
 */
function AdminFooterActions() {
  return (
    <>
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
    </>
  );
}

export function AdminShell({
  children,
  pendingComments = 0,
}: {
  children: React.ReactNode;
  pendingComments?: number;
}) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.has(pathname);
  const [navOpen, setNavOpen] = React.useState(false);

  // Close the drawer whenever the route changes — same behaviour as
  // the public site header. Avoids leaving the drawer open over the
  // freshly-navigated page on slower devices.
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Public auth pages: no sidebar, no mobile header, full-width content.
  if (isPublic) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Toaster richColors position="top-right" closeButton />
        <main className="p-6 md:p-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster richColors position="top-right" closeButton />

      {/* Desktop sidebar — hidden on mobile. */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center border-b border-border px-5 font-mono text-sm font-semibold">
          <Link href="/admin" className="flex items-center gap-1">
            <span className="text-accent">/</span>admin
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 px-3 py-4">
          <AdminNavList pendingComments={pendingComments} />
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-0.5 border-t border-border p-3">
          <AdminFooterActions />
        </div>
      </aside>

      {/* Mobile header strip — hidden on desktop. Houses the
          hamburger that opens the drawer. */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link
          href="/admin"
          className="font-mono text-sm font-semibold"
        >
          <span className="text-accent">/</span>admin
        </Link>
        <button
          type="button"
          aria-label="Open admin menu"
          aria-expanded={navOpen}
          aria-controls="admin-mobile-nav"
          onClick={() => setNavOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile drawer — same nav as the desktop aside, plus the
          footer actions, inside the shared Drawer primitive. */}
      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent
          hideClose
          className="max-w-sm"
          // The Drawer primitive already sets role/aria-modal; we
          // only need to give it the id the hamburger's
          // aria-controls points at.
          id="admin-mobile-nav"
        >
          <DrawerHeader>
            <DrawerTitle className="font-mono">
              <Link
                href="/admin"
                className="flex items-center gap-1"
                onClick={() => setNavOpen(false)}
              >
                <span className="text-accent">/</span>admin
              </Link>
            </DrawerTitle>
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setNavOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </DrawerHeader>
          <DrawerBody>
            <nav className="flex flex-col gap-0.5">
              <AdminNavList pendingComments={pendingComments} />
            </nav>
          </DrawerBody>
          <DrawerFooter className="space-y-0.5">
            <AdminFooterActions />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Main column. */}
      <div className="md:pl-60">
        <main className="p-4 sm:p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}