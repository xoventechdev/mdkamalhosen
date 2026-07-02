import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  connect,
  BlogPostModel,
  BlogTagModel,
  toClient,
} from "@/lib/db";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { BlogPostInput } from "@/lib/schemas";
import { getAiSettings } from "@/server/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogEditorPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  await connect();
  const postDoc = await BlogPostModel.findById(id).lean();
  if (!postDoc) notFound();
  const post = toClient(postDoc) as unknown as {
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    coverUrl?: string | null;
    bodyMd: string;
    status: "draft" | "published";
    publishedAt?: Date | null;
    readingMinutes: number;
    metaDescription?: string | null;
    tagIds: string[];
  };

  // Manual join: BlogPost embeds tagIds; load the matching tags for the
  // editor to display names.
  const tagIds = post.tagIds ?? [];
  const allTagDocs = await BlogTagModel.find({})
    .sort({ name: 1 })
    .lean();
  const allTags = toClient(allTagDocs) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  const selectedTags = tagIds.length
    ? allTags.filter((t) => tagIds.includes(t.id))
    : [];

  const initial: BlogPostInput & { id: string } = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    coverUrl: post.coverUrl ?? "",
    bodyMd: post.bodyMd,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : "",
    readingMinutes: post.readingMinutes,
    metaDescription: post.metaDescription ?? "",
    tagIds: selectedTags.map((t) => t.id),
  };

  // Pull AI settings (if any) so the editor's AI panel can render in the
  // correct state without a second round-trip from the client.
  const ai = await getAiSettings();
  const aiStatus = {
    configured: Boolean(ai?.configured),
    enabled: Boolean(ai?.enabled),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to blog
      </Link>
      <BlogEditor
        initial={initial}
        availableTags={allTags as never}
        aiStatus={aiStatus}
      />
    </div>
  );
}
