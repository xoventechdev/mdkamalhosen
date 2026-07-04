import { connect, CommentModel, BlogPostModel } from "@/lib/db";
import { CommentsInbox, type CommentRow, type CommentPostOption } from "@/components/admin/comments-inbox";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; post?: string }>;
}) {
  await connect();

  const params = await searchParams;

  const filter: Record<string, unknown> = {};
  if (["pending", "approved", "spam", "rejected"].includes(params.status ?? "")) {
    filter.status = params.status;
  }
  if (params.post && /^[A-Za-z0-9_-]+$/.test(params.post)) {
    // Coerce to ObjectId for the find filter; do this in a tiny try
    // block so a malformed filter param cannot crash the page.
    try {
      filter.postId = params.post;
    } catch {
      /* ignore malformed id */
    }
  }

  const [rows, posts] = await Promise.all([
    CommentModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .select("_id postId parentId authorName authorEmail body status isAdmin ipPrefix createdAt")
      .lean(),
    BlogPostModel.find({}).select("_id slug title").lean(),
  ]);

  const postMap = new Map(
    posts.map((p) => [String(p._id), { slug: p.slug, title: p.title }]),
  );

  const items: CommentRow[] = rows.map((c) => ({
    id: String(c._id),
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    body: c.body,
    status: c.status as CommentRow["status"],
    isAdmin: c.isAdmin,
    postId: String(c.postId),
    postSlug: postMap.get(String(c.postId))?.slug ?? null,
    postTitle: postMap.get(String(c.postId))?.title ?? "(deleted post)",
    parentId: c.parentId ? String(c.parentId) : null,
    createdAt: (c.createdAt ?? new Date(0)).toISOString(),
    ipPrefix: c.ipPrefix ?? null,
  }));

  const postOptions: CommentPostOption[] = posts.map((p) => ({
    id: String(p._id),
    title: p.title,
  }));

  return (
    <div className="space-y-6">
      <CommentsInbox
        items={items}
        posts={postOptions}
        currentStatus={params.status ?? "all"}
        currentPost={params.post ?? "all"}
      />
    </div>
  );
}
