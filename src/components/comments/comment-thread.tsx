"use client";

import * as React from "react";
import { Reply, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import type { PublicCommentNode } from "@/server/queries";

export interface CommentThreadProps {
  comments: PublicCommentNode[];
  /** Whether the viewer is an authenticated admin (controls reply button). */
  isAdmin: boolean;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CommentBody({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function AuthorBadge({ name, isAdmin, createdAt }: { name: string; isAdmin: boolean; createdAt: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-foreground">{name}</span>
      {isAdmin && (
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Admin
        </span>
      )}
      <time className="text-xs text-muted-foreground" dateTime={createdAt}>
        {formatDateTime(createdAt)}
      </time>
    </div>
  );
}

/**
 * One top-level comment with its nested replies. Renders a Reply
 * button (visible to anyone, since visitors can also reply). Toggling
 * it inlines a `CommentForm` bound to this comment's id.
 */
function CommentItem({
  comment,
  isAdmin,
}: {
  comment: PublicCommentNode;
  isAdmin: boolean;
}) {
  const [replying, setReplying] = React.useState(false);
  const [bodyHtml, setBodyHtml] = React.useState<string>("");

  // Render markdown on the client; the rendering is async, so we
  // hydrate it after mount. The fallback shows pre-formatted text so
  // the comment is still readable while the highlight loads.
  React.useEffect(() => {
    let cancelled = false;
    import("@/lib/markdown").then(({ renderMarkdown }) => {
      renderMarkdown(comment.body).then((html) => {
        if (!cancelled) setBodyHtml(html);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [comment.body]);

  return (
    <li
      id={`comment-${comment.id}`}
      className="rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <AuthorBadge name={comment.authorName} isAdmin={comment.isAdmin} createdAt={comment.createdAt} />

      <div className="mt-2">
        {bodyHtml ? (
          <CommentBody html={bodyHtml} />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{comment.body}</p>
        )}
      </div>

      {!replying && (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReplying(true)}
            className="text-accent"
          >
            <Reply className="h-3.5 w-3.5" /> Reply
          </Button>
          {isAdmin && (
            <span className="ml-2 text-xs text-muted-foreground">
              Your reply will be marked as Admin and post immediately.
            </span>
          )}
        </div>
      )}

      {replying && (
        <div className="mt-4">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            variant="compact"
            onCancel={() => setReplying(false)}
            onSubmitted={() => setReplying(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="mt-4 space-y-3 border-l border-border pl-4 sm:pl-6">
          {comment.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ReplyItem({ reply }: { reply: PublicCommentNode }) {
  const [bodyHtml, setBodyHtml] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    import("@/lib/markdown").then(({ renderMarkdown }) => {
      renderMarkdown(reply.body).then((html) => {
        if (!cancelled) setBodyHtml(html);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reply.body]);

  return (
    <li
      id={`comment-${reply.id}`}
      className="rounded-md border border-border/60 bg-muted/20 p-3 sm:p-4"
    >
      <AuthorBadge name={reply.authorName} isAdmin={reply.isAdmin} createdAt={reply.createdAt} />
      <div className="mt-2">
        {bodyHtml ? (
          <CommentBody html={bodyHtml} />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{reply.body}</p>
        )}
      </div>
    </li>
  );
}

export function CommentThread({ comments, isAdmin }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} isAdmin={isAdmin} />
      ))}
    </ul>
  );
}