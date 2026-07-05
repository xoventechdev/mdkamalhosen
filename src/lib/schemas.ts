import { z } from "zod";

// All schemas share: trim, no empty strings, safe defaults. The server is
// the source of truth; client-side form validation is for UX only.
//
// After the Mongo migration primary keys are ObjectId strings. Schemas that
// accept an `id` therefore validate it as a non-empty string instead of
// coercing a number — this keeps the form layer's `<input name="id">`
// unchanged while allowing ObjectIds to flow through untouched.

const trimmedString = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(max));

const optionalString = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(max))
    .optional()
    .or(z.literal("").transform(() => undefined));

const dateInput = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((s) => (s === "" || s == null ? null : s))
  .pipe(z.string().nullable());

const requiredDateInput = z
  .string()
  .min(1, "Required")
  .regex(/^\d{4}-\d{2}-\d{2}/, "Use YYYY-MM-DD");

const intFromString = z.coerce.number().int();

/**
 * ObjectId string id: a 24-char hex string. Optional in create schemas,
 * required in update schemas. We keep the validation lax (any non-empty
 * string up to 64 chars) to allow human-readable slugs or whatever shape
 * the id is in, while still rejecting obvious garbage.
 */
const objectIdLike = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid id");

const idInput = objectIdLike.optional();
const idInputRequired = objectIdLike;

// ---------------------------------------------------------------------------
// Profile (singleton)
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  name: trimmedString(120),
  role: trimmedString(160),
  tagline: trimmedString(240),
  location: trimmedString(120),
  relocate: z.boolean().default(true),
  lookingToNewOpportunity: z.boolean().default(true),
  email: z.string().email().max(200),
  phone: optionalString(40),
  linkedinUrl: optionalString(300),
  githubUrl: optionalString(300),
  whatsapp: optionalString(40),
  summary: trimmedString(2000),
  mission: trimmedString(1000),
  values: z.array(trimmedString(200)).default([]),
  availability: z.enum(["open", "limited", "closed"]).default("open"),
  avatarUrl: optionalString(500),
  cvPdfUrl: optionalString(500),
  // Marketing
  highlights: z
    .array(
      z.object({
        text: trimmedString(80),
        jobSeekingOnly: z.boolean().default(false),
      }),
    )
    .default([]),
  preferredLocations: z.array(trimmedString(80)).default([]),
  // Site-wide metadata — optional, with safe fallbacks at the read site
  siteTitle: optionalString(120),
  siteDescription: optionalString(500),
  siteKeywords: z.array(trimmedString(80)).default([]),
  twitterHandle: optionalString(40),
  // Stats grid
  stats: z
    .array(
      z.object({
        value: trimmedString(40),
        label: trimmedString(120),
        color: optionalString(60),
      }),
    )
    .default([]),
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileOutput = z.output<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------
export const experienceSchema = z
  .object({
    id: idInput,
    company: trimmedString(160),
    role: trimmedString(160),
    country: trimmedString(80),
    city: optionalString(80),
    startDate: requiredDateInput,
    endDate: dateInput,
    current: z.boolean().default(false),
    bullets: z.array(trimmedString(400)).default([]),
    stack: z.array(trimmedString(80)).default([]),
    marqueeProject: optionalString(160),
    sortOrder: intFromString.default(0),
  })
  .refine(
    (data) => data.current || !data.endDate || (data.startDate && data.endDate && data.endDate >= data.startDate),
    { message: "End date must be on or after start date", path: ["endDate"] },
  );
export type ExperienceInput = z.input<typeof experienceSchema>;
export type ExperienceOutput = z.output<typeof experienceSchema>;

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------
export const educationSchema = z.object({
  id: idInput,
  degree: trimmedString(200),
  institution: trimmedString(200),
  startYear: intFromString.min(1950).max(2100),
  endYear: intFromString.min(1950).max(2100).optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["ongoing", "completed"]).default("completed"),
  sortOrder: intFromString.default(0),
});
export type EducationInput = z.input<typeof educationSchema>;
export type EducationOutput = z.output<typeof educationSchema>;

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------
export const certificationSchema = z.object({
  id: idInput,
  name: trimmedString(200),
  issuer: trimmedString(200),
  year: intFromString.min(1980).max(2100).optional().or(z.literal("").transform(() => undefined)),
  credentialUrl: optionalString(500),
  sortOrder: intFromString.default(0),
});
export type CertificationInput = z.input<typeof certificationSchema>;
export type CertificationOutput = z.output<typeof certificationSchema>;

// ---------------------------------------------------------------------------
// Skill groups + skills
// ---------------------------------------------------------------------------
export const skillGroupSchema = z.object({
  id: idInput,
  name: trimmedString(80),
  sortOrder: intFromString.default(0),
});
export type SkillGroupInput = z.input<typeof skillGroupSchema>;
export type SkillGroupOutput = z.output<typeof skillGroupSchema>;

