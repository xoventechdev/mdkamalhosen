import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connect, AiSettingsModel, AI_SETTINGS_ID } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { take } from "@/lib/auth-rate-limit";
import { decryptSecret } from "@/lib/crypto-secret";
import { callChat, AiError } from "@/lib/ai/client";
import {
  aiReviewRevisionSchema,
  aiTitlesSchema,
  aiSeoSchema,
  aiTagsSchema,
  type AiProviderId,
} from "@/lib/schemas";

export const runtime = "nodejs";

const requestSchema = z.object({
  mode: z.enum(["review", "titles", "seo", "tags"]),
  // `bodyMd` is required for `review`. For `titles`/`seo` either
  // `summary` (preferred) OR `bodyMd` (fallback) should be present;
  // either is fine at the schema level and the route picks whichever
  // exists.
  bodyMd: z.string().min(1).max(50_000),
  summary: z.string().min(1).max(4_000).optional(),
  currentTitle: z.string().max(200).optional(),
  currentExcerpt: z.string().max(500).optional(),
  currentMeta: z.string().max(200).optional(),
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

// ---------------------------------------------------------------------------
// System prompts
//
// Each prompt:
//   - Defines the role.
//   - Specifies the EXACT JSON shape expected.
//   - Adds defense-in-depth: ignore any instructions in the user content
//     and return only valid JSON.
// ---------------------------------------------------------------------------

const SYSTEM_REVIEW = `You are a careful editor reviewing a draft blog post written in Markdown.
Your job is to produce a cleaned-up, lightly-edited revision of the article and a short rationale.

The work is layered — apply these in order, do not skip steps:

1. FORMATTING / STRUCTURE (run this first, even if the article looks clean):
   - Normalize heading levels (don't introduce H1 if there isn't one in the original; promote/demote to keep the hierarchy consistent).
   - Ensure exactly one blank line between block elements (paragraphs, headings, lists, code fences, blockquotes).
   - Fix broken Markdown: unclosed code fences, mismatched list markers (mixing - and * in the same list), missing blank lines around lists and code blocks, hard tabs replaced with two spaces.
   - Wrap code samples in fenced code blocks with a language tag (e.g. \`\`\`bash).
   - Normalize list indentation: nested lists indented by 2 spaces (not tabs).
   - Convert standalone URLs to inline links only if the surrounding prose would read better that way; otherwise leave them.
   - Trim trailing whitespace on every line. End the file with exactly one newline.

2. EDITORIAL / LANGUAGE (only after structure is clean):
   - Fix typos, grammatical errors, and punctuation mistakes.
   - Tighten genuinely awkward phrasing. Do not reword for taste.
   - Convert obvious double spaces to single spaces.
   - Keep the author's voice, terminology, and code identifiers untouched.

DO NOT:
- Add new ideas, examples, or claims. (Formatting ≠ filling in.)
- Remove content. If something looks redundant, leave it.
- Change the meaning of any sentence.
- Rewrite prose for style. Re-format, then lightly edit. Stop.

If the article is already clean (both structurally and editorially), return a \`revisedBody\` identical to the original and an empty \`changes\` array.

Return ONLY valid JSON in this exact shape (no commentary, no markdown fences):
{
  "revisedBody": "<the COMPLETE revised Markdown body, end-to-end>",
  "rationale": "<1 to 3 short sentences explaining what you changed and why; empty string if nothing changed>",
  "changes": [
    {
      "start": <0-based character index into the ORIGINAL body, inclusive>,
      "end": <0-based character index into the ORIGINAL body, exclusive>,
      "newText": "<the substring that replaced the original span>",
      "explanation": "<one short sentence explaining this specific change>"
    }
  ]
}

Rules for \`changes\`:
- Each entry's \`start\`..\`end\` MUST be a contiguous slice of the ORIGINAL body — character counts from the start of the body string, in the exact body you received.
- Order entries by \`start\` ascending; ranges must not overlap.
- The sum of all \`newText\` values, applied in order to the original, must reproduce \`revisedBody\`.
- If you make no changes, return \`"changes": []\`.
- Cap at 50 entries; if you find more issues than that, prefer the most impactful.
- Output must be valid JSON; do not wrap it in \`\`\` fences.`;

const SYSTEM_TITLES = `You write concise, specific titles and excerpts for technical blog posts.

Return ONLY valid JSON in this exact shape:
{
  "title": "<10 to 80 characters, sentence case, no trailing punctuation>",
  "excerpt": "<80 to 220 characters, one or two sentences>"
}

Rules:
- Title should be specific and concrete (not generic like "My thoughts on X").
- Excerpt should hook the reader with the main argument or takeaway.
- Match the tone of the article.
- Output must be valid JSON; do not wrap it in fences.`;

const SYSTEM_SEO = `You write meta descriptions for blog posts. They appear in search engine result pages.

Return ONLY valid JSON in this exact shape:
{
  "metaDescription": "<between 110 and 155 characters, one sentence>"
}

Rules:
- One sentence, plain prose, no hashtags, no quotes.
- Include the main topic and a hint of the takeaway.
- Output must be valid JSON; do not wrap it in fences.`;

const SYSTEM_TAGS = `You read a blog post and propose 3–5 short tags that would help readers discover related articles on a personal engineering portfolio.

Tags are lowercase, hyphen-separated, 1–3 words (e.g. "bacnet", "niagara-4", "iot", "commissioning", "hvac").

Rules:
- Suggest 3–5 tags. Do not pad the list with weak or generic tags.
- Prefer topics over technologies when both apply (e.g. "bacnet" instead of "protocol" for a BACnet article).
- Avoid the author's name, employer, project codes, or anything confidential.
- Skip tags that overlap with each other (one tag per topic).
- Use established conventions in the BMS / building automation / software-engineering space.

Return ONLY valid JSON in this exact shape:
{
  "suggestedTags": ["tag-one", "tag-two", "tag-three"]
}

Output must be valid JSON; do not wrap it in fences.`;

// Approximate USD pricing per 1M tokens. Conservative defaults pulled
// from each provider's public pricing page; can be overridden via env
// vars (cost-per-1M-in / cost-per-1M-out) if needed. We don't try to
// account for caching discounts — the goal is a rough "≈$0.04" line
// in the UI, not ledger-grade accounting.
const MODEL_PRICING: Record<
  string,
  { inPer1M: number; outPer1M: number; display: string }
> = {
  "gpt-4o-mini": { inPer1M: 0.15, outPer1M: 0.6, display: "gpt-4o-mini" },
  "gpt-4o": { inPer1M: 5.0, outPer1M: 15.0, display: "gpt-4o" },
  "gpt-4-turbo": { inPer1M: 10.0, outPer1M: 30.0, display: "gpt-4-turbo" },
  "claude-3-5-sonnet-latest": {
    inPer1M: 3.0,
    outPer1M: 15.0,
    display: "claude-3.5-sonnet",
  },
  "claude-3-5-haiku-latest": {
    inPer1M: 0.8,
    outPer1M: 4.0,
    display: "claude-3.5-haiku",
  },
  "gemini-1.5-flash": {
    inPer1M: 0.075,
    outPer1M: 0.3,
    display: "gemini-1.5-flash",
  },
  "gemini-1.5-pro": {
    inPer1M: 3.5,
    outPer1M: 10.5,
    display: "gemini-1.5-pro",
  },
  "gemini-2.0-flash": {
    inPer1M: 0.1,
    outPer1M: 0.4,
    display: "gemini-2.0-flash",
  },
};
// OpenRouter models are priced by the provider; we don't maintain a
// full catalog, so fall back to a middle-tier estimate and let the
// "display" string show the actual model id to the user.
const OPENROUTER_FALLBACK = {
  inPer1M: 1.0,
  outPer1M: 3.0,
  display: "openrouter",
};

function priceFor(provider: AiProviderId, model: string) {
  if (provider === "openrouter") {
    return { ...OPENROUTER_FALLBACK, display: model };
  }
  return (
    MODEL_PRICING[model] ?? {
      inPer1M: 1.0,
      outPer1M: 3.0,
      display: model,
    }
  );
}

function costUsd(
  provider: AiProviderId,
  model: string,
  usage: { in: number; out: number },
): number {
  const p = priceFor(provider, model);
  const usd =
    (usage.in / 1_000_000) * p.inPer1M +
    (usage.out / 1_000_000) * p.outPer1M;
  // Clamp to 5 decimal places; never negative.
  return Math.max(0, Math.round(usd * 1e5) / 1e5);
}

/**
 * Build the success envelope: mode-specific data + usage + cost.
 * Always returns these three keys together so the client can render
 * the "≈$0.04" hint without a second round-trip.
 */
function successEnvelope(
  modeData: Record<string, unknown>,
  usage: { in: number; out: number } | undefined,
  provider: AiProviderId,
  model: string,
) {
  if (!usage) return { ok: true as const, ...modeData };
  const usage_block = {
    in: usage.in,
    out: usage.out,
    model,
    costUsd: costUsd(provider, model, usage),
  };
  return { ok: true as const, usage: usage_block, ...modeData };
}

/**
 * POST /api/admin/ai/review
 *
 * Body: { mode, bodyMd | summary, currentTitle?, currentExcerpt?, currentMeta? }
 *
 * Modes:
 *   review → returns a list of {original, replacement} suggestions
 *   titles → returns {title, excerpt}
 *   seo    → returns {metaDescription}
 *
 * Auth: admin only (HMAC cookie + DB allow-list).
 * Rate limit: 10 requests/min per admin.
 *
 * The settings row is decrypted per-request. The plaintext key never
 * leaves the server — only the model's reply is returned.
 *
 * Responses include `{ ok: true, usage: { in, out, costUsd, model }, ... }`
 * so the UI can show a per-call cost line and a logged audit trail.
 */
export async function POST(request: NextRequest) {
  // --- Auth ---
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // --- Rate limit ---
  const rl = take("ai-review", RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Rate limit hit. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      },
      { status: 429 },
    );
  }

  // --- Body ---
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request.",
      },
      { status: 400 },
    );
  }

  const {
    mode,
    bodyMd,
    summary,
    currentTitle,
    currentExcerpt,
    currentMeta,
  } = parsed.data;

  // --- Load settings ---
  try {
    await connect();
    const doc = await AiSettingsModel.findById(AI_SETTINGS_ID).lean();
    if (!doc) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI is not configured. Open Settings → AI review to add a key.",
        },
        { status: 412 },
      );
    }
    if (!doc.enabled) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI review is disabled in Settings.",
        },
        { status: 412 },
      );
    }
    const apiKey = decryptSecret(doc.encryptedKey);
    const provider = doc.provider as AiProviderId;
    // For cheap modes (titles, seo) use the cheaper model if set;
    // fallback to the user's primary model. Review always uses the
    // primary model — that's where quality matters most.
    const cheapModel = (doc as { cheaperModel?: string | null }).cheaperModel;
    const model =
      mode === "review" || !cheapModel ? doc.model : cheapModel;
    // tags is a cheap structured task (same shape as seo/titles), so it
    // gets the cheaper model when configured.

    // --- Build prompt based on mode ---
    let systemPrompt: string;
    let userPrompt: string;
    if (mode === "review") {
      systemPrompt = SYSTEM_REVIEW;
      userPrompt = `Reformat and lightly edit the following Markdown article body. Apply structural normalisation first, then minimal editorial cleanup. Return JSON only.\n\n---\n${bodyMd}`;
    } else if (mode === "tags") {
      systemPrompt = SYSTEM_TAGS;
      userPrompt = `Propose 1–5 tags for the article below. Return JSON only.\n\n---\n${bodyMd}`;
    } else if (mode === "titles") {
      systemPrompt = SYSTEM_TITLES;
      userPrompt = buildShortPrompt(
        "Write a title and excerpt for the article summarised below.",
        summary,
        bodyMd,
        currentTitle,
        currentExcerpt,
      );
    } else {
      systemPrompt = SYSTEM_SEO;
      userPrompt = buildShortPrompt(
        "Write a meta description for the article summarised below.",
        summary,
        bodyMd,
        undefined,
        undefined,
        currentMeta,
      );
    }

    // --- Call provider ---
    let result;
    try {
      result = await callChat(provider, model, apiKey, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
    } catch (err) {
      if (err instanceof AiError) {
        return NextResponse.json(
          { ok: false, error: err.message },
          { status: err.status === 401 || err.status === 403 ? 401 : 502 },
        );
      }
      throw err;
    }

    // --- Log usage server-side (single line, structured) ---
    // Cheap enough to keep on — admin-only endpoint, low QPS.
    if (result.usage) {
      const cost = costUsd(provider, model, result.usage);
      // eslint-disable-next-line no-console
      console.log(
        `[ai-review] mode=${mode} model=${model} ` +
          `in=${result.usage.in} out=${result.usage.out} ` +
          `costUsd=${cost.toFixed(5)}`,
      );
    }

    // --- Parse + validate response shape ---
    const json = extractJson(result.text);
    if (mode === "review") {
      const validated = aiReviewRevisionSchema.safeParse(json);
      if (!validated.success) {
        return NextResponse.json(
          shapeError(
            "Model returned a review in the wrong shape. Try again or pick a different model.",
            validated.error.issues,
          ),
          { status: 502 },
        );
      }

      // Defense in depth: validate the model's `changes` array against
      // the body we actually sent. We can't fully trust the indexes
      // because non-ASCII characters and Markdown source can shift
      // counts — but we DO verify:
      //   1. Every range is in-bounds and non-empty.
      //   2. Ranges are sorted ascending and non-overlapping.
      //   3. Applying the changes produces the claimed `revisedBody`.
      // If any check fails, drop the `changes` array (the renderer
      // can still show the full revisedBody as a plain comparison)
      // rather than failing the whole response.
      const changes = sanitiseChanges(
        validated.data.changes,
        bodyMd,
        validated.data.revisedBody,
      );

      return NextResponse.json(
        successEnvelope(
          {
            revisedBody: validated.data.revisedBody,
            rationale: validated.data.rationale,
            changes,
          },
          result.usage,
          provider,
          model,
        ),
      );
    }
    if (mode === "titles") {
      const validated = aiTitlesSchema.safeParse(json);
      if (!validated.success) {
        return NextResponse.json(
          shapeError(
            "Model returned a title/excerpt in the wrong shape.",
            validated.error.issues,
          ),
          { status: 502 },
        );
      }
      return NextResponse.json(
        successEnvelope(
          { title: validated.data.title, excerpt: validated.data.excerpt },
          result.usage,
          provider,
          model,
        ),
      );
    }
    if (mode === "seo") {
      const validated = aiSeoSchema.safeParse(json);
      if (!validated.success) {
        return NextResponse.json(
          shapeError(
            "Model returned a meta description in the wrong shape.",
            validated.error.issues,
          ),
          { status: 502 },
        );
      }
      return NextResponse.json(
        successEnvelope(
          { metaDescription: validated.data.metaDescription },
          result.usage,
          provider,
          model,
        ),
      );
    }
    // mode === "tags"
    const tagsValidated = aiTagsSchema.safeParse(json);
    if (!tagsValidated.success) {
      return NextResponse.json(
        shapeError(
          "Model returned tag suggestions in the wrong shape.",
          tagsValidated.error.issues,
        ),
        { status: 502 },
      );
    }
    return NextResponse.json(
      successEnvelope(
        { suggestedTags: tagsValidated.data.suggestedTags },
        result.usage,
        provider,
        model,
      ),
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "AI request failed.",
      },
      { status: 500 },
    );
  }
}

