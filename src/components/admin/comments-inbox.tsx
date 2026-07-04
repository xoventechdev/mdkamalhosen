"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  Trash2,
  ShieldAlert,
  XCircle,
  MessageSquareReply,
} from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import {
  approveComment,
  deleteComment,
  markCommentSpam,
  rejectComment,
  replyToComment,
} from "@/server/actions";

export type CommentStatus = "pending" | "approved" | "spam" | "rejected";

export interface CommentRow {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: CommentStatus;
  isAdmin: boolean;
  postId: string;
  postSlug: string | null;
  postTitle: string;
  parentId: string | null;
  createdAt: string;
  ipPrefix: string | null;
}

export interface CommentPostOption {
  id: string;
  title: string;
}

const STATUSES: Array<{ value: CommentStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "spam", label: "Spam" },
  { value: "rejected", label: "Rejected" },
];

function statusBadge(status: CommentStatus) {
  switch (status) {
    case "approved":
      return <Badge>Approved</Badge>;
    case "pending":
      return <Badge variant="accent">Pending</Badge>;
    case "spam":
      return <Badge variant="outline">Spam</Badge>;
    case "rejected":
      return <Badge variant="outline">Rejected</Badge>;
  }
}

function actionToast(
  res: { ok: boolean; error?: string } | undefined,
  successMsg: string,
) {
  if (res?.ok) {
    toast.success(successMsg);
  } else {
    toast.error(res?.error || "Action failed.");
  }
}

export interface CommentsInboxProps {
  items: CommentRow[];
  posts: CommentPostOption[];
  currentStatus: string;
  currentPost: string;
}

