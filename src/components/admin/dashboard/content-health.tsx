import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  EyeOff,
  ImageOff,
  MessageSquare,
  Text,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardHealth } from "@/server/dashboard";

interface HealthRow {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
  description: string;
}

export interface ContentHealthProps {
  health: DashboardHealth;
}

export function ContentHealth({ health }: ContentHealthProps) {
  const rows: HealthRow[] = [
    {
      icon: ImageOff,
      label: "Drafts missing cover",
      count: health.draftsMissingCover,
      href: "/admin/blog",
      description: "Drafts with no cover image",
    },
    {
      icon: Text,
      label: "Posts missing excerpt",
      count: health.publishedMissingExcerpt,
      href: "/admin/blog",
      description: "Published posts with no excerpt",
    },
    {
      icon: Wrench,
      label: "Projects with no tech stack",
      count: health.projectsNoTech,
      href: "/admin/projects",
      description: "Published projects missing tech stack",
    },
    {
      icon: MessageSquare,
      label: "Pending comments",
      count: health.pendingComments,
      href: "/admin/comments",
      description: "Comments awaiting moderation",
    },
    {
      icon: EyeOff,
      label: "Posts with 0 views (30d)",
      count: health.postsWithZeroViews30d,
      href: "/admin/analytics",
      description: "Published posts with no views in 30d",
    },
  ];

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Content quality signals.</CardDescription>
        </div>
        {total > 0 ? (
          <Badge variant="accent">{total}</Badge>
        ) : (
          <Badge variant="outline">All clear</Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const hasIssue = row.count > 0;
            const Icon = row.icon;
            return (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                >
                  <div
                    className={
                      hasIssue
                        ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    }
                  >
                    {hasIssue ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {row.label}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {row.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={
                        hasIssue
                          ? "font-semibold text-amber-700 dark:text-amber-400 tabular-nums"
                          : "font-medium text-muted-foreground tabular-nums"
                      }
                    >
                      {row.count}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}