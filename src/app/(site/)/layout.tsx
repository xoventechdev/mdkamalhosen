import type { ReactNode } from "react";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

/**
 * Layout for the `(site)` route group — wraps every public route
 * (`/`, `/about`, `/experience`, `/projects`, `/skills`, `/blog/*`,
 * `/contact`, `/cv`) with the analytics tracker.
 *
 * Mounting the tracker here (instead of on each individual page)
 * guarantees:
 *   - We never forget to track a new public route when it lands.
 *   - Admin routes (`/admin/*`) and API routes are excluded because
 *     they live outside this group.
 *   - The tracker is rendered once per navigation, not once per
 *     server-rendered child.
 *
 * No markup, no extra wrapping — the tracker returns null.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageViewTracker />
      {children}
    </>
  );
}