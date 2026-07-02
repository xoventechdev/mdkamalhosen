import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connect, AiSettingsModel, AI_SETTINGS_ID } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { take } from "@/lib/auth-rate-limit";
import { decryptSecret } from "@/lib/crypto-secret";
import { callChat, AiError } from "@/lib/ai/client";
import {
  aiReviewSuggestionSchema,
  aiTitlesSchema,
  aiSeoSchema,
  type AiProviderId,
} from "@/lib/schemas";

export const runtime = "nodejs";

const requestSchema = z.object({
  mode: z.enum(["review", "titles", "seo"]),
  bodyMd: z.string().min(1).max(50_000),
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
Your job is to find concrete, actionable grammar, clarity, and style issues.

Return ONLY valid JSON in this exact shape (no commentary, no markdown fences):
{
  "suggestions": [
    {
      "id": "<short slug, e.g. s1>",
      "original": "<the EXACT substring from the article body>",
      "replacement": "<the rewritten substring>",
      "rationale": "<one short sentence explaining the fix>",
      "severity": "grammar" | "clarity" | "style"
    }
  ]
}

Rules:
- Only include suggestions where the rewrite is genuinely better.
- Each \`original\` MUST appear verbatim somewhere in the article body — the client uses string match to locate it.
- Prefer short, surgical edits over rewriting whole sentences.
- Do NOT change the author's voice or terminology.
- Do NOT include any suggestions about formatting / structure — only language.
- If the article is already clean, return {"suggestions": []}.
- Limit yourself to at most 25 suggestions.
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

/**
 * POST /api/admin/ai/review
 *
 * Body: { mode, bodyMd, currentTitle?, currentExcerpt?, currentMeta? }
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

  const { mode, bodyMd, currentTitle, currentExcerpt, currentMeta } =
    parsed.data;

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
    const model = doc.model;

    // --- Build prompt based on mode ---
    let systemPrompt: string;
    let userPrompt: string;
    if (mode === "review") {
      systemPrompt = SYSTEM_REVIEW;
      userPrompt = `Review the following Markdown article body for grammar, clarity, and style issues. Return JSON only.\n\n---\n${bodyMd}`;
    } else if (mode === "titles") {
      systemPrompt = SYSTEM_TITLES;
      userPrompt = `Write a title and excerpt for the article below.${currentTitle ? ` The current title is "${currentTitle}".` : ""}${currentExcerpt ? ` The current excerpt is "${currentExcerpt}".` : ""}\n\n---\n${bodyMd}`;
    } else {
      systemPrompt = SYSTEM_SEO;
      userPrompt = `Write a meta description for the article below.${currentMeta ? ` The current meta description is "${currentMeta}".` : ""}\n\n---\n${bodyMd}`;
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

    // --- Parse + validate response shape ---
    const json = extractJson(result.text);
    if (mode === "review") {
      const validated = aiReviewSuggestionSchema.safeParse(json);
      if (!validated.success) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Model returned a response in the wrong shape. Try again or pick a different model.",
          },
          { status: 502 },
        );
      }
      // Filter: drop any suggestion whose `original` doesn't actually
      // appear in the body — this prevents broken "apply" buttons.
      validated.data.suggestions = validated.data.suggestions.filter((s) =>
        bodyMd.includes(s.original),
      );
      return NextResponse.json({ ok: true, ...validated.data });
    }
    if (mode === "titles") {
      const validated = aiTitlesSchema.safeParse(json);
      if (!validated.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "Model returned a title/excerpt in the wrong shape.",
          },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, ...validated.data });
    }
    // mode === "seo"
    const validated = aiSeoSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Model returned a meta description in the wrong shape.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, ...validated.data });
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