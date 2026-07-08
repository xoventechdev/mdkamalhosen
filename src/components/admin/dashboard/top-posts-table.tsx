import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compactCount } from "@/lib/utils";
import type { DashboardTopPost } from "@/server/dashboard";

export interface TopPostsTableProps {
  posts: DashboardTopPost[];
}

export function TopPostsTable({ posts }: TopPostsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Top posts</CardTitle>
          <CardDescription>All-time views by post.</CardDescription>
        </div>
        <Link
          href="/admin/blog"
          className="text-xs font-medium text-accent hover:underline"
        >
          Manage →
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Post</TableHead>
              <TableHead className="w-24 text-right">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableEmpty colSpan={3}>
                <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p>No published posts yet.</p>
              </TableEmpty>
            ) : (
              posts.map((post, idx) => (
                <TableRow key={post.postId}>
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={post.href}
                      target={post.href.startsWith("/blog") ? "_blank" : undefined}
                      rel={post.href.startsWith("/blog") ? "noreferrer" : undefined}
                      className="group flex items-center gap-2"
                    >
                      <span className="line-clamp-1 font-medium group-hover:text-accent">
                        {post.title ?? post.slug ?? "(untitled)"}
                      </span>
                      {post.href.startsWith("/blog") && (
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {compactCount(post.views)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
