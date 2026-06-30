"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Archive, ArchiveRestore, Trash2, Reply } from "lucide-react";
import { toast } from "sonner";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteMessage,
  markMessageArchived,
  markMessageRead,
  markMessageUnread,
} from "@/server/actions";
import { formatDate } from "@/lib/utils";

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  ipPrefix: string | null;
  readAt: Date | null;
  archived: boolean;
  createdAt: Date;
}

export function MessagesInbox({ rows: initialRows }: { rows: MessageRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [deleting, setDeleting] = useState<MessageRow | null>(null);
  const [pending, startTransition] = useTransition();

  function call(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(res.error ?? "Action failed.");
      }
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>From</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.length === 0 ? (
            <TableEmpty colSpan={6}>No messages yet.</TableEmpty>
          ) : (
            initialRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelected(row)}
                className="cursor-pointer"
              >
                <TableCell>
                  {row.readAt ? (
                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Mail className="h-4 w-4 text-accent" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {row.subject || <span className="text-muted-foreground">(no subject)</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  {row.archived ? (
                    <Badge variant="outline">Archived</Badge>
                  ) : row.readAt ? (
                    <Badge>Read</Badge>
                  ) : (
                    <Badge variant="accent">Unread</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      call(() => deleteMessage(row.id).then((r) => ({ ok: r.ok, error: r.ok ? undefined : r.error })), "Deleted.")
                    }
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent>
          {selected && (
            <>
              <DrawerHeader>
                <DrawerTitle>{selected.subject || "(no subject)"}</DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  From {selected.name} &lt;{selected.email}&gt; · {formatDate(selected.createdAt)}
                </p>
              </DrawerHeader>
              <DrawerBody>
                <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm">
                  {selected.message}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  IP prefix: {selected.ipPrefix || "—"}
                </p>
              </DrawerBody>
              <DrawerFooter className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  {selected.readAt ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        call(() => markMessageUnread(selected.id).then((r) => ({ ok: r.ok, error: r.ok ? undefined : r.error })), "Marked unread.");
                        setSelected({ ...selected, readAt: null });
                      }}
                    >
                      <Mail className="h-4 w-4" /> Mark unread
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        call(() => markMessageRead(selected.id).then((r) => ({ ok: r.ok, error: r.ok ? undefined : r.error })), "Marked read.");
                        setSelected({ ...selected, readAt: new Date() });
                      }}
                    >
                      <MailOpen className="h-4 w-4" /> Mark read
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      call(
                        () => markMessageArchived(selected.id, !selected.archived).then((r) => ({ ok: r.ok, error: r.ok ? undefined : r.error })),
                        selected.archived ? "Unarchived." : "Archived.",
                      )
                    }
                  >
                    {selected.archived ? (
                      <>
                        <ArchiveRestore className="h-4 w-4" /> Unarchive
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4" /> Archive
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent(selected.subject ?? "")}`}>
                      <Reply className="h-4 w-4" /> Reply
                    </a>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleting(selected)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete message?"
        description={deleting ? `From ${deleting.name} (${deleting.email})` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          return deleteMessage(deleting.id).then((res) => {
            if (res.ok) {
              toast.success("Deleted.");
              setSelected(null);
              setDeleting(null);
              router.refresh();
            } else {
              toast.error(res.error);
            }
          });
        }}
      />
    </>
  );
}