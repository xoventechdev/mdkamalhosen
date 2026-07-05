"use client";

import { useState } from "react";
import {
  Loader2,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Pencil,
  Search,
  Tag as TagIcon,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ReviewDiffDialog,
  type ReviewRevision,
} from "@/components/admin/review-diff-dialog";

/**
 * AI Review panel for the blog editor.
 *
 * Modes:
 *   - review  → opens a two-column diff dialog (Current | AI revised)
 *               with three buttons: Keep current / Take AI / Re-run.
 *   - titles  → inline {title, excerpt} result. Two "Use this" buttons.
 *   - seo     → inline {metaDescription} result. One "Use this" button.
 *
 * The panel never holds the AI key — settings live in the DB and the
 * `/api/admin/ai/review` route reads them server-side.
 */

type Mode = "review" | "titles" | "seo" | "tags";

type AiReviewResult =
  | { mode: "review"; revision: ReviewRevision }
  | { mode: "titles"; title: string; excerpt: string }
  | { mode: "seo"; metaDescription: string }
  | { mode: "tags"; suggestedTags: string[] };

interface AiUsage {
  in: number;
  out: number;
  model: string;
  costUsd: number;
}

/**
 * Narrow an unknown response into either a success or error envelope.
 * The route always returns `{ ok: boolean, ... }` — anything else is a
 * network/proxy glitch and we should treat it as an error.
 *
 * Success payload may also include `usage: { in, out, model, costUsd }`
 * — optional, callers should default to "—" if missing.
 */
function isOkPayload(
  value: unknown,
): value is { ok: boolean; [k: string]: unknown } & (
  | { ok: true }
  | { ok: false; error: string }
) {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.ok === true) return true;
  if (v.ok === false && typeof v.error === "string") return true;
  return false;
}

function formatUsage(u: AiUsage | null): string {
  if (!u) return "";
  const total = u.in + u.out;
  return `${total.toLocaleString()} tokens · ≈$${u.costUsd.toFixed(u.costUsd < 0.01 ? 3 : 2)} (${u.model})`;
}

export interface AiReviewPanelProps {
  bodyMd: string;
  currentTitle?: string;
  currentExcerpt?: string;
  currentMeta?: string;
  /**
   * Apply the AI's revised body back into the editor body field.
   * Used by the diff dialog's "Take AI" button.
   */
  onApplyBody: (revisedBody: string) => void;
  onApplyTitle: (title: string) => void;
  onApplyExcerpt: (excerpt: string) => void;
  onApplyMeta: (meta: string) => void;
  /**
   * Tag suggestion flow. The panel knows which of the AI's
   * suggested tags already exist in the catalogue (matched by
   * slug) and which will need to be created.
   *
   * `onAttachExistingTag` receives a pre-existing tag id.
   * `onCreateAndAttachTag` receives (name, slug) — the parent
   * calls `createBlogTag` and attaches the returned id.
   */
  existingTags: Array<{ id: string; name: string; slug: string }>;
  onAttachExistingTag: (id: string) => void;
  onCreateAndAttachTag: (name: string, slug: string) => void;
  configured: boolean;
  enabled: boolean;
}

