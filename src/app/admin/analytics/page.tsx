import Link from "next/link";
import {
  BarChart3,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compactCount, formatDateTime } from "@/lib/utils";
import { getAnalyticsSummary } from "@/server/queries";
import { ViewsBarChart } from "@/components/analytics/views-svg-chart";

export const dynamic = "force-dynamic";

/**
 * Admin analytics dashboard. Always live (`force-dynamic`) so the
 * admin sees the freshest shape of the data after a visit.
 *
 * Layout:
 *   1. Four stat tiles (total, post, 7-day, 30-day).
 *   2. 14-day inline SVG bar chart.
 *   3. Two side-by-side tables: top posts and top pages.
 *   4. Recent views table.
 */
export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsSummary().catch((e) => {
    console.error("[admin/analytics] load failed:", e);
    return null;
  });

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Could not load analytics. Check the server logs.
          </CardContent>
        </Card>
      </div>
    );
  }

  const tiles = [
    {
      label: "Total views",
      value: data.totalViews,
      hint: "All-time",
      icon: Eye,
    },
    {
      label: "Post views",
      value: data.totalPostViews,
      hint: "Blog hits",
      icon: FileText,
    },
    {
      label: "Last 7 days",
      value: data.last7Days,
      hint: "Rolling window",
      icon: TrendingUp,
    },
    {
      label: "Last 30 days",
      value: data.last30Days,
      hint: "Rolling window",
      icon: Globe2,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Page-view counts across the public site. Cached per-IP within a 24 h
          window to keep refreshes honest.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">
                {tile.label}
              </CardDescription>
              <tile.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {compactCount(tile.value)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {tile.value.toLocaleString()} raw · {tile.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Last 14 days
          </CardTitle>
          <CardDescription>
            Daily view totals. Hover a bar for the exact count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ViewsBarChart points={data.daily} />
        </CardContent>
      </Card>

      {/* Top posts + pages */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Top posts
            </CardTitle>
            <CardDescription>
              Most-viewed blog posts all-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-24 text-right">Views</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPosts.length === 0 ? (
                  <TableEmpty colSpan={4}>
                    No post views yet. Visit a blog post to record one.
                  </TableEmpty>
                ) : (
                  data.topPosts.map((p) => (
                    <TableRow key={p.postId}>
                      <TableCell>
                        <div className="font-medium">
                          {p.title ?? (
                            <span className="text-muted-foreground">
                              (deleted post)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {p.path}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.slug ? (
                          <Badge variant="outline">{p.slug}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.slug && (
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground"
                            title="Open post"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5" /> Top pages
            </CardTitle>
            <CardDescription>
              Most-viewed public routes (excludes blog posts).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead className="w-24 text-right">Views</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPages.length === 0 ? (
                  <TableEmpty colSpan={3}>
                    No public-page views yet.
                  </TableEmpty>
                ) : (
                  data.topPages.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell>
                        <span className="font-mono text-sm">{p.path}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={p.path}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-muted-foreground hover:text-foreground"
                          title="Open page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent views */}
      <Card>
        <CardHeader>
          <CardTitle>Recent views</CardTitle>
          <CardDescription>
            Latest 10 tracked hits across the public site.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="w-24">Kind</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentViews.length === 0 ? (
                <TableEmpty colSpan={3}>No views recorded yet.</TableEmpty>
              ) : (
                data.recentViews.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(v.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{v.path}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.kind === "post" ? "accent" : "outline"}>
                        {v.kind}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}