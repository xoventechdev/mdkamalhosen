import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connect, BlogPostModel, PageViewModel } from "@/lib/db";
import { take } from "@/lib/auth-rate-limit";

/**
 * Public POST endpoint for page-view tracking.
 *
 * Called by `<PageViewTracker />` (client component) mounted on every
 * public route. Schema:
 *
 *   POST /api/track-view
 *   { postId?: string;        // when tracking a blog post
 *     path?: string;          // optional, defaults to the current pathname via Referer
 *     kind?: "post" | "page"; // optional, resolved from postId when present
 *     _hp?: string;           // honeypot — bots fill this in
 *   }
 *
 * Behaviour:
 *   1. Rate-limit per IP prefix (10 / 60s) using the same in-memory
 *      limiter as the comments route.
 *   2. Resolve the canonical `path` + `kind` + `slug`:
 *        - If `postId` is a valid ObjectId and points at a published
 *          post, the path is forced to `/blog/<slug>` and `kind` to
 *          `"post"`. The client `path` is ignored — the dashboard
 *          groups only by canonical path.
 *        - Otherwise `kind` is `"page"` and the path is taken from the
 *          body or the `Referer` header (server-trustable from the
 *          browser, used as a fallback only).
 *   3. Reject any path that starts with `/admin` or `/api`. The
 *      tracker shouldn't fire there, but a determined visitor could
 *      hand-craft a request and we don't want to surface those.
 *   4. Dedupe: a fresh insert is skipped if an event with the same
 *      `(path, ipPrefix)` already exists in the last 24 h. Repeat
 *      visitors the next day count as new (which is what we want).
 *
 * All failures return `{ ok: true }` (or at worst a 200 with
 * `deduped: true`) so a misconfigured client never blocks the page
 * render. Real errors are logged server-side only.
 */

const trackViewSchema = z.object({
  postId: z.string().optional(),
  path: z.string().max(512).optional(),
  kind: z.enum(["post", "page"]).optional(),
  _hp: z.string().max(256).optional(),
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function ipPrefixFromHeaders(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() ?? "";
  if (!ip) return "unknown";
  const parts = ip.split(".");
  if (parts.length === 4) return parts.slice(0, 3).join(".");
  // IPv6: keep the first 32 chars. Enough to group a household
  // without fingerprinting individual devices.
  return ip.slice(0, 32);
}

/**
 * Normalize a path string so equivalent URLs collapse to one bucket:
 *   - "/" stays "/".
 *   - Trailing slash is dropped (except for the root).
 *   - Query string + hash are stripped.
 *   - Empty / non-string / paths without a leading "/" get prefixed.
 */
function normalizePath(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  // Strip query / hash before any further checks.
  const noQuery = input.split(/[?#]/u, 1)[0] ?? "";
  const trimmed = noQuery.trim();
  if (!trimmed) return null;
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return "/";
  // Drop a trailing slash unless the path is exactly "/" (handled).
  return withSlash.length > 1 ? withSlash.replace(/\/+$/u, "") || "/" : withSlash;
}

export async function POST(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json().catch(() => null);
  } catch {
    body = null;
  }
  const parsed = trackViewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true, ignored: "schema" });
  }
  const data = parsed.data;

  // Honeypot — pretend success so a bot doesn't retry, but don't
  // record anything. Matches the comments route pattern.
  if (data._hp && data._hp.length > 0) {
    return NextResponse.json({ ok: true, ignored: "honeypot" });
  }

  const ip = ipPrefixFromHeaders(request);

  const { ok: underLimit } = take(`track-view:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!underLimit) {
    return NextResponse.json({ ok: true, ignored: "rate-limited" });
  }

  // Resolve canonical path + kind before touching the DB. If a
  // valid `postId` is supplied, the server is the source of truth —
  // we look up the slug and force the canonical path. Otherwise the
  // client-supplied `path` wins, with a `Referer` fallback.
  let kind: "post" | "page" = data.kind ?? "page";
  let path: string | null = null;
  let slug: string | null = null;
  let postId: Types.ObjectId | null = null;

  if (data.postId && Types.ObjectId.isValid(data.postId)) {
    try {
      await connect();
      const post = await BlogPostModel.findById(data.postId)
        .select("_id slug status")
        .lean();
      if (post && post.status === "published") {
        kind = "post";
        postId = post._id as Types.ObjectId;
        slug = post.slug;
        path = `/blog/${post.slug}`;
      }
    } catch (e) {
      console.error("[track-view] post lookup failed:", e);
    }
  }

  if (!path) {
    path = normalizePath(data.path);
    if (!path) {
      const referer = request.headers.get("referer") ?? "";
      try {
        const u = new URL(referer);
        path = normalizePath(u.pathname);
      } catch {
        // ignore — Referer may be empty for direct API hits
      }
    }
  }

  if (!path) {
    return NextResponse.json({ ok: true, ignored: "no-path" });
  }

  // Defensive: never record admin/api paths even if a hand-crafted
  // request slips through.
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/")) {
    return NextResponse.json({ ok: true, ignored: "forbidden-path" });
  }

  // Public-page kind was the default already; only flip to "post" if
  // we found a post above. Path resolution wins regardless.
  if (kind !== "post") kind = "page";

  // Dedupe within the rolling window.
  try {
    await connect();
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const existing = await PageViewModel.findOne(
      { path, ipPrefix: ip, createdAt: { $gte: since } },
      { _id: 1 },
    )
      .sort({ createdAt: -1 })
      .lean();
    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const ua = (request.headers.get("user-agent") ?? "").slice(0, 512) || null;
    await PageViewModel.create({
      path,
      kind,
      slug,
      postId,
      ipPrefix: ip,
      userAgent: ua,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[track-view] insert failed:", e);
    return NextResponse.json({ ok: true, ignored: "error" });
  }
}
