import { getApprovedComments } from "@/server/queries";
import { currentAdmin } from "@/lib/auth";
import { CommentThread } from "./comment-thread";
import { CommentForm } from "./comment-form";

export interface CommentsSectionProps {
  postId: string;
  /** Per-post toggle from `BlogPostDoc.commentsEnabled` (defaults to true). */
  commentsEnabled?: boolean;
}

export async function CommentsSection({ postId, commentsEnabled = true }: CommentsSectionProps) {
  const globallyDisabled = process.env.DISABLE_COMMENTS === "true";
  // `currentAdmin` is non-throwing; returns null for visitors so we can
  // safely render inside a server component without a redirect.
  const admin = await currentAdmin();
  const isAdmin = !!admin;
  const comments = await getApprovedComments(postId);

  const totalCount =
    comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  const canPost = !globallyDisabled && commentsEnabled;

  return (
    <section id="comments" className="mt-16 space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Comments ({totalCount})
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "You are signed in as admin. Your replies are posted immediately."
            : "Comments are reviewed before they appear publicly."}
        </p>
      </header>

      <CommentThread comments={comments} isAdmin={isAdmin} />

      {!canPost ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {globallyDisabled
            ? "Comments are currently disabled site-wide."
            : "Comments are disabled for this post."}
        </p>
      ) : (
        <CommentForm postId={postId} parentId={null} variant="full" />
      )}
    </section>
  );
}