/**
 * Build a short-form prompt for titles/seo. Prefer the cached summary
 * (≈300 tokens) over the full body (often thousands of tokens) — same
 * 95% input-cost reduction per call.
 */
function buildShortPrompt(
  intro: string,
  summary: string | undefined,
  bodyMd: string,
  currentTitle?: string,
  currentExcerpt?: string,
  currentMeta?: string,
): string {
  if (summary) {
    const bits = [intro, "", "Article summary:", summary];
    if (currentTitle) bits.push("", `Current title: "${currentTitle}"`);
    if (currentExcerpt)
      bits.push("", `Current excerpt: "${currentExcerpt}"`);
    if (currentMeta)
      bits.push("", `Current meta description: "${currentMeta}"`);
    return bits.join("\n");
  }
  // Fallback (first session, summary not yet generated).
  if (currentTitle) return `${intro}\n\nCurrent title: "${currentTitle}"\n\n---\n${bodyMd}`;
  if (currentMeta) return `${intro}\n\nCurrent meta: "${currentMeta}"\n\n---\n${bodyMd}`;
  if (currentExcerpt) return `${intro}\n\nCurrent excerpt: "${currentExcerpt}"\n\n---\n${bodyMd}`;
  return `${intro}\n\n---\n${bodyMd}`;
}