export const skillSchema = z.object({
  id: idInput,
  groupId: idInputRequired,
  name: trimmedString(80),
  platform: optionalString(80),
  years: intFromString.min(0).max(80).optional().or(z.literal("").transform(() => undefined)),
  level: intFromString.min(1).max(5).default(3),
  sortOrder: intFromString.default(0),
});
export type SkillInput = z.input<typeof skillSchema>;
export type SkillOutput = z.output<typeof skillSchema>;

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
export const projectSchema = z.object({
  id: idInput,
  slug: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Lowercase letters, numbers, and dashes only"),
    ),
  title: trimmedString(200),
  category: z.enum(["bms", "software", "iot", "android"]).default("bms"),
  // Free-form year label. Accepts values like "2024", "2024 - 2026", or
  // "2025 - Present". Single 4-digit years remain valid as strings
  // ("2024") so existing data renders unchanged. Validated only for
  // length — the admin form suggests formats via a hint.
  year: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Year is required").max(40)),
  clientType: optionalString(120),
  excerpt: trimmedString(280),
  coverUrl: optionalString(500),
  problem: optionalString(2000),
  role: optionalString(200),
  techStack: z.array(trimmedString(60)).default([]),
  challenges: optionalString(2000),
  solution: optionalString(2000),
  outcome: optionalString(2000),
  lessons: optionalString(2000),
  galleryImages: z.array(z.string().max(500)).default([]),
  links: z
    .object({
      live: z.string().url().optional().or(z.literal("")),
      github: z.string().url().optional().or(z.literal("")),
      pdf: z.string().url().optional().or(z.literal("")),
    })
    .partial()
    .optional()
    .nullable(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  sortOrder: intFromString.default(0),
});
export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectOutput = z.output<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Blog post + tag
// ---------------------------------------------------------------------------
export const blogPostSchema = z.object({
  id: idInput,
  slug: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1)
        .max(160)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Lowercase letters, numbers, and dashes only"),
    ),
  title: trimmedString(200),
  excerpt: optionalString(400),
  coverUrl: optionalString(500),
  bodyMd: z.string().max(120_000).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: dateInput,
  readingMinutes: intFromString.min(1).max(120).default(1),
  metaDescription: optionalString(400),
  tagIds: z.array(objectIdLike).default([]),
});
export type BlogPostInput = z.input<typeof blogPostSchema>;
export type BlogPostOutput = z.output<typeof blogPostSchema>;

export const blogTagSchema = z.object({
  id: idInput,
  name: trimmedString(60),
  slug: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1)
        .max(60)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    ),
});
export type BlogTagInput = z.input<typeof blogTagSchema>;
export type BlogTagOutput = z.output<typeof blogTagSchema>;

