"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single `POST /api/track-view` when the component mounts.
 *
 * - `postId` makes this a per-blog-post hit (server resolves the
 *   canonical path + slug from the post id).
 * - With no `postId`, it tracks the current `window.location.pathname`
 *   as a generic public-page hit.
 *
 * Why a client component: the user agent + current pathname are only
 * known in the browser. The fetch uses `keepalive: true` so the
 * request still lands if the visitor navigates away immediately
 * after the page paints.
 *
 * Disabled when `NEXT_PUBLIC_DISABLE_TRACKING === "true"`, so a
 * production deploy can turn analytics off without redeploying code.
 */
export interface PageViewTrackerProps {
  /** When present, identifies the blog post being viewed. */
  postId?: string;
}

export function PageViewTracker({ postId }: PageViewTrackerProps) {
  // Guard against React 19 Strict Mode double-mount: the ref survives
  // both invocations, so the actual POST only happens once.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (process.env.NEXT_PUBLIC_DISABLE_TRACKING === "true") return;

    // Belt-and-braces: don't fire on admin / api routes. The server
    // rejects these too, but skipping client-side avoids a useless
    // round-trip on devtools reloads of e.g. /admin.
    const here =
      typeof window !== "undefined" ? window.location.pathname : "";
    if (
      here === "/admin" ||
      here.startsWith("/admin/") ||
      here.startsWith("/api/")
    ) {
      return;
    }

    const body: Record<string, string> = {};
    if (postId) body.postId = postId;
    else if (here) body.path = here;

    // Bail if there's nothing to record (defensive).
    if (!body.postId && !body.path) return;

    try {
      fetch("/api/track-view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {
        /* swallow — analytics must never block the page */
      });
    } catch {
      /* swallow */
    }
  }, [postId]);

  return null;
}