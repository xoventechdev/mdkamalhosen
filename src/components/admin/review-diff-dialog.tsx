"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { diffWordsWithSpace, type Change } from "diff";
import { Check, Loader2, RefreshCw, X, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Two-column diff modal for the blog AI review flow.
 *
 * Layout:
 *   ┌──────────────┬──────────────┐
 *   │  CURRENT     │  AI REVISED  │   <-- both read-only
 *   │  (highlight: │  (highlight: │
 *   │   deletions) │   additions) │
 *   └──────────────┴──────────────┘
 *   [ Keep current ] [ Re-run ] [ Take AI as post body ]
 *
 * The highlight is computed client-side via `diffWordsWithSpace`
 * (jsdiff) — independent from any `changes[]` the route returns.
 *
 * The footer "Take AI" button writes the revised body back through
 * `onApply` and the parent (blog editor) is responsible for closing
 * the dialog. We don't store the body here.
 */

export interface ReviewRevision {
  /** Complete revised Markdown body. Replaces `bodyMd` on apply. */
  revisedBody: string;
  /** Short human explanation. May be empty. */
  rationale: string;
  /** Sparse change list (informational only — see route sanitiser). */
  changes: Array<{
    start: number;
    end: number;
    newText: string;
    explanation?: string;
  }>;
}

export interface ReviewDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The original article body, as currently in the editor. */
  currentBody: string;
  /** Result of the most recent AI call. null = no AI run yet. */
  revision: ReviewRevision | null;
  /** Async re-run handler — called when the user clicks Re-run. */
  onRerun: () => Promise<void>;
  /** Apply the AI revision to the editor body. */
  onApply: (revisedBody: string) => void;
  /** True while a re-run is in flight. */
  pending: boolean;
  /** Cost / token label rendered in the header. */
  usageLabel?: string;
}

export function ReviewDiffDialog({
  open,
  onOpenChange,
  currentBody,
  revision,
  onRerun,
  onApply,
  pending,
  usageLabel,
}: ReviewDiffDialogProps) {
  // ---- Diff (memoized) -------------------------------------------------
  // Re-compute only when bodies change. `diffWordsWithSpace` is the
  // right granularity for prose (preserves whitespace + punctuation
  // boundaries) and stays fast up to ~50k chars.
  const diff = useMemo(() => {
    if (!revision) return [];
    return diffWordsWithSpace(currentBody, revision.revisedBody);
  }, [currentBody, revision]);

  // ---- Synced scroll ----------------------------------------------------
  // Two independent scrollable columns; scroll one → the other follows.
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  function syncScroll(
    from: React.MouseEvent<HTMLDivElement> | React.UIEvent<HTMLDivElement>,
    to: React.RefObject<HTMLDivElement | null>,
  ) {
    if (isSyncing.current) return;
    const src = from.currentTarget;
    const dst = to.current;
    if (!dst) return;
    isSyncing.current = true;
    const ratio =
      src.scrollTop / Math.max(1, src.scrollHeight - src.clientHeight);
    dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight);
    // Release guard on next frame so we don't ping-pong.
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }

  // ---- Esc closes the dialog --------------------------------------------
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // ---- Body scroll lock -------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ---- Mounted guard (avoid SSR portal mismatch) ------------------------
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortalInner(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-border bg-card shadow-xl animate-scale-in",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <h2
              id="review-dialog-title"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <ScrollText className="h-4 w-4" />
              AI review
              {usageLabel && (
                <span className="ml-2 font-normal text-xs text-muted-foreground">
                  {usageLabel}
                </span>
              )}
            </h2>
            {revision?.rationale && (
              <p className="mt-1 text-xs text-muted-foreground">
                {revision.rationale}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Two columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-hidden bg-border md:grid-cols-2">
          <DiffColumn
            ref={leftRef}
            title="Current"
            side="left"
            diff={diff}
            onScroll={(e) => syncScroll(e, rightRef)}
          />
          <DiffColumn
            ref={rightRef}
            title="AI revised"
            side="right"
            diff={diff}
            onScroll={(e) => syncScroll(e, leftRef)}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {revision
              ? `${countChanges(diff)} change${countChanges(diff) === 1 ? "" : "s"}`
              : "Press Re-run to ask the model to review your draft."}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Keep current
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (revision) onApply(revision.revisedBody);
                else void onRerun();
              }}
              disabled={pending || (!revision && !pending)}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              <RefreshCw className="h-4 w-4" />
              {pending ? "Reviewing…" : "Re-run"}
            </Button>
            <Button
              variant="primary"
              disabled={!revision || pending}
              onClick={() => {
                if (!revision) return;
                onApply(revision.revisedBody);
                toast.success("AI revision applied.");
              }}
            >
              <Check className="h-4 w-4" />
              Take AI as post body
            </Button>
          </div>
        </div>
      </div>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Diff column (memoised render of one side of the diff)
// ---------------------------------------------------------------------------

interface DiffColumnProps {
  title: string;
  side: "left" | "right";
  diff: Change[];
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

const DiffColumn = React.forwardRef<HTMLDivElement, DiffColumnProps>(
  function DiffColumn({ title, side, diff, onScroll }, ref) {
    return (
      <div className="flex min-h-0 flex-col bg-background">
        <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <div
          ref={ref}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed"
        >
          {diff.length === 0 ? (
            <p className="text-muted-foreground">No content yet.</p>
          ) : (
            renderSide(diff, side)
          )}
        </div>
      </div>
    );
  },
);

/**
 * Render one side of the diff:
 *   - Left side: keep all chunks, but dim "added" ones.
 *   - Right side: keep all chunks, but dim "removed" ones.
 * This produces side-by-side inline highlight with a single computation.
 */
function renderSide(diff: Change[], side: "left" | "right"): React.ReactNode {
  return diff.map((part, i) => {
    // Removed → only on LEFT side. On right, render an empty span so
    // spacing stays aligned.
    if (part.removed) {
      if (side === "right") return <span key={i} aria-hidden="true" />;
      return (
        <span
          key={i}
          className="rounded bg-red-500/15 px-0.5 text-red-700 line-through decoration-red-500/40 dark:text-red-400"
        >
          {part.value}
        </span>
      );
    }
    // Added → only on RIGHT side.
    if (part.added) {
      if (side === "left") return <span key={i} aria-hidden="true" />;
      return (
        <span
          key={i}
          className="rounded bg-emerald-500/15 px-0.5 text-emerald-700 dark:text-emerald-400"
        >
          {part.value}
        </span>
      );
    }
    // Unchanged → both sides.
    return <span key={i}>{part.value}</span>;
  });
}

function countChanges(diff: Change[]): number {
  // jsdiff emits alternating `removed` / `added` chunks for each edit;
  // count them as one "change" pair.
  let n = 0;
  let i = 0;
  while (i < diff.length) {
    const cur = diff[i];
    if (!cur) break;
    const next = i + 1 < diff.length ? diff[i + 1] : undefined;
    if (cur.removed && next?.added) {
      n += 1;
      i += 2;
    } else if (cur.added || cur.removed) {
      n += 1;
      i += 1;
    } else {
      i += 1;
    }
  }
  return n;
}

/**
 * Tiny abstraction over `createPortal` so the portal call stays out of
 * the component body (which keeps the keyboard / scroll effects
 * readable above). Equivalent to `react-dom.createPortal(_, document.body)`.
 */
function createPortalInner(node: React.ReactNode): React.ReactPortal | null {
  const { createPortal } = require("react-dom") as typeof import("react-dom");
  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