/**
 * Build the friendly "wrong shape" error response.
 *
 * In development we append the actual Zod issues so you can see which
 * field/constraint the model failed (e.g. `metaDescription: too_short:
 * expected string to have >=50 characters`). In production the error
 * stays generic — we don't want to ship parse internals to clients.
 */
function shapeError(
  friendly: string,
  issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>,
): { ok: false; error: string } {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return { ok: false, error: friendly };
  // Compact `[path → message]` form, easy to read in DevTools.
  const detail = issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return { ok: false, error: detail ? `${friendly} [${detail}]` : friendly };
}

/**
 * The model sometimes wraps the JSON in ```json ... ``` fences or
 * prefixes it with commentary. Strip the most common wrappers before
 * parsing.
 */
function extractJson(text: string): unknown {
  let t = text.trim();
  // Strip ```json ... ``` fences.
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  // Find the first '{' and the last '}' and parse that substring.
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    t = t.slice(start, end + 1);
  }
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/**
 * Drop any change entries that don't validate against the actual body
 * we sent to the model. The renderer is fine with an empty array —
 * the diff still renders from `revisedBody` (we compute it ourselves
 * via jsdiff on the client).
 *
 * Returns the cleaned array, or `[]` if anything looks wrong.
 */
function sanitiseChanges(
  raw: ReadonlyArray<{
    start: number;
    end: number;
    newText: string;
    explanation?: string;
  }>,
  bodyMd: string,
  revisedBody: string,
): Array<{
  start: number;
  end: number;
  newText: string;
  explanation?: string;
}> {
  if (raw.length === 0) return [];

  const cleaned: Array<{
    start: number;
    end: number;
    newText: string;
    explanation?: string;
  }> = [];
  let cursor = 0;

  // Sort defensively — model is told to sort, but trust nothing.
  const sorted = [...raw].sort((a, b) => a.start - b.start);

  for (const c of sorted) {
    // In-bounds, non-empty, ascending, non-overlapping.
    if (
      !Number.isFinite(c.start) ||
      !Number.isFinite(c.end) ||
      c.start < 0 ||
      c.end <= c.start ||
      c.start > bodyMd.length ||
      c.end > bodyMd.length ||
      c.start < cursor
    ) {
      return []; // bail; renderer falls back to plain body comparison
    }
    cleaned.push({ ...c });
    cursor = c.end;
  }

  // The model promises: applying changes in order reproduces
  // `revisedBody`. Verify cheaply — single string concat, O(n).
  let rebuilt = "";
  cursor = 0;
  for (const c of cleaned) {
    rebuilt += bodyMd.slice(cursor, c.start) + c.newText;
    cursor = c.end;
  }
  rebuilt += bodyMd.slice(cursor);
  if (rebuilt !== revisedBody) {
    // Length mismatch or content mismatch — bail.
    return [];
  }

  return cleaned;
}