export function AiReviewPanel({
  bodyMd,
  currentTitle,
  currentExcerpt,
  currentMeta,
  onApplyBody,
  onApplyTitle,
  onApplyExcerpt,
  onApplyMeta,
  existingTags,
  onAttachExistingTag,
  onCreateAndAttachTag,
  configured,
  enabled,
}: AiReviewPanelProps) {
  const [pending, setPending] = useState<Mode | null>(null);
  const [result, setResult] = useState<AiReviewResult | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  async function call(mode: Mode) {
    setPending(mode);
    setResult(null);
    setUsage(null);
    try {
      const res = await fetch("/api/admin/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          bodyMd,
          currentTitle,
          currentExcerpt,
          currentMeta,
        }),
      });
      // Read the body ONCE. A second `.json()` (or `.clone().json()`)
      // call would throw "Response body is already used" — the previous
      // version of this function hit that on every successful response.
      const data: unknown = await res.json();
      if (!res.ok || !isOkPayload(data) || !data.ok) {
        const errMsg =
          isOkPayload(data) && !data.ok
            ? data.error
            : `HTTP ${res.status}`;
        toast.error(errMsg);
        return;
      }
      // Capture usage if the route reported it. Optional — older
      // routes may omit it.
      if (
        typeof data.usage === "object" &&
        data.usage !== null &&
        typeof (data.usage as Record<string, unknown>).costUsd === "number"
      ) {
        setUsage(data.usage as AiUsage);
      }
      // The server returns `ok: true` plus mode-specific keys; reconstruct
      // the typed result for the renderer.
      if (mode === "review") {
        const revision: ReviewRevision = {
          revisedBody: String(data.revisedBody ?? ""),
          rationale: String(data.rationale ?? ""),
          changes: Array.isArray(data.changes)
            ? (data.changes as ReviewRevision["changes"])
            : [],
        };
        setResult({ mode: "review", revision });
        // Open the diff dialog as soon as we have a revision.
        setReviewOpen(true);
      } else if (mode === "titles") {
        setResult({
          mode: "titles",
          title: String(data.title ?? ""),
          excerpt: String(data.excerpt ?? ""),
        });
      } else if (mode === "seo") {
        setResult({
          mode: "seo",
          metaDescription: String(data.metaDescription ?? ""),
        });
      } else {
        // mode === "tags"
        const suggested = Array.isArray(data.suggestedTags)
          ? (data.suggestedTags as unknown[]).map((s) =>
              String(s).toLowerCase(),
            )
          : [];
        setResult({ mode: "tags", suggestedTags: suggested });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setPending(null);
    }
  }

  // Disabled / not-configured state — show a configure link instead.
  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> AI review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI review isn&apos;t configured yet. Add a provider key in{" "}
            <a
              href="/admin/settings"
              className="font-medium text-accent underline"
            >
              Settings → AI review
            </a>{" "}
            to enable grammar, title, and SEO suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> AI review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI review is configured but disabled. Enable it in{" "}
            <a
              href="/admin/settings"
              className="font-medium text-accent underline"
            >
              Settings
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" /> AI review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action buttons.
            The host grid is `1fr,320px` on `lg+` — the panel has ~272px
            of usable width after CardContent padding, so 4 columns
            would crowd/overlap. We pin to 2 columns all the way up so
            labels and icons never collide. Each button shrinks the
            label on narrow widths via `truncate` + tight padding. */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("review")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full min-w-0"
          >
            {pending === "review" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
            <span className="truncate">Review</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("titles")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full min-w-0"
          >
            {pending === "titles" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="truncate">Title</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("seo")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full min-w-0"
          >
            {pending === "seo" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            <span className="truncate">SEO</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("tags")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full min-w-0"
          >
            {pending === "tags" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TagIcon className="h-3.5 w-3.5" />
            )}
            <span className="truncate">Tags</span>
          </Button>
        </div>

        {/* Inline results for titles/seo only — review has its own dialog. */}
        {result?.mode === "titles" && (
          <TitlesResults
            title={result.title}
            excerpt={result.excerpt}
            usageLabel={formatUsage(usage)}
            onApplyTitle={() => {
              onApplyTitle(result.title);
              toast.success("Title applied.");
            }}
            onApplyExcerpt={() => {
              onApplyExcerpt(result.excerpt);
              toast.success("Excerpt applied.");
            }}
            onClear={() => {
              setResult(null);
              setUsage(null);
            }}
          />
        )}
        {result?.mode === "seo" && (
          <SeoResults
            metaDescription={result.metaDescription}
            usageLabel={formatUsage(usage)}
            onApply={() => {
              onApplyMeta(result.metaDescription);
              toast.success("Meta description applied.");
            }}
            onClear={() => {
              setResult(null);
              setUsage(null);
            }}
          />
        )}
        {result?.mode === "tags" && (
          <TagsResults
            suggested={result.suggestedTags}
            existingTags={existingTags}
            usageLabel={formatUsage(usage)}
            onAttachExisting={onAttachExistingTag}
            onCreateAndAttach={onCreateAndAttachTag}
            onClear={() => {
              setResult(null);
              setUsage(null);
            }}
          />
        )}

        {/* Review diff dialog — opens automatically after a review call. */}
        <ReviewDiffDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          currentBody={bodyMd}
          revision={
            result?.mode === "review" ? result.revision : null
          }
          pending={pending === "review"}
          usageLabel={formatUsage(usage)}
          onApply={(revised) => {
            onApplyBody(revised);
            setReviewOpen(false);
          }}
          onRerun={async () => {
            await call("review");
          }}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline results: titles + seo
// ---------------------------------------------------------------------------

function TitlesResults({
  title,
  excerpt,
  usageLabel,
  onApplyTitle,
  onApplyExcerpt,
  onClear,
}: {
  title: string;
  excerpt: string;
  usageLabel: string;
  onApplyTitle: () => void;
  onApplyExcerpt: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Suggested title & excerpt
          </p>
          {usageLabel && (
            <p className="text-[10px] text-muted-foreground/80">{usageLabel}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="rounded-md border border-border bg-background/60 p-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <Badge variant="outline">Title</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onApplyTitle}
              className="h-6 px-2 text-[11px]"
            >
              <Check className="h-3 w-3" /> Use this
            </Button>
          </div>
          <p className="text-sm font-medium">{title}</p>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <Badge variant="outline">Excerpt</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onApplyExcerpt}
              className="h-6 px-2 text-[11px]"
            >
              <Check className="h-3 w-3" /> Use this
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{excerpt}</p>
        </div>
      </div>
    </div>
  );
}

function SeoResults({
  metaDescription,
  usageLabel,
  onApply,
  onClear,
}: {
  metaDescription: string;
  usageLabel: string;
  onApply: () => void;
  onClear: () => void;
}) {
  const tooLong = metaDescription.length > 160;
  const tooShort = metaDescription.length < 100;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Suggested meta description
          </p>
          {usageLabel && (
            <p className="text-[10px] text-muted-foreground/80">{usageLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onApply}
            className="h-7 text-xs"
          >
            <Check className="h-3 w-3" /> Use this
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="rounded-md border border-border bg-background/60 p-2.5 text-xs text-foreground">
        {metaDescription}
      </p>
      <p
        className={cn(
          "flex items-center gap-1 text-[11px]",
          tooLong || tooShort ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {(tooLong || tooShort) && <AlertTriangle className="h-3 w-3" />}
        {metaDescription.length} chars
        {tooLong ? " (over 160)" : tooShort ? " (under 100)" : " — ideal range"}
      </p>
    </div>
  );
}

function TagsResults({
  suggested,
  existingTags,
  usageLabel,
  onAttachExisting,
  onCreateAndAttach,
  onClear,
}: {
  /** Lowercase, hyphen-separated tag slugs returned by the model. */
  suggested: string[];
  existingTags: Array<{ id: string; name: string; slug: string }>;
  usageLabel: string;
  onAttachExisting: (id: string) => void;
  onCreateAndAttach: (name: string, slug: string) => void;
  onClear: () => void;
}) {
  // Split the model output into "already exists" vs "needs to be
  // created" so the user can apply everything in one click without
  // worrying about duplicates.
  const by = new Map(existingTags.map((t) => [t.slug, t]));
  const resolved = suggested.map((slug) => ({
    slug,
    existing: by.get(slug) ?? null,
    // Display name = the slug word-separated for new tags; fall back to
    // the canonical name from the catalogue when it exists.
    name: by.get(slug)?.name ?? slug.replace(/-/g, " "),
  }));

  const applyAll = () => {
    let created = 0;
    let attached = 0;
    for (const t of resolved) {
      if (t.existing) {
        onAttachExisting(t.existing.id);
        attached += 1;
      } else {
        onCreateAndAttach(t.name, t.slug);
        created += 1;
      }
    }
    const parts: string[] = [];
    if (attached) parts.push(`${attached} attached`);
    if (created) parts.push(`${created} created`);
    toast.success(parts.length ? `Tags ${parts.join(", ")}.` : "Nothing to apply.");
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Suggested tags
          </p>
          {usageLabel && (
            <p className="text-[10px] text-muted-foreground/80">{usageLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={applyAll}
            disabled={resolved.length === 0}
            className="h-7 text-xs"
          >
            <Check className="h-3 w-3" /> Apply all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {resolved.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No tags returned. Try a different model.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {resolved.map((t) => (
            <li
              key={t.slug}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <TagIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{t.name}</span>
                <Badge
                  variant={t.existing ? "outline" : "accent"}
                  className="shrink-0 text-[10px]"
                >
                  {t.existing ? "exists" : "new"}
                </Badge>
              </div>
              {t.existing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onAttachExisting(t.existing!.id);
                    toast.success(`Tag "${t.name}" attached.`);
                  }}
                  className="h-6 px-2 text-[11px]"
                >
                  <Check className="h-3 w-3" /> Attach
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onCreateAndAttach(t.name, t.slug);
                    toast.success(`Tag "${t.name}" created.`);
                  }}
                  className="h-6 px-2 text-[11px]"
                >
                  <Plus className="h-3 w-3" /> Create
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}