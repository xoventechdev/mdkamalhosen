import { unstable_cache } from "next/cache";
import { Types } from "mongoose";
import {
  connect,
  toClient,
  ProfileModel,
  PROFILE_ID,
  ExperienceModel,
  EducationModel,
  CertificationModel,
  SkillGroupModel,
  SkillModel,
  ProjectModel,
  BlogPostModel,
  BlogTagModel,
  CommentModel,
  PageViewModel,
} from "@/lib/db";

// ---------------------------------------------------------------------------
// Cached data-access layer. Every public read goes through here so the entire
// site benefits from Next.js fetch-level caching with tagged invalidation.
// After an admin save we call revalidateTag() with the matching tag.
//
// All IDs are ObjectId strings (MongoDB). The Profile singleton has the fixed
// id "507f1f77bcf86cd799439011" — see lib/db/models/profile.model.ts.
// ---------------------------------------------------------------------------

/**
 * Wraps a Mongoose call with timing logs. Visible in Vercel runtime logs so we
 * can identify which query is the bottleneck on cold starts. The wrapper
 * itself is non-caching — caching is handled by `unstable_cache` further out.
 */
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`[queries][${label}] start`);
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`[queries][${label}] end ${ms}ms`);
    if (ms > 1000) {
      console.warn(`[queries][${label}] SLOW ${ms}ms`);
    }
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[queries][${label}] error after ${ms}ms`, err);
    throw err;
  }
}

/**
 * Resolve a flat array of `BlogTag`s for an array of posts, given the
 * embedded `tagIds: Types.ObjectId[]` on each post. Mimics the shape of the
 * old Prisma `include: { tags: true }` join so call-sites do not need to
 * change.
 */
type ClientTag = { id: string; _id: Types.ObjectId; name: string; slug: string };

type PostWithTags = {
  id: string;
  _id: Types.ObjectId;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  bodyMd: string;
  status: "draft" | "published";
  publishedAt?: Date | null;
  readingMinutes: number;
  metaDescription?: string | null;
  tagIds: Types.ObjectId[];
  tags: ClientTag[];
  commentsEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type PostShape = PostWithTags;

async function withTags(posts: PostShape[]): Promise<PostWithTags[]> {
  const tagIds = Array.from(
    new Set(posts.flatMap((p) => p.tagIds ?? [])),
  ).map((id) => id.toString());
  const tags = tagIds.length
    ? await BlogTagModel.find({ _id: { $in: tagIds } }).lean()
    : [];
  const byId = new Map<string, ClientTag>(
    tags.map((t) => [t._id.toString(), toClient(t) as unknown as ClientTag]),
  );
  return posts.map((p) => ({
    ...p,
    tags: (p.tagIds ?? [])
      .map((id) => byId.get(id.toString()))
      .filter((t): t is ClientTag => Boolean(t)),
  }));
}

export const getProfile = unstable_cache(
  async () =>
    timed("getProfile", async () => {
      await connect();
      const doc = await ProfileModel.findById(PROFILE_ID).lean();
      return toClient(doc);
    }),
  ["profile"],
  { tags: ["profile"], revalidate: 60 },
);

export const getAllExperiences = unstable_cache(
  async () =>
    timed("getAllExperiences", async () => {
      await connect();
      const docs = await ExperienceModel.find({})
        .sort({ sortOrder: 1, startDate: -1 })
        .lean();
      return toClient(docs);
    }),
  ["experiences"],
  { tags: ["experiences"], revalidate: 60 },
);

export const getAllEducation = unstable_cache(
  async () =>
    timed("getAllEducation", async () => {
      await connect();
      const docs = await EducationModel.find({})
        .sort({ sortOrder: 1 })
        .lean();
      return toClient(docs);
    }),
  ["education"],
  { tags: ["education"], revalidate: 60 },
);

export const getAllCertifications = unstable_cache(
  async () =>
    timed("getAllCertifications", async () => {
      await connect();
      const docs = await CertificationModel.find({})
        .sort({ sortOrder: 1 })
        .lean();
      return toClient(docs);
    }),
  ["certifications"],
  { tags: ["certifications"], revalidate: 60 },
);

export const getSkillGroups = unstable_cache(
  async () =>
    timed("getSkillGroups", async () => {
      await connect();
      // Manual join: load groups, then all skills whose groupId is in the
      // group set, then stitch them. Replaces Prisma's `include: { skills }`.
      const groups = await SkillGroupModel.find({})
        .sort({ sortOrder: 1 })
        .lean();
      const groupIds = groups.map((g) => g._id);
      const skills = groupIds.length
        ? await SkillModel.find({ groupId: { $in: groupIds } })
            .sort({ sortOrder: 1 })
            .lean()
        : [];
      const skillsByGroup = new Map<string, unknown[]>();
      for (const s of skills) {
        const key = s.groupId.toString();
        const bucket = skillsByGroup.get(key) ?? [];
        bucket.push(toClient(s));
        skillsByGroup.set(key, bucket);
      }
      return groups.map((g) =>
        toClient({
          ...g,
          skills: skillsByGroup.get(g._id.toString()) ?? [],
        }),
      );
    }),
  ["skills"],
  { tags: ["skills"], revalidate: 60 },
);

export const getPublishedProjects = unstable_cache(
  async () =>
    timed("getPublishedProjects", async () => {
      await connect();
      const docs = await ProjectModel.find({ status: "published" })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
      return toClient(docs);
    }),
  ["projects"],
  { tags: ["projects"], revalidate: 60 },
);

export const getFeaturedProjects = unstable_cache(
  async () =>
    timed("getFeaturedProjects", async () => {
      await connect();
      const docs = await ProjectModel.find({
        status: "published",
        featured: true,
      })
        .sort({ sortOrder: 1 })
        .limit(3)
        .lean();
      return toClient(docs);
    }),
  ["projects-featured"],
  { tags: ["projects"], revalidate: 60 },
);

export const getProjectBySlug = unstable_cache(
  async (slug: string) =>
    timed("getProjectBySlug", async () => {
      await connect();
      const doc = await ProjectModel.findOne({ slug }).lean();
      return toClient(doc);
    }),
  ["project-by-slug"],
  { tags: ["projects"], revalidate: 60 },
);

/**
 * Same shape as the old Postgres query (BlogPost & { tags: BlogTag[] }[]) but
 * tags are joined manually via the embedded `tagIds` array.
 *
 * NOTE: this function intentionally bypasses `unstable_cache` because the body
 * now does two queries (posts + tags) and we want them cached together with a
 * single tag-based invalidation.
 */
export async function getPublishedPosts(): Promise<PostWithTags[]> {
  return timed("getPublishedPosts", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        // Sort by publish time, NOT update time — `updatedAt`
        // would otherwise float a recently-edited but older post
        // to the top, confusing the timeline. The `{ $ne: null }`
        // guard keeps ordering deterministic across Mongo versions
        // (null sorts are an unstable edge case) and hides the rare
        // row that's published without a timestamp.
        const posts = await BlogPostModel.find({
          status: "published",
          publishedAt: { $ne: null },
        })
          .sort({ publishedAt: -1 })
          .lean();
        const clientPosts = toClient(posts) as unknown as PostShape[];
        return withTags(clientPosts);
      },
      ["posts-with-tags"],
      { tags: ["blog"], revalidate: 60 },
    );
    return cache();
  });
}

export async function getLatestPosts(limit = 3): Promise<PostWithTags[]> {
  return timed("getLatestPosts", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        const posts = await BlogPostModel.find({
          status: "published",
          publishedAt: { $ne: null },
        })
          .sort({ publishedAt: -1 })
          .limit(limit)
          .lean();
        const clientPosts = toClient(posts) as unknown as PostShape[];
        return withTags(clientPosts);
      },
      ["posts-latest-with-tags", String(limit)],
      { tags: ["blog"], revalidate: 60 },
    );
    return cache();
  });
}

export async function getPostBySlug(slug: string): Promise<PostWithTags | null> {
  return timed("getPostBySlug", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        const post = await BlogPostModel.findOne({ slug }).lean();
        if (!post) return null;
        const [clientPost] = toClient([post]) as unknown as PostShape[];
        if (!clientPost) return null;
        const [withT] = await withTags([clientPost]);
        return withT ?? null;
      },
      ["post-by-slug-with-tags", slug],
      { tags: ["blog"], revalidate: 60 },
    );
    return cache();
  });
}

export async function getPostsByTag(tagSlug: string): Promise<PostWithTags[]> {
  return timed("getPostsByTag", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        const tag = await BlogTagModel.findOne({ slug: tagSlug }).lean();
        if (!tag) return [] as PostWithTags[];
        const posts = await BlogPostModel.find({
          status: "published",
          tagIds: tag._id,
          publishedAt: { $ne: null },
        })
          .sort({ publishedAt: -1 })
          .lean();
        const clientPosts = toClient(posts) as unknown as PostShape[];
        return withTags(clientPosts);
      },
      ["posts-by-tag-with-tags", tagSlug],
      { tags: ["blog"], revalidate: 60 },
    );
    return cache();
  });
}

export const getAllTags = unstable_cache(
  async () =>
    timed("getAllTags", async () => {
      await connect();
      const docs = await BlogTagModel.find({}).sort({ name: 1 }).lean();
      return toClient(docs);
    }),
  ["tags"],
  { tags: ["blog"], revalidate: 60 },
);

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * Client-safe tree of approved comments for a single post. Top-level
 * comments carry their replies in a flat `replies` array (one level only,
 * enforced by the model + the public POST route). The public read layer
 * strips `authorEmail` — admins see that only in the inbox.
 */
export interface PublicCommentNode {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  replies: PublicCommentNode[];
}

export async function getApprovedComments(postId: string): Promise<PublicCommentNode[]> {
  return timed("getApprovedComments", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        if (!Types.ObjectId.isValid(postId)) return [] as PublicCommentNode[];
        const rows = await CommentModel.find({
          postId: new Types.ObjectId(postId),
          status: "approved",
        })
          .select("postId parentId authorName body isAdmin createdAt")
          .sort({ createdAt: 1 })
          .lean();

        const byParent = new Map<string, PublicCommentNode[]>();
        const roots: PublicCommentNode[] = [];
        for (const r of rows) {
          const node: PublicCommentNode = {
            id: String(r._id),
            postId: String(r.postId),
            parentId: r.parentId ? String(r.parentId) : null,
            authorName: r.authorName,
            body: r.body,
            isAdmin: !!r.isAdmin,
            createdAt: (r.createdAt ?? new Date(0)).toISOString(),
            replies: [],
          };
          if (node.parentId) {
            const list = byParent.get(node.parentId) ?? [];
            list.push(node);
            byParent.set(node.parentId, list);
          } else {
            roots.push(node);
          }
        }
        for (const node of roots) {
          node.replies = (byParent.get(node.id) ?? []).sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          );
        }
        return roots;
      },
      ["comments:approved-by-post", postId],
      { tags: ["comments", "blog"], revalidate: 60 },
    );
    return cache();
  });
}

/**
 * Pending count surfaced as a sidebar badge in the admin shell. Kept on
 * its own short revalidate window so the badge refreshes quickly after
 * approvals without invalidating the heavier per-post trees.
 */
export async function getPendingCommentCount(): Promise<number> {
  return timed("getPendingCommentCount", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        return CommentModel.countDocuments({ status: "pending" });
      },
      ["comments:pending-count"],
      { tags: ["comments"], revalidate: 30 },
    );
    return cache();
  });
}

// ---------------------------------------------------------------------------
// Page-view analytics
//
// Public-facing reads (per-post counts on the blog) go through
// `unstable_cache` with a short revalidate so we don't hit Mongo on every
// render of a hot post. The admin analytics page bypasses the cache
// because the admin always wants the freshest shape of the data.
// ---------------------------------------------------------------------------

/**
 * Cached per-post view count for the public blog post page. Keyed on
 * the post id; revalidates every 60s so a post that goes viral still
 * updates its header chip within a minute.
 */
export async function getPostViewCount(postId: string): Promise<number> {
  if (!Types.ObjectId.isValid(postId)) return 0;
  return timed("getPostViewCount", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        return PageViewModel.countDocuments({
          postId: new Types.ObjectId(postId),
          kind: "post",
        });
      },
      ["views:post", postId],
      { tags: ["views"], revalidate: 60 },
    );
    return cache();
  });
}

/**
 * Cached batched view counts keyed by post id, used by the blog
 * index cards. One aggregation round-trip replaces N counts.
 */
export async function getBatchPostViewCounts(
  postIds: string[],
): Promise<Record<string, number>> {
  const validIds = postIds
    .map((id) => (Types.ObjectId.isValid(id) ? id : null))
    .filter((id): id is string => Boolean(id));
  if (validIds.length === 0) return {};

  return timed("getBatchPostViewCounts", async () => {
    const cache = unstable_cache(
      async () => {
        await connect();
        const rows = await PageViewModel.aggregate<{
          _id: Types.ObjectId;
          count: number;
        }>([
          {
            $match: {
              kind: "post",
              postId: { $in: validIds.map((id) => new Types.ObjectId(id)) },
            },
          },
          { $group: { _id: "$postId", count: { $sum: 1 } } },
        ]);
        const byId: Record<string, number> = {};
        for (const id of validIds) byId[id] = 0;
        for (const row of rows) byId[row._id.toString()] = row.count;
        return byId;
      },
      ["views:batch", validIds.join(",")],
      { tags: ["views"], revalidate: 60 },
    );
    return cache();
  });
}

/**
 * Shape returned by `getAnalyticsSummary`. Kept here so the admin
 * page can be type-checked in isolation and so future report types
 * (e.g. per-tag, per-referrer) slot into the same contract.
 */
export interface AnalyticsDailyPoint {
  /** ISO date string for the day bucket, e.g. "2026-07-06". */
  day: string;
  count: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalPostViews: number;
  last7Days: number;
  last30Days: number;
  /** 14-day series (oldest → newest). Pre-padded with zero days. */
  daily: AnalyticsDailyPoint[];
  topPosts: Array<{
    postId: string;
    slug: string | null;
    path: string;
    count: number;
    title: string | null;
  }>;
  topPages: Array<{ path: string; count: number }>;
  recentViews: Array<{
    id: string;
    path: string;
    kind: "post" | "page";
    slug: string | null;
    createdAt: Date;
  }>;
}

/**
 * Live (uncached) summary used by the admin analytics dashboard.
 * Always returns the freshest shape; the page itself is `dynamic =
 * "force-dynamic"` so Next never serves a stale render.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await connect();
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    totalPostViews,
    last7,
    last30,
    dailyRows,
    topPostRows,
    topPageRows,
    recentDocs,
  ] = await Promise.all([
    PageViewModel.countDocuments({}),
    PageViewModel.countDocuments({ kind: "post" }),
    PageViewModel.countDocuments({ createdAt: { $gte: d7 } }),
    PageViewModel.countDocuments({ createdAt: { $gte: d30 } }),
    PageViewModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: d14 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    PageViewModel.aggregate<{
      _id: { postId: Types.ObjectId; slug: string | null; path: string };
      count: number;
    }>([
      { $match: { kind: "post" } },
      {
        $group: {
          _id: {
            postId: "$postId",
            slug: "$slug",
            path: "$path",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    PageViewModel.aggregate<{ _id: string; count: number }>([
      { $match: { kind: "page" } },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    PageViewModel.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select("path kind slug createdAt")
      .lean(),
  ]);

  // Bucket-fill the 14-day series so the chart always has 14 bars
  // even on a quiet day.
  const byDay = new Map(dailyRows.map((r) => [r._id, r.count]));
  const daily: AnalyticsDailyPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    daily.push({ day: key, count: byDay.get(key) ?? 0 });
  }

  // Hydrate titles for the top-posts table.
  const topPostObjectIds = topPostRows
    .map((r) => r._id.postId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const titleDocs = topPostObjectIds.length
    ? await BlogPostModel.find({ _id: { $in: topPostObjectIds } })
        .select("_id title")
        .lean()
    : [];
  const titleById = new Map<string, string>(
    titleDocs.map((d) => [d._id.toString(), d.title]),
  );

  return {
    totalViews,
    totalPostViews,
    last7Days: last7,
    last30Days: last30,
    daily,
    topPosts: topPostRows.map((r) => ({
      postId: r._id.postId.toString(),
      slug: r._id.slug,
      path: r._id.path,
      count: r.count,
      title: titleById.get(r._id.postId.toString()) ?? null,
    })),
    topPages: topPageRows.map((r) => ({ path: r._id, count: r.count })),
    recentViews: recentDocs.map((d) => ({
      id: String(d._id),
      path: d.path,
      kind: d.kind,
      slug: d.slug ?? null,
      createdAt: d.createdAt ?? new Date(0),
    })),
  };
}