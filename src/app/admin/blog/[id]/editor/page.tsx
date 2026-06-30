import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { BlogPostInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogEditorPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [row, allTags] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id }, include: { tags: true } }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!row) notFound();

  const initial: BlogPostInput & { id: number } = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    coverUrl: row.coverUrl ?? "",
    bodyMd: row.bodyMd,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : "",
    readingMinutes: row.readingMinutes,
    metaDescription: row.metaDescription ?? "",
    tagIds: row.tags.map((t) => t.id),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to blog
      </Link>
      <BlogEditor initial={initial} availableTags={allTags} />
    </div>
  );
}