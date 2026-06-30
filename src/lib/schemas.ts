import { z } from "zod";

// All schemas share: trim, no empty strings, safe defaults. The server is
// the source of truth; client-side form validation is for UX only.

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
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Use YYYY-MM-DD")
  .or(z.literal(""))
  .transform((s) => (s === "" ? null : s));

const requiredDateInput = z
  .string()
  .min(1, "Required")
  .regex(/^\d{4}-\d{2}-\d{2}/, "Use YYYY-MM-DD");

const intFromString = z.coerce.number().int();

// ---------------------------------------------------------------------------
// Profile (singleton)
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  name: trimmedString(120),
  role: trimmedString(160),
  tagline: trimmedString(240),
  location: trimmedString(120),
  relocate: z.boolean().default(true),
  email: z.string().email().max(200),
  phone: optionalString(40),
  linkedinUrl: optionalString(300),
  githubUrl: optionalString(300),
  whatsapp: optionalString(40),
  summary: trimmedString(2000),
  mission: trimmedString(1000),
  philosophy: trimmedString(2000),
  values: z.array(trimmedString(200)).default([]),
  availability: z.enum(["open", "limited", "closed"]).default("open"),
  avatarUrl: optionalString(500),
  cvPdfUrl: optionalString(500),
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileOutput = z.output<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------
export const experienceSchema = z
  .object({
    id: z.number().int().optional(),
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
  id: z.number().int().optional(),
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
  id: z.number().int().optional(),
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
  id: z.number().int().optional(),
  name: trimmedString(80),
  sortOrder: intFromString.default(0),
});
export type SkillGroupInput = z.input<typeof skillGroupSchema>;
export type SkillGroupOutput = z.output<typeof skillGroupSchema>;

export const skillSchema = z.object({
  id: z.number().int().optional(),
  groupId: intFromString,
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
  id: z.number().int().optional(),
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
  year: intFromString.min(1990).max(2100),
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
  id: z.number().int().optional(),
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
  tagIds: z.array(intFromString).default([]),
});
export type BlogPostInput = z.input<typeof blogPostSchema>;
export type BlogPostOutput = z.output<typeof blogPostSchema>;

export const blogTagSchema = z.object({
  id: z.number().int().optional(),
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
  id: intFromString,
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export type MessageUpdateInput = z.input<typeof messageUpdateSchema>;

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
  id: intFromString,
  direction: z.enum(["up", "down"]),
});
export type ReorderInput = z.input<typeof reorderSchema>;

// ---------------------------------------------------------------------------
// Action result helper type
// ---------------------------------------------------------------------------
export type ActionResult<T = void> =
  | { ok: true; data: T; id?: number }
  | { ok: false; error: string };
