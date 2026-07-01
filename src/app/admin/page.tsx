import Link from "next/link";
import {
  FolderGit2,
  FileText,
  Mail,
  Briefcase,
  GraduationCap,
  Plus,
} from "lucide-react";
import {
  connect,
  ProjectModel,
  BlogPostModel,
  MessageModel,
  ActivityLogModel,
  toClient,
} from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadStats() {
  await connect();
  const [published, drafts, publishedPosts, draftPosts, unreadMessages, recentDocs] =
    await Promise.all([
      ProjectModel.countDocuments({ status: "published" }),
      ProjectModel.countDocuments({ status: "draft" }),
      BlogPostModel.countDocuments({ status: "published" }),
      BlogPostModel.countDocuments({ status: "draft" }),
      MessageModel.countDocuments({ readAt: null, archived: false }),
      ActivityLogModel.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
  const recent = toClient(recentDocs) as unknown as Array<{
    id: string;
    action: string;
    entity: string;
    entityId?: string | null;
    userEmail: string;
    createdAt?: Date;
  }>;
  return { published, drafts, publishedPosts, draftPosts, unreadMessages, recent };
}

export default async function AdminDashboard() {
  const stats = await loadStats();

  const tiles = [
    {
      label: "Published projects",
      value: stats.published,
      hint: `${stats.drafts} draft${stats.drafts === 1 ? "" : "s"}`,
      icon: FolderGit2,
      href: "/admin/projects",
    },
    {
      label: "Published posts",
      value: stats.publishedPosts,
      hint: `${stats.draftPosts} draft${stats.draftPosts === 1 ? "" : "s"}`,
      icon: FileText,
      href: "/admin/blog",
    },
    {
      label: "Unread messages",
      value: stats.unreadMessages,
      hint: "Contact form inbox",
      icon: Mail,
      href: "/admin/messages",
    },
    {
      label: "Activity entries",
      value: stats.recent.length,
      hint: "Latest 10 changes",
      icon: Briefcase,
      href: "/admin/settings",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your portfolio content. Changes are live within seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="group">
            <Card className="transition-all hover:shadow-md group-hover:border-accent/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  {tile.label}
                </CardDescription>
                <tile.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tile.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump straight into editing.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            <Link href="/admin/projects" className="contents">
              <Button variant="secondary" className="justify-start">
                <Plus className="h-4 w-4" /> New project
              </Button>
            </Link>
            <Link href="/admin/blog" className="contents">
              <Button variant="secondary" className="justify-start">
                <Plus className="h-4 w-4" /> New blog post
              </Button>
            </Link>
            <Link href="/admin/experience" className="contents">
              <Button variant="secondary" className="justify-start">
                <Plus className="h-4 w-4" /> New experience
              </Button>
            </Link>
            <Link href="/admin/skills" className="contents">
              <Button variant="secondary" className="justify-start">
                <Plus className="h-4 w-4" /> New skill
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last 10 edits on this site.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Make your first edit to see it here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recent.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          row.action === "created"
                            ? "accent"
                            : row.action === "deleted"
                              ? "outline"
                              : "default"
                        }
                      >
                        {row.action}
                      </Badge>
                      <span className="font-medium">{row.entity}</span>
                      {row.entityId && (
                        <span className="text-xs text-muted-foreground">
                          #{row.entityId}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{row.userEmail}</div>
                      <div>{formatDate(row.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Blur tag names, controller passwords, and project addresses before uploading BMS screenshots.
          </p>
          <p>
            • Never share salary, iqama, employer confidential data, or private source code.
          </p>
          <p>
            • If something looks broken after an edit, use Settings → Revalidate everything to flush the cache.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