export function CommentsInbox({ items, posts, currentStatus, currentPost }: CommentsInboxProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<CommentRow | null>(null);
  const [deleting, setDeleting] = React.useState<CommentRow | null>(null);
  const [replying, setReplying] = React.useState<CommentRow | null>(null);
  const [replyBody, setReplyBody] = React.useState("");
  const [replyBusy, setReplyBusy] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function navigate(params: { status?: string; post?: string }) {
    const usp = new URLSearchParams();
    const nextStatus = params.status ?? (currentStatus === "all" ? "" : currentStatus);
    const nextPost = params.post ?? (currentPost === "all" ? "" : currentPost);
    if (nextStatus) usp.set("status", nextStatus);
    if (nextPost) usp.set("post", nextPost);
    const qs = usp.toString();
    router.push(qs ? `/admin/comments?${qs}` : "/admin/comments");
  }

  function call(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const res = await fn();
      actionToast(res, successMsg);
      if (res.ok) router.refresh();
    });
  }

  function approve(row: CommentRow) {
    call(() => approveComment({ id: row.id }), "Approved.");
  }

  function reject(row: CommentRow) {
    call(() => rejectComment({ id: row.id }), "Rejected.");
  }

  function markSpam(row: CommentRow) {
    call(() => markCommentSpam({ id: row.id }), "Marked as spam.");
  }

  function remove(row: CommentRow) {
    call(async () => {
      const r = await deleteComment({ id: row.id });
      if (r.ok) {
        setSelected(null);
      }
      return r;
    }, "Deleted.");
  }

  async function submitReply() {
    if (!replying) return;
    const body = replyBody.trim();
    if (body.length < 2) {
      toast.error("Reply must be at least 2 characters.");
      return;
    }
    setReplyBusy(true);
    try {
      const r = await replyToComment({ parentId: replying.id, body });
      actionToast(r, "Reply posted.");
      if (r.ok) {
        setReplying(null);
        setReplyBody("");
        router.refresh();
      }
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
          <p className="text-sm text-muted-foreground">
            Approve, reject, or reply to visitor comments. Deleting a top-level comment also removes its replies.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <Field label="Status" htmlFor="filter-status" className="min-w-[160px]">
            <Select
              id="filter-status"
              value={currentStatus}
              onChange={(e) => navigate({ status: e.target.value })}
              disabled={pending}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Post" htmlFor="filter-post" className="min-w-[200px]">
            <Select
              id="filter-post"
              value={currentPost}
              onChange={(e) => navigate({ post: e.target.value })}
              disabled={pending}
            >
              <option value="all">All posts</option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareReply className="h-6 w-6" aria-hidden="true" />}
          title="No comments to show"
          description="Adjust the filters above, or check back when visitors start commenting."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Author</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Excerpt</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">When</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelected(row)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{row.authorName}</span>
                    {row.isAdmin && (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-label="Admin author" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.authorEmail}</div>
                </TableCell>
                <TableCell>
                  {row.postSlug ? (
                    <Link
                      href={`/blog/${row.postSlug}`}
                      target="_blank"
                      className="link-underline text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.postTitle}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{row.postTitle}</span>
                  )}
                  {row.parentId && (
                    <div className="text-xs text-muted-foreground">reply</div>
                  )}
                </TableCell>
                <TableCell className="max-w-md">
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {row.body}
                  </span>
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    {row.status !== "approved" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => approve(row)}
                        aria-label="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {row.status !== "rejected" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => reject(row)}
                        aria-label="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {row.status !== "spam" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => markSpam(row)}
                        aria-label="Mark as spam"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setDeleting(row)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent>
          {selected && (
            <>
              <DrawerHeader>
                <DrawerTitle>{selected.authorName}</DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  &lt;{selected.authorEmail}&gt; · {formatDateTime(selected.createdAt)} ·{" "}
                  {selected.postSlug ? (
                    <Link
                      href={`/blog/${selected.postSlug}`}
                      target="_blank"
                      className="link-underline"
                    >
                      {selected.postTitle}
                    </Link>
                  ) : (
                    selected.postTitle
                  )}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {statusBadge(selected.status)}
                  {selected.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <ShieldCheck className="h-3 w-3" /> Admin author
                    </span>
                  )}
                  {selected.parentId && (
                    <Badge variant="outline">Reply</Badge>
                  )}
                </div>
              </DrawerHeader>
              <DrawerBody>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-4 dark:prose-invert">
                  {selected.body}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  IP prefix: {selected.ipPrefix || "—"}
                </p>
              </DrawerBody>
              <DrawerFooter className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {selected.status !== "approved" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        approve(selected);
                      }}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {selected.status !== "rejected" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        reject(selected);
                      }}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  )}
                  {selected.status !== "spam" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        markSpam(selected);
                      }}
                    >
                      <ShieldAlert className="h-4 w-4" /> Spam
                    </Button>
                  )}
                  {!selected.parentId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setReplying(selected);
                      }}
                    >
                      <MessageSquareReply className="h-4 w-4" /> Reply as admin
                    </Button>
                  )}
                </div>
                <Button variant="danger" size="sm" onClick={() => setDeleting(selected)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Dialog
        open={!!replying}
        onOpenChange={(o) => {
          if (!o) {
            setReplying(null);
            setReplyBody("");
          }
        }}
      >
        <DialogContent size="md">
          {replying && (
            <>
              <DialogHeader>
                <DialogTitle>Reply as admin</DialogTitle>
                <DialogDescription>
                  Your reply will be marked with the Admin badge and post immediately.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field
                  label="Reply"
                  htmlFor="admin-reply-body"
                  required
                  hint="Markdown is supported."
                >
                  <Textarea
                    id="admin-reply-body"
                    rows={5}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    maxLength={2000}
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setReplying(null);
                    setReplyBody("");
                  }}
                  disabled={replyBusy}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={submitReply} disabled={replyBusy}>
                  Post reply
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete comment?"
        description={
          deleting
            ? deleting.parentId
              ? `Reply from ${deleting.authorName} will be removed.`
              : `Top-level comment from ${deleting.authorName} and all its replies will be removed.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) return Promise.resolve();
          remove(deleting);
          return Promise.resolve();
        }}
      />
    </div>
  );
}
