/**
 * Server-side data loader for the admin dashboard (`/admin`).
 *
 * One fan-out `Promise.all` so the entire dashboard renders with
 * roughly the latency of the slowest single Mongo query. Nothing
 * here is cached — the page is `force-dynamic` and we always want
 * the freshest counts for the admin.
 */

import { Types } from "mongoose";
import {
  ActivityLogModel,
  BlogPostModel,
  CommentModel,
  MessageModel,
  PageViewModel,
  ProjectModel,
  connect,
} from "@/lib/db";
import { compactCount } from "@/lib/utils";

export interface DashboardKpi {
  label: string;
  value: number;
  hint: string;
  /** Signed % change vs. the comparison window. 0 = no baseline or unchanged. */
  deltaPct: number;
  /** Daily counts, oldest first, for the inline SVG sparkline. */
  spark: number[];
  href: string;
  iconName: KpiIconName;
}

export type KpiIconName =
  | "FolderGit2"
  | "FileText"
  | "Eye"
  | "Mail"
  | "MessageSquare"
  | "BarChart3";

export interface DashboardDailyPoint {
  /** ISO date "YYYY-MM-DD". */
  day: string;
  count: number;
}

export interface DashboardTopPost {
  postId: string;
  slug: string | null;
  title: string | null;
  views: number;
  href: string;
}

export interface DashboardTopPage {
  path: string;
  views: number;
}

export interface DashboardActivityRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userEmail: string;
  createdAt: Date;
  href: string | null;
}

export interface DashboardMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface DashboardHealth {
  draftsMissingCover: number;
  publishedMissingExcerpt: number;
  projectsNoTech: number;
  pendingComments: number;
  postsWithZeroViews30d: number;
}

export interface DashboardData {
  kpis: DashboardKpi[];
  daily: DashboardDailyPoint[];
  /** Pre-computed signed delta for the chart header (server-side, single source). */
  dailyDeltaPct: number;
  topPosts: DashboardTopPost[];
  topPages: DashboardTopPage[];
  recentActivity: DashboardActivityRow[];
  messages: DashboardMessageRow[];
  health: DashboardHealth;
  windowLabel: string;
  generatedAt: Date;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SPARK_DAYS = 14;
const CHART_DAYS = 30;

// Activity-log entity name → admin section deep-link. Pure data, no DB hit.
const ENTITY_HREFS: Record<string, string> = {
  profile: "/admin/profile",
  experience: "/admin/experience",
  education: "/admin/education",
  certification: "/admin/certifications",
  skillGroup: "/admin/skills",
  skill: "/admin/skills",
  project: "/admin/projects",
  blogPost: "/admin/blog",
  blogTag: "/admin/blog",
  message: "/admin/messages",
  comment: "/admin/comments",
  system: "/admin/settings",
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dailySeries(
  rows: Array<{ _id: string; count: number }>,
  days: number,
  anchor: Date,
): DashboardDailyPoint[] {
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const out: DashboardDailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor.getTime() - i * ONE_DAY_MS);
    out.push({ day: isoDay(d), count: byDay.get(isoDay(d)) ?? 0 });
  }
  return out;
}

/**
 * Signed % delta between two counts, clamped and null-safe.
 * Returns 0 when either side is missing or the baseline is zero.
 * Clamped to ±9999 to avoid display noise from tiny baselines.
 */
export function deltaPct(now: number, before: number): number {
  if (!Number.isFinite(now) || !Number.isFinite(before)) return 0;
  if (before <= 0) return now > 0 ? 100 : 0;
  const pct = ((now - before) / before) * 100;
  return Math.max(-9999, Math.min(9999, Math.round(pct)));
}

