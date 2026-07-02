"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

/**
 * Renders the global marketing <SiteFooter /> on every route EXCEPT
 * anything under /admin. Admin pages have their own shell (sidebar +
 * mobile header) and the public footer would clash with the fixed
 * sidebar layout.
 *
 * Why a client wrapper:
 *   RootLayout is a Server Component and can't use `usePathname()`.
 *   This tiny client component is the cheapest way to suppress the
 *   footer on /admin/* without converting RootLayout itself.
 */
export function ConditionalSiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <SiteFooter />;
}