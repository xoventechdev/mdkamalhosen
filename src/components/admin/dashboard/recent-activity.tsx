import Link from "next/link";
import {
  Activity,
  Award,
  FileText,
  FolderGit2,
  GraduationCap,
  Hash,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Tag,
  Trash2,
  User,
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
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/utils";
import type { DashboardActivityRow } from "@/server/dashboard";

const ENTITY_ICONS: Record<string, LucideIcon> = {
  profile: User,
  experience: FolderGit2,
  education: GraduationCap,
  certification: Award,
  skillGroup: Wrench,
  skill: Wrench,
  project: FolderGit2,
  blogPost: FileText,
  blogTag: Tag,
  message: Mail,
  comment: MessageSquare,
  system: Settings,
};

const ENTITY_LABELS: Record<string, string> = {
  profile: "Profile",
  experience: "Experience",
  education: "Education",
  certification: "Certification",
  skillGroup: "Skill group",
  skill: "Skill",
  project: "Project",
  blogPost: "Blog post",
  blogTag: "Blog tag",
  message: "Message",
  comment: "Comment",
  system: "System",
};

const ACTION_ICONS: Record<string, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  system: Settings,
};

export interface RecentActivityProps {
  rows: DashboardActivityRow[];
}

export function RecentActivity({ rows }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest 10 edits across the site.</CardDescription>
        </div>
        <Link
          href="/admin/settings"
          className="text-xs font-medium text-accent hover:underline"
        >
          Settings →
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No activity yet"
              description="Edits you make will appear here. The feed keeps the latest 10 entries."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const EntityIcon = ENTITY_ICONS[row.entity] ?? Hash;
              const ActionIcon = ACTION_ICONS[row.action] ?? Pencil;
              const entityLabel = ENTITY_LABELS[row.entity] ?? row.entity;
              const badgeVariant =
                row.action === "created"
                  ? "accent"
                  : row.action === "deleted"
                    ? "outline"
                    : "default";
              const content = (
                <div className="flex items-center gap-3 py-3 px-6 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <EntityIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActionIcon
                        className="h-3 w-3 text-muted-foreground"
                        aria-hidden
                      />
                      <Badge variant={badgeVariant}>{row.action}</Badge>
                      <span className="font-medium text-foreground">
                        {entityLabel}
                      </span>
                      {row.entityId && (
                        <span className="text-xs text-muted-foreground">
                          #{row.entityId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="font-medium text-foreground/80">
                      {row.userEmail}
                    </div>
                    <div title={row.createdAt.toISOString()}>
                      {formatRelative(row.createdAt)}
                    </div>
                  </div>
                </div>
              );

              return row.href ? (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="block transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    {content}
                  </Link>
                </li>
              ) : (
                <li key={row.id}>{content}</li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