function buildHint(delta: number, windowText: string): string {
  if (delta === 0) return windowText;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}% vs. ${windowText}`;
}

function lastNDailyCounts(
  rows: Array<{ _id: string; count: number }>,
  days: number,
  anchor: Date,
): number[] {
  return dailySeries(rows, days, anchor).map((p) => p.count);
}

// Count items with a createdAt ≤ cutoff, by status — folded into a single
// aggregation to avoid separate round-trips.
async function countSplitByCutoff(
  model: typeof ProjectModel | typeof BlogPostModel,
  cutoff: Date,
  match: Record<string, unknown> = {},
): Promise<{ current: number; before: number }> {
  const rows = await model.aggregate<{ _id: "current" | "before"; n: number }>([
    { $match: match },
    {
      $group: {
        _id: {
          $cond: [{ $gt: ["$createdAt", cutoff] }, "current", "before"],
        },
        n: { $sum: 1 },
      },
    },
  ]);
  const map = new Map(rows.map((r) => [r._id, r.n]));
  return {
    current: map.get("current") ?? 0,
    before: map.get("before") ?? 0,
  };
}

export async function loadDashboard(): Promise<DashboardData> {
  await connect();
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * ONE_DAY_MS);
  const d14 = new Date(now.getTime() - 14 * ONE_DAY_MS);
  const d30 = new Date(now.getTime() - 30 * ONE_DAY_MS);
  const d60 = new Date(now.getTime() - 60 * ONE_DAY_MS);

  const projectsSplit = countSplitByCutoff(ProjectModel, d30, {
    status: "published",
  });
  const postsSplit = countSplitByCutoff(BlogPostModel, d30, {
    status: "published",
  });
  const projectsDailyRows = ProjectModel.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { createdAt: { $gte: d14 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const postsDailyRows = BlogPostModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: d14 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const views30Daily = PageViewModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: d30 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const viewsPrev30 = PageViewModel.countDocuments({
    createdAt: { $gte: d60, $lt: d30 },
  });
  const viewsDailySpark = PageViewModel.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { createdAt: { $gte: d14 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  // Avoid loading a full lifetime count for the "Total views" tile when we
  // can stream cheaper counts; we accept one full-collection count here
  // because the dashboard already runs many countDocuments — replacing with
  // an aggregate would be more code than the saving is worth.
  const totalViews = PageViewModel.countDocuments({});

  const unreadMessages = MessageModel.countDocuments({
    readAt: null,
    archived: false,
  });
  const messagesDailyRows = MessageModel.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { createdAt: { $gte: d14 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const recentMessageDocs = MessageModel.find({ archived: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const pendingComments = CommentModel.countDocuments({ status: "pending" });
  const pendingComments7dAgo = CommentModel.countDocuments({
    status: "pending",
    createdAt: { $lt: d7 },
  });
  const commentsDaily = CommentModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: d14 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topPageRows = PageViewModel.aggregate<{ _id: string; count: number }>([
    { $match: { kind: "page" } },
    { $group: { _id: "$path", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Group by postId only; slug is denormalised from the post on hydration so
  // a post-rename doesn't leave the dashboard showing the old slug.
  const topPostRows = PageViewModel.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { kind: "post", postId: { $ne: null } } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const recentActivityDocs = ActivityLogModel.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const healthDraftsMissingCover = BlogPostModel.countDocuments({
    status: "draft",
    $or: [{ coverUrl: { $exists: false } }, { coverUrl: null }, { coverUrl: "" }],
  });
  const healthPublishedMissingExcerpt = BlogPostModel.countDocuments({
    status: "published",
    $or: [
      { excerpt: { $exists: false } },
      { excerpt: null },
      { excerpt: "" },
    ],
  });
  const healthProjectsNoTech = ProjectModel.countDocuments({
    status: "published",
    $or: [{ techStack: { $exists: false } }, { techStack: { $size: 0 } }],
  });

  // Push the zero-views counter into Mongo so we don't stream every published
  // post's ObjectId back to Node just to compute a set difference.
  const postsWithZeroViewsAgg = BlogPostModel.aggregate<{ count: number }>([
    { $match: { status: "published" } },
    {
      $lookup: {
        from: "page_views",
        let: { pid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$postId", "$$pid"] },
              kind: "post",
              createdAt: { $gte: d30 },
            },
          },
          { $limit: 1 },
        ],
        as: "v",
      },
    },
    { $match: { v: { $size: 0 } } },
    { $count: "count" },
  ]);

  const [
    projectCounts,
    postCounts,
    pjDaily,
    psDaily,
    viewsDaily30,
    vPrev30,
    viewsSpark,
    totalViewsVal,
    unreadMsgs,
    msgsDaily,
    recentMessages,
    pendingCm,
    pendingCmOld,
    commentsDailyRows,
    topPagesRowsRaw,
    topPostRowsRaw,
    activityDocs,
    hDraftsNoCover,
    hPublishedNoExcerpt,
    hProjectsNoTech,
    postsWithZeroViewsResult,
  ] = await Promise.all([
    projectsSplit,
    postsSplit,
    projectsDailyRows,
    postsDailyRows,
    views30Daily,
    viewsPrev30,
    viewsDailySpark,
    totalViews,
    unreadMessages,
    messagesDailyRows,
    recentMessageDocs,
    pendingComments,
    pendingComments7dAgo,
    commentsDaily,
    topPageRows,
    topPostRows,
    recentActivityDocs,
    healthDraftsMissingCover,
    healthPublishedMissingExcerpt,
    healthProjectsNoTech,
    postsWithZeroViewsAgg,
  ]);

  const topPostObjectIds = topPostRowsRaw
    .map((r) => r._id)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const titleDocs = topPostObjectIds.length
    ? await BlogPostModel.find({ _id: { $in: topPostObjectIds } })
        .select("_id title slug")
        .lean()
    : [];
  const titleById = new Map<string, { title: string; slug: string | null }>(
    titleDocs.map((d) => [
      d._id.toString(),
      { title: d.title, slug: (d as { slug?: string }).slug ?? null },
    ]),
  );

  const topPosts: DashboardTopPost[] = topPostRowsRaw.map((r) => {
    const meta = titleById.get(r._id.toString());
    const slug = meta?.slug ?? null;
    return {
      postId: r._id.toString(),
      slug,
      title: meta?.title ?? null,
      views: r.count,
      href: slug ? `/blog/${slug}` : "/admin/blog",
    };
  });

  // Defensive: filter out admin/api paths in case old data exists from
  // before the tracker excluded those routes.
  const topPages: DashboardTopPage[] = topPagesRowsRaw
    .filter(
      (r) =>
        !r._id.startsWith("/admin") &&
        !r._id.startsWith("/api") &&
        !r._id.startsWith("/_next"),
    )
    .map((r) => ({ path: r._id, views: r.count }));

  const daily = dailySeries(viewsDaily30, CHART_DAYS, now);
  const dailyTotal = daily.reduce((s, p) => s + p.count, 0);
  const dailyDeltaPct = deltaPct(dailyTotal, vPrev30);

  const pjDeltaPct = deltaPct(projectCounts.current, projectCounts.before);
  const psDeltaPct = deltaPct(postCounts.current, postCounts.before);

  const kpis: DashboardKpi[] = [
    {
      label: "Published projects",
      value: projectCounts.current,
      hint: buildHint(pjDeltaPct, "30 days ago"),
      deltaPct: pjDeltaPct,
      spark: lastNDailyCounts(pjDaily, SPARK_DAYS, now),
      href: "/admin/projects",
      iconName: "FolderGit2",
    },
    {
      label: "Published posts",
      value: postCounts.current,
      hint: buildHint(psDeltaPct, "30 days ago"),
      deltaPct: psDeltaPct,
      spark: lastNDailyCounts(psDaily, SPARK_DAYS, now),
      href: "/admin/blog",
      iconName: "FileText",
    },
    {
      label: "Views (30d)",
      value: dailyTotal,
      hint: buildHint(dailyDeltaPct, "previous 30 days"),
      deltaPct: dailyDeltaPct,
      spark: lastNDailyCounts(viewsSpark, SPARK_DAYS, now),
      href: "/admin/analytics",
      iconName: "Eye",
    },
    {
      label: "Unread messages",
      value: unreadMsgs,
      hint: buildHint(0, `${pendingCmOld} pending 7d ago`),
      deltaPct: 0,
      spark: lastNDailyCounts(msgsDaily, SPARK_DAYS, now),
      href: "/admin/messages",
      iconName: "Mail",
    },
    {
      label: "Pending comments",
      value: pendingCm,
      hint: `${pendingCmOld} older than 7 days`,
      deltaPct: 0,
      spark: lastNDailyCounts(commentsDailyRows, SPARK_DAYS, now),
      href: "/admin/comments",
      iconName: "MessageSquare",
    },
    {
      label: "Total views",
      value: totalViewsVal,
      hint: `${compactCount(totalViewsVal)} tracked across the site`,
      deltaPct: 0,
      spark: lastNDailyCounts(viewsSpark, SPARK_DAYS, now),
      href: "/admin/analytics",
      iconName: "BarChart3",
    },
  ];

  const recentActivity: DashboardActivityRow[] = activityDocs.map((doc) => {
    const createdAt = (doc.createdAt ?? new Date(0)) as Date;
    const entity = String(doc.entity ?? "");
    return {
      id: String(doc._id),
      action: String(doc.action ?? "updated"),
      entity,
      entityId: (doc.entityId ?? null) as string | null,
      userEmail: String(doc.userEmail ?? ""),
      createdAt,
      href: ENTITY_HREFS[entity] ?? null,
    };
  });

  const messages: DashboardMessageRow[] = recentMessages.map((m) => {
    const createdAt = (m.createdAt ?? new Date(0)) as Date;
    return {
      id: String(m._id),
      name: String(m.name ?? ""),
      email: String(m.email ?? ""),
      subject: (m.subject ?? null) as string | null,
      message: String(m.message ?? ""),
      createdAt,
      readAt: (m.readAt ?? null) as Date | null,
    };
  });

  const health: DashboardHealth = {
    draftsMissingCover: hDraftsNoCover,
    publishedMissingExcerpt: hPublishedNoExcerpt,
    projectsNoTech: hProjectsNoTech,
    pendingComments: pendingCm,
    postsWithZeroViews30d: postsWithZeroViewsResult[0]?.count ?? 0,
  };

  return {
    kpis,
    daily,
    dailyDeltaPct,
    topPosts,
    topPages,
    recentActivity,
    messages,
    health,
    windowLabel: "vs. previous 30 days",
    generatedAt: now,
  };
}
