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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * AI Review panel for the blog editor.
 *
 * Modes:
 *   - review  → array of {original, replacement, rationale, severity}
 *               suggestions. User accepts one at a time via "Apply" or
 *               applies them all in one click.
 *   - titles  → {title, excerpt}. Two "Use this" buttons.
 *   - seo     → {metaDescription}. One "Use this" button.
 *
 * The panel never holds the AI key — settings live in the DB and the
 * `/api/admin/ai/review` route reads them server-side.
 */

type Mode = "review" | "titles" | "seo";

interface Suggestion {
  id: string;
  original: string;
  replacement: string;
  rationale: string;
  severity: "grammar" | "clarity" | "style";
}

type AiReviewResult =
  | { mode: "review"; suggestions: Suggestion[] }
  | { mode: "titles"; title: string; excerpt: string }
  | { mode: "seo"; metaDescription: string };

export interface AiReviewPanelProps {
  bodyMd: string;
  currentTitle?: string;
  currentExcerpt?: string;
  currentMeta?: string;
  onApplyReplacement: (original: string, replacement: string) => void;
  onApplyTitle: (title: string) => void;
  onApplyExcerpt: (excerpt: string) => void;
  onApplyMeta: (meta: string) => void;
  configured: boolean;
  enabled: boolean;
}

const SEVERITY_LABEL: Record<Suggestion["severity"], string> = {
  grammar: "Grammar",
  clarity: "Clarity",
  style: "Style",
};

const SEVERITY_COLOR: Record<Suggestion["severity"], string> = {
  grammar: "bg-red-500/10 text-red-600 border-red-500/30",
  clarity: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  style: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

export function AiReviewPanel({
  bodyMd,
  currentTitle,
  currentExcerpt,
  currentMeta,
  onApplyReplacement,
  onApplyTitle,
  onApplyExcerpt,
  onApplyMeta,
  configured,
  enabled,
}: AiReviewPanelProps) {
  const [pending, setPending] = useState<Mode | null>(null);
  const [result, setResult] = useState<AiReviewResult | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  async function call(mode: Mode) {
    setPending(mode);
    setResult(null);
    setAppliedIds(new Set());
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
      const data = (await res.json()) as
        | { ok: true }
        | {
            ok: false;
            error: string;
          };
      if (!res.ok || !data.ok) {
        const errMsg = "error" in data ? data.error : `HTTP ${res.status}`;
        toast.error(errMsg);
        return;
      }
      // The server returns `ok: true` plus mode-specific keys; reconstruct
      // the typed result for the renderer.
      const json = (await res.clone().json()) as Record<string, unknown>;
      if (mode === "review") {
        setResult({ mode: "review", suggestions: (json.suggestions as Suggestion[]) ?? [] });
      } else if (mode === "titles") {
        setResult({
          mode: "titles",
          title: String(json.title ?? ""),
          excerpt: String(json.excerpt ?? ""),
        });
      } else {
        setResult({ mode: "seo", metaDescription: String(json.metaDescription ?? "") });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setPending(null);
    }
  }

  function applyOne(s: Suggestion) {
    onApplyReplacement(s.original, s.replacement);
    setAppliedIds((prev) => new Set(prev).add(s.id));
    toast.success("Replacement applied.");
  }

  function applyAll(suggestions: Suggestion[]) {
    let working = bodyMd;
    let appliedCount = 0;
    const ids = new Set<string>();
    for (const s of suggestions) {
      if (working.includes(s.original)) {
        working = working.replace(s.original, s.replacement);
        ids.add(s.id);
        appliedCount += 1;
      }
    }
    // Single replacement pass — apply each one in turn so we don't
    // double-replace overlapping spans.
    for (const s of suggestions) {
      if (!ids.has(s.id)) continue;
      onApplyReplacement(s.original, s.replacement);
    }
    setAppliedIds(ids);
    toast.success(`Applied ${appliedCount} suggestion${appliedCount === 1 ? "" : "s"}.`);
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
        {/* Action buttons */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("review")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full"
          >
            {pending === "review" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
            Review writing
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("titles")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full"
          >
            {pending === "titles" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Suggest title
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => call("seo")}
            disabled={pending !== null || !bodyMd.trim()}
            className="w-full"
          >
            {pending === "seo" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            SEO description
          </Button>
        </div>

        {/* Results */}
        {result?.mode === "review" && (
          <ReviewResults
            suggestions={result.suggestions}
            appliedIds={appliedIds}
            onApplyOne={applyOne}
            onApplyAll={() => applyAll(result.suggestions)}
            onClear={() => setResult(null)}
          />
        )}
        {result?.mode === "titles" && (
          <TitlesResults
            title={result.title}
            excerpt={result.excerpt}
            onApplyTitle={() => {
              onApplyTitle(result.title);
              toast.success("Title applied.");
            }}
            onApplyExcerpt={() => {
              onApplyExcerpt(result.excerpt);
              toast.success("Excerpt applied.");
            }}
            onClear={() => setResult(null)}
          />
        )}
        {result?.mode === "seo" && (
          <SeoResults
            metaDescription={result.metaDescription}
            onApply={() => {
              onApplyMeta(result.metaDescription);
              toast.success("Meta description applied.");
            }}
            onClear={() => setResult(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Result renderers
// ---------------------------------------------------------------------------

function ReviewResults({
  suggestions,
  appliedIds,
  onApplyOne,
  onApplyAll,
  onClear,
}: {
  suggestions: Suggestion[];
  appliedIds: Set<string>;
  onApplyOne: (s: Suggestion) => void;
  onApplyAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {suggestions.length === 0
            ? "No suggestions — looks clean."
            : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-1">
          {suggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onApplyAll}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3" /> Apply all
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs"
            aria-label="Dismiss suggestions"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {suggestions.map((s) => {
          const applied = appliedIds.has(s.id);
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-md border bg-background/60 p-2.5 text-xs",
                applied
                  ? "border-emerald-500/30 opacity-60"
                  : "border-border",
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    SEVERITY_COLOR[s.severity],
                  )}
                >
                  {SEVERITY_LABEL[s.severity]}
                </span>
                <span className="flex-1 text-muted-foreground">{s.rationale}</span>
                {!applied && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onApplyOne(s)}
                    className="h-6 px-2 text-[11px]"
                  >
                    Apply
                  </Button>
                )}
                {applied && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <Check className="h-3 w-3" /> Applied
                  </span>
                )}
              </div>
              <p className="rounded bg-red-500/5 px-2 py-1 font-mono text-[11px] text-red-700 dark:text-red-400">
                {s.original}
              </p>
              <p className="mt-1 rounded bg-emerald-500/5 px-2 py-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                {s.replacement}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TitlesResults({
  title,
  excerpt,
  onApplyTitle,
  onApplyExcerpt,
  onClear,
}: {
  title: string;
  excerpt: string;
  onApplyTitle: () => void;
  onApplyExcerpt: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Suggested title & excerpt
        </p>
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
  onApply,
  onClear,
}: {
  metaDescription: string;
  onApply: () => void;
  onClear: () => void;
}) {
  const tooLong = metaDescription.length > 160;
  const tooShort = metaDescription.length < 100;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Suggested meta description
        </p>
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