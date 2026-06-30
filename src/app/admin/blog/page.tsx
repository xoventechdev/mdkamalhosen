import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { createBlogPost } from "@/server/actions";

export const dynamic = "force-dynamic";

async function newPost() {
  "use server";
  const res = await createBlogPost({
    slug: `untitled-${Date.now()}`,
    title: "Untitled post",
    bodyMd: "",
    status: "draft",
    readingMinutes: 1,
    tagIds: [],
  });
  if (res.ok && res.id) {
    redirect(`/admin/blog/${res.id}/editor`);
  }
}

export default async function AdminBlogPage() {
  const rows = await prisma.blogPost.findMany({
    include: { tags: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <form action={newPost}>
          <Button type="submit">
            <Plus className="h-4 w-4" /> New post
          </Button>
        </form>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5}>No posts yet.</TableEmpty>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{row.slug}</div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {row.tags.map((t) => (
                      <Badge key={t.id} variant="outline">{t.name}</Badge>
                    ))}
                    {row.tags.length === 0 && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "published" ? "accent" : "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.publishedAt ? formatDate(row.publishedAt) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/blog/${row.id}/editor`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}