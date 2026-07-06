import { Schema, model, models, Types, type Model } from "mongoose";

/**
 * One document per tracked page-view event.
 *
 * Why events and not a per-document counter?
 *   - Lets the admin dashboard compute per-day, per-page, and per-post
 *     breakdowns on the fly with a single $group aggregation, with no
 *     secondary rollup collection to keep in sync.
 *   - Lets us age out old events with a TTL index if storage ever
 *     becomes a concern. (No TTL is configured today; we want the
 *     admin to see real historical shape first.)
 *
 * Identity / dedupe:
 *   The track-view endpoint dedupes by `(path, ipPrefix)` inside a
 *   24 h window before inserting. That keeps a single visitor from
 *   inflating the count on every reload while still capturing a
 *   genuine repeat visit the next day.
 */

export const PAGE_VIEW_KINDS = ["post", "page"] as const;
export type PageViewKind = (typeof PAGE_VIEW_KINDS)[number];

export interface PageViewDoc {
  /** Normalized public path, e.g. "/blog", "/blog/my-post", "/about". */
  path: string;
  /** "post" for /blog/[slug], "page" for everything else public. */
  kind: PageViewKind;
  /** Slug of the blog post when kind === "post". Denormalised so
   *  the analytics page can render a path even after a post is
   *  renamed or deleted. */
  slug?: string | null;
  /** Set when kind === "post"; null otherwise. */
  postId?: Types.ObjectId | null;
  /** First 3 IPv4 octets or first 32 IPv6 chars; "unknown" fallback.
   *  Same shape used by the comment system. */
  ipPrefix: string;
  userAgent?: string | null;
  createdAt?: Date;
}

const PageViewSchema = new Schema<PageViewDoc>(
  {
    path: { type: String, required: true },
    kind: { type: String, enum: PAGE_VIEW_KINDS, required: true },
    slug: { type: String, default: null },
    postId: { type: Schema.Types.ObjectId, default: null },
    ipPrefix: { type: String, required: true, maxlength: 64 },
    userAgent: { type: String, default: null, maxlength: 512 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "page_views",
  },
);

// Top pages + per-day grouping uses { path, createdAt }.
// Per-post stats uses { postId, createdAt }.
// { createdAt: -1 } alone covers the daily chart and any future
// TTL cleanup by date range.
PageViewSchema.index({ path: 1, createdAt: -1 });
PageViewSchema.index({ postId: 1, createdAt: -1 });
PageViewSchema.index({ createdAt: -1 });

export const PageViewModel: Model<PageViewDoc> =
  (models.PageView as Model<PageViewDoc> | undefined) ??
  model<PageViewDoc>("PageView", PageViewSchema);