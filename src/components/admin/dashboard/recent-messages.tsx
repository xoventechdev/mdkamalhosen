import Link from "next/link";
import { Inbox, MailOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, initials } from "@/lib/utils";
import type { DashboardMessageRow } from "@/server/dashboard";

export interface RecentMessagesProps {
  messages: DashboardMessageRow[];
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim();
  if (trimmed.length <= n) return trimmed;
  return `${trimmed.slice(0, n).trimEnd()}…`;
}

export function RecentMessages({ messages }: RecentMessagesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Recent messages</CardTitle>
          <CardDescription>Latest contact-form submissions.</CardDescription>
        </div>
        <Link
          href="/admin/messages"
          className="text-xs font-medium text-accent hover:underline"
        >
          Inbox →
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {messages.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Inbox is empty"
              description="New contact-form messages will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((m) => {
              const unread = m.readAt === null;
              const subject = m.subject?.trim() || "(no subject)";
              return (
                <li key={m.id}>
                  <Link
                    href="/admin/messages"
                    className="group flex gap-3 px-6 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    <div
                      className={
                        unread
                          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent font-semibold text-xs"
                          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xs"
                      }
                    >
                      {initials(m.name) || <MailOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={
                            unread
                              ? "truncate text-sm font-semibold text-foreground"
                              : "truncate text-sm font-medium text-foreground/80"
                          }
                        >
                          {m.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(m.createdAt)}
                        </span>
                      </div>
                      <div className="truncate text-xs font-medium text-foreground/70">
                        {subject}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {truncate(m.message, 160)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