// ---------------------------------------------------------------------------
// Message (admin-side updates only)
// ---------------------------------------------------------------------------
export const messageUpdateSchema = z.object({
  id: objectIdLike,
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export type MessageUpdateInput = z.input<typeof messageUpdateSchema>;

// ---------------------------------------------------------------------------
// Comments (public submit + admin moderation)
// ---------------------------------------------------------------------------

/**
 * Public submission schema. Honeypot field `_hp` must remain empty —
 * real users do not see the input but bots fill every visible field.
 *
 * `postId` is required, not optional — the public POST handler reads
 * the active post from this single token. `parentId` enables one-level
 * threading (a top-level comment id only; replies cannot themselves be
 * replied to).
 */
export const commentCreateSchema = z.object({
  postId: objectIdLike,
  parentId: objectIdLike.optional().nullable(),
  authorName: trimmedString(80),
  authorEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email.")
    .max(254),
  body: trimmedString(2000),
  // Honeypot — kept as an optional string and validated empty.
  _hp: z.string().max(0).optional().default(""),
});
export type CommentCreateInput = z.input<typeof commentCreateSchema>;

/** Admin reply to an approved top-level comment. Skips moderation. */
export const commentReplySchema = z.object({
  parentId: objectIdLike,
  body: trimmedString(2000),
});
export type CommentReplyInput = z.input<typeof commentReplySchema>;

/** Wrap a single id into the standard `{ id }` envelope used by actions. */
export const commentIdSchema = z.object({ id: objectIdLike });
export type CommentIdInput = z.input<typeof commentIdSchema>;

/** Per-post comments-enabled toggle. */
export const setPostCommentsEnabledSchema = z.object({
  postId: objectIdLike,
  enabled: z.boolean(),
});
export type SetPostCommentsEnabledInput = z.input<typeof setPostCommentsEnabledSchema>;

// ---------------------------------------------------------------------------
// Reorder
// ---------------------------------------------------------------------------
export const reorderEntity = z.enum([
  "experience",
  "education",
  "certification",
  "skillGroup",
  "skill",
  "project",
  "blogPost",
]);
export type ReorderEntity = z.infer<typeof reorderEntity>;

export const reorderSchema = z.object({
  entity: reorderEntity,
  id: objectIdLike,
  direction: z.enum(["up", "down"]),
});
export type ReorderInput = z.input<typeof reorderSchema>;

// ---------------------------------------------------------------------------
// Action result helper type
// ---------------------------------------------------------------------------
export type ActionResult<T = void> =
  | { ok: true; data: T; id?: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// AI settings (admin → blog editor review + title/excerpt/SEO suggestions)
// ---------------------------------------------------------------------------

export const AI_PROVIDER_IDS = ["openai", "anthropic", "google", "openrouter"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

/** Curated default model lists per provider. Admins can override. */
export const AI_DEFAULT_MODELS: Record<AiProviderId, readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
  google: ["gemini-1.5-pro", "gemini-1.5-flash"],
  openrouter: [
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-flash-1.5",
  ],
};

/**
 * Schema for the Settings form. The apiKey field is plaintext on the wire
 * (server action receives it from the form) — it's encrypted at rest by
 * the action before being written to the database.
 */
export const aiSettingsSchema = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  model: z.string().trim().min(1, "Model is required.").max(200),
  /**
   * Optional cheaper model used for structured tasks (summary, titles,
   * SEO meta). Falls back to `model` when empty. Stored as a plain
   * string — we don't pin to a curated list so new releases "just work".
   */
  cheaperModel: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((s) => (s ? s : undefined)),
  apiKey: z
    .string()
    .min(1, "API key is required.")
    .max(500, "API key is too long."),
  enabled: z.boolean().default(true),
});
export type AiSettingsInput = z.input<typeof aiSettingsSchema>;
export type AiSettingsOutput = z.output<typeof aiSettingsSchema>;

/**
 * Response shape from the AI review API. The review mode now returns a
 * full revised body plus a sparse change list — the editor renders an
 * inline diff and lets the user accept the whole revision or keep the
 * original. This replaced the previous "25 surgical suggestions"
 * shape, which required brittle substring matching and 25 clicks.
 *
 * Validated before we trust it (the model can occasionally produce
 * malformed JSON or add commentary — we strip everything except the
 * schema on the route side).
 */
export const aiReviewRevisionSchema = z.object({
  /**
   * The complete revised body, same Markdown structure as the input.
   * Replaces `bodyMd` when the user clicks "Take AI".
   */
  revisedBody: z.string().min(1).max(60_000),
  /**
   * 1–3 sentence explanation of what changed and why. Shown above
   * the diff. Empty string is OK if the model produced no rationale.
   */
  rationale: z.string().max(1_000).default(""),
  /**
   * Sparse change list for highlighting only — NOT applied
   * individually. Coordinates are character indices into the
   * ORIGINAL body (the editor body, not `revisedBody`). The
   * highlight renderer recomputes the diff itself; this field is
   * for in-column tooltips.
   */
  changes: z
    .array(
      z.object({
        /** 0-based character index into the original body, inclusive. */
        start: z.number().int().min(0),
        /** 0-based character index into the original body, exclusive. */
        end: z.number().int().min(0),
        /** What the model replaced this span with. */
        newText: z.string().max(2_000),
        /** One-sentence per-change explanation. Optional. */
        explanation: z.string().max(300).optional(),
      }),
    )
    .max(100),
});
export type AiReviewRevision = z.output<typeof aiReviewRevisionSchema>;

export const aiTitlesSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
});
export type AiTitlesResult = z.output<typeof aiTitlesSchema>;

export const aiSeoSchema = z.object({
  // SEO meta descriptions are typically 110–155 chars (Google's pixel
  // budget), but models — especially on short posts — frequently
  // return 60–110 char descriptions that are still useful. Accept
  // anything from 30 chars upward; the route can clamp or warn on
  // the very-short end if we ever care.
  metaDescription: z.string().min(30).max(200),
});
export type AiSeoResult = z.output<typeof aiSeoSchema>;

/**
 * Tag suggestions for a blog post. The route validates a list of
 * normalised tags (lowercase, hyphen-separated, 1-30 chars) which the
 * client can either select directly (if the tag already exists) or
 * create via the existing `createBlogTag` server action.
 */
export const aiTagsSchema = z.object({
  suggestedTags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(30)
        .transform((s) => s.toLowerCase().replace(/\s+/g, "-")),
    )
    .min(1)
    .max(5),
});
export type AiTagsResult = z.output<typeof aiTagsSchema>;
