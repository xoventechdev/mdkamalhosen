"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  profileSchema,
  experienceSchema,
  educationSchema,
  certificationSchema,
  skillGroupSchema,
  skillSchema,
  projectSchema,
  blogPostSchema,
  blogTagSchema,
  messageUpdateSchema,
  reorderSchema,
  type ActionResult,
  type ReorderEntity,
} from "@/lib/schemas";
import { slugify, readingMinutes } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EntityName =
  | "profile"
  | "experience"
  | "education"
  | "certification"
  | "skillGroup"
  | "skill"
  | "project"
  | "blogPost"
  | "blogTag"
  | "message";

function entityTag(name: EntityName): string {
  // Match the tags used by src/server/queries.ts for the public site.
  const map: Record<EntityName, string> = {
    profile: "profile",
    experience: "experiences",
    education: "education",
    certification: "certifications",
    skillGroup: "skills",
    skill: "skills",
    project: "projects",
    blogPost: "blog",
    blogTag: "blog",
    message: "blog", // messages share the revalidation flow (no public tag)
  };
  return map[name];
}

function entityPath(name: EntityName): string[] {
  const map: Record<EntityName, string[]> = {
    profile: ["/", "/about", "/contact", "/cv"],
    experience: ["/experience"],
    education: ["/cv", "/about"],
    certification: ["/cv", "/about"],
    skillGroup: ["/skills", "/about"],
    skill: ["/skills", "/about"],
    project: ["/", "/projects"],
    blogPost: ["/", "/blog", "/sitemap.xml"],
    blogTag: ["/blog"],
    message: [],
  };
  return map[name];
}

async function revalidateEntity(name: EntityName) {
  revalidateTag(entityTag(name));
  for (const path of entityPath(name)) {
    revalidatePath(path);
  }
}

async function logActivity(
  userEmail: string,
  action: "created" | "updated" | "deleted",
  entity: string,
  entityId?: number,
  meta?: Record<string, unknown>,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userEmail,
        action,
        entity,
        entityId,
        meta: meta ? (meta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch {
    // Activity log is best-effort; never block the primary action.
  }
}

function ok<T = void>(data?: T, id?: number): ActionResult<T> {
  return { ok: true, data: data as T, id };
}

function fail(error: unknown): ActionResult<never> {
  let message: string;
  if (isZodError(error)) {
    message = formatZod(error);
  } else if (error instanceof Error) {
    message = humanizePrisma(error);
  } else {
    message = "Unexpected error.";
  }
  return { ok: false, error: message };
}

function humanizePrisma(err: Error): string {
  const code = (err as { code?: string }).code;
  if (code === "P2002") {
    return "That value is already taken (duplicate slug or natural key).";
  }
  if (code === "P2025") {
    return "Record not found.";
  }
  return err.message || "Database error.";
}

function isZodError(e: unknown): e is { issues: Array<{ path: (string | number)[]; message: string }> } {
  return (
    typeof e === "object" &&
    e !== null &&
    "issues" in e &&
    Array.isArray((e as { issues?: unknown }).issues)
  );
}

function formatZod(err: { issues: Array<{ path: (string | number)[]; message: string }> }): string {
  const first = err.issues[0];
  if (!first) return "Invalid input.";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function upsertProfile(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);

  try {
    const data = parsed.data;
    const row = await prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    await revalidateEntity("profile");
    await logActivity(email, "updated", "profile", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------
async function bumpSortOrder(
  entity: "experience" | "education" | "certification" | "project",
): Promise<number> {
  let max: { sortOrder: number } | null = null;
  if (entity === "experience") {
    max = await prisma.experience.findFirst({ orderBy: { sortOrder: "desc" } });
  } else if (entity === "education") {
    max = await prisma.education.findFirst({ orderBy: { sortOrder: "desc" } });
  } else if (entity === "certification") {
    max = await prisma.certification.findFirst({ orderBy: { sortOrder: "desc" } });
  } else {
    max = await prisma.project.findFirst({ orderBy: { sortOrder: "desc" } });
  }
  return (max?.sortOrder ?? 0) + 1;
}

export async function createExperience(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = experienceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("experience"));
    const { id: _ignored, ...payload } = data;
    void _ignored;
    const row = await prisma.experience.create({
      data: { ...payload, sortOrder },
    });
    await revalidateEntity("experience");
    await logActivity(email, "created", "experience", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateExperience(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = experienceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const { id, ...rest } = parsed.data;
    // Convert empty endDate string to null; current=true means null.
    const data: Record<string, unknown> = { ...rest };
    if (rest.current) data.endDate = null;
    const row = await prisma.experience.update({ where: { id }, data });
    await revalidateEntity("experience");
    await logActivity(email, "updated", "experience", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteExperience(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.experience.delete({ where: { id } });
    await revalidateEntity("experience");
    await logActivity(email, "deleted", "experience", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------
export async function createEducation(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = educationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("education"));
    const { id: _ignored, ...payload } = data;
    void _ignored;
    const row = await prisma.education.create({ data: { ...payload, sortOrder } });
    await revalidateEntity("education");
    await logActivity(email, "created", "education", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateEducation(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = educationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const { id, ...rest } = parsed.data;
    const row = await prisma.education.update({ where: { id }, data: rest });
    await revalidateEntity("education");
    await logActivity(email, "updated", "education", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEducation(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.education.delete({ where: { id } });
    await revalidateEntity("education");
    await logActivity(email, "deleted", "education", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------
export async function createCertification(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = certificationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("certification"));
    const { id: _ignored, ...payload } = data;
    void _ignored;
    const row = await prisma.certification.create({ data: { ...payload, sortOrder } });
    await revalidateEntity("certification");
    await logActivity(email, "created", "certification", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateCertification(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = certificationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const { id, ...rest } = parsed.data;
    const row = await prisma.certification.update({ where: { id }, data: rest });
    await revalidateEntity("certification");
    await logActivity(email, "updated", "certification", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCertification(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.certification.delete({ where: { id } });
    await revalidateEntity("certification");
    await logActivity(email, "deleted", "certification", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Skill groups + skills
// ---------------------------------------------------------------------------
export async function createSkillGroup(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillGroupSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const row = await prisma.skillGroup.create({ data: parsed.data });
    await revalidateEntity("skillGroup");
    await logActivity(email, "created", "skillGroup", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateSkillGroup(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillGroupSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const { id, ...rest } = parsed.data;
    const row = await prisma.skillGroup.update({ where: { id }, data: rest });
    await revalidateEntity("skillGroup");
    await logActivity(email, "updated", "skillGroup", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSkillGroup(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.skillGroup.delete({ where: { id } });
    await revalidateEntity("skillGroup");
    await logActivity(email, "deleted", "skillGroup", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function createSkill(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const row = await prisma.skill.create({ data: parsed.data });
    await revalidateEntity("skill");
    await logActivity(email, "created", "skill", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateSkill(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const { id, ...rest } = parsed.data;
    const row = await prisma.skill.update({ where: { id }, data: rest });
    await revalidateEntity("skill");
    await logActivity(email, "updated", "skill", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSkill(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.skill.delete({ where: { id } });
    await revalidateEntity("skill");
    await logActivity(email, "deleted", "skill", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
export async function createProject(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const sortOrder = data.sortOrder || (await bumpSortOrder("project"));
    const { id: _ignored, links, ...rest } = data;
    void _ignored;
    const row = await prisma.project.create({
      data: {
        ...rest,
        sortOrder,
        links: links ?? Prisma.JsonNull,
      },
    });
    await revalidateEntity("project");
    if (data.featured) revalidateTag("projects-featured");
    await logActivity(email, "created", "project", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateProject(raw: unknown): Promise<ActionResult<{ id: number; featuredCount: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id, links, ...rest } = data;
    const wasFeatured = await prisma.project.findUnique({ where: { id }, select: { featured: true } });
    const row = await prisma.project.update({
      where: { id },
      data: {
        ...rest,
        links: links === null || links === undefined ? Prisma.JsonNull : (links as Prisma.InputJsonValue),
      },
    });
    const featuredCount = await prisma.project.count({
      where: { featured: true, status: "published" },
    });
    await revalidateEntity("project");
    if (rest.featured || wasFeatured?.featured) revalidateTag("projects-featured");
    await logActivity(email, "updated", "project", id);
    return ok({ id: row.id, featuredCount }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    const wasFeatured = await prisma.project.findUnique({ where: { id }, select: { featured: true } });
    await prisma.project.delete({ where: { id } });
    await revalidateEntity("project");
    if (wasFeatured?.featured) revalidateTag("projects-featured");
    await logActivity(email, "deleted", "project", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Blog post + tag
// ---------------------------------------------------------------------------
export async function createBlogPost(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id: _ignored, tagIds, publishedAt, ...rest } = data;
    void _ignored;
    const publishedAtDate =
      rest.status === "published"
        ? publishedAt
          ? new Date(publishedAt)
          : new Date()
        : null;
    const row = await prisma.blogPost.create({
      data: {
        ...rest,
        readingMinutes: rest.readingMinutes || readingMinutes(rest.bodyMd),
        publishedAt: publishedAtDate,
        tags: { connect: tagIds.map((tagId) => ({ id: tagId })) },
      },
    });
    await revalidateEntity("blogPost");
    await logActivity(email, "created", "blogPost", row.id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateBlogPost(raw: unknown): Promise<ActionResult<{ id: number }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  if (!parsed.data.id) return fail(new Error("id is required"));
  try {
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id, tagIds, publishedAt, ...rest } = data;
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
    const publishedAtDate =
      rest.status === "published"
        ? publishedAt
          ? new Date(publishedAt)
          : existing?.publishedAt ?? new Date()
        : null;
    const row = await prisma.blogPost.update({
      where: { id },
      data: {
        ...rest,
        readingMinutes: rest.readingMinutes || readingMinutes(rest.bodyMd),
        publishedAt: publishedAtDate,
        tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
      },
    });
    await revalidateEntity("blogPost");
    await logActivity(email, "updated", "blogPost", id);
    return ok({ id: row.id }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBlogPost(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.blogPost.delete({ where: { id } });
    await revalidateEntity("blogPost");
    await logActivity(email, "deleted", "blogPost", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function createBlogTag(raw: unknown): Promise<ActionResult<{ id: number; slug: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = blogTagSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const data = parsed.data;
    const slug = data.slug || slugify(data.name);
    const row = await prisma.blogTag.upsert({
      where: { slug },
      create: { name: data.name, slug },
      update: { name: data.name },
    });
    await revalidateEntity("blogTag");
    await logActivity(email, "created", "blogTag", row.id);
    return ok({ id: row.id, slug: row.slug }, row.id);
  } catch (e) {
    return fail(e);
  }
}

export async function attachTagsToPost(
  postId: number,
  tagIds: number[],
): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.blogPost.update({
      where: { id: postId },
      data: { tags: { set: tagIds.map((id) => ({ id })) } },
    });
    await revalidateEntity("blogPost");
    await logActivity(email, "updated", "blogPost", postId);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export async function markMessageRead(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.message.update({ where: { id }, data: { readAt: new Date() } });
    await logActivity(email, "updated", "message", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function markMessageUnread(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.message.update({ where: { id }, data: { readAt: null } });
    await logActivity(email, "updated", "message", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function markMessageArchived(id: number, archived: boolean): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.message.update({ where: { id }, data: { archived } });
    await logActivity(email, "updated", "message", id, { archived });
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMessage(id: number): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await prisma.message.delete({ where: { id } });
    await logActivity(email, "deleted", "message", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Reorder (swaps sortOrder with neighbour)
// ---------------------------------------------------------------------------
export async function reorder(raw: unknown): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = reorderSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    const { entity, id, direction } = parsed.data;
    await swapSortOrder(entity, id, direction);
    const map: Record<ReorderEntity, EntityName> = {
      experience: "experience",
      education: "education",
      certification: "certification",
      skillGroup: "skillGroup",
      skill: "skill",
      project: "project",
      blogPost: "blogPost",
    };
    await revalidateEntity(map[entity]);
    await logActivity(email, "updated", entity, id, { direction });
    return ok();
  } catch (e) {
    return fail(e);
  }
}

async function swapSortOrder(
  entity: ReorderEntity,
  id: number,
  direction: "up" | "down",
) {
  // For "skill" the natural order is within a group.
  // For everything else it's global.
  const orderBy = [{ sortOrder: "asc" as const }, { id: "asc" as const }];

  type SortableRow = { id: number; sortOrder: number };
  let rows: SortableRow[] = [];

  if (entity === "experience") {
    rows = await prisma.experience.findMany({ orderBy, select: { id: true, sortOrder: true } });
  } else if (entity === "education") {
    rows = await prisma.education.findMany({ orderBy, select: { id: true, sortOrder: true } });
  } else if (entity === "certification") {
    rows = await prisma.certification.findMany({ orderBy, select: { id: true, sortOrder: true } });
  } else if (entity === "project") {
    rows = await prisma.project.findMany({ orderBy, select: { id: true, sortOrder: true } });
  } else if (entity === "blogPost") {
    // BlogPost has no sortOrder; reordering falls back to createdAt.
    const byCreated = await prisma.blogPost.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const idx = byCreated.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= byCreated.length) return;
    // No-op swap: order by createdAt cannot be cheaply rearranged.
    return;
  } else if (entity === "skillGroup") {
    rows = await prisma.skillGroup.findMany({ orderBy, select: { id: true, sortOrder: true } });
  } else {
    // skill: scoped to its group
    const target = await prisma.skill.findUnique({ where: { id }, select: { groupId: true } });
    if (!target) return;
    rows = await prisma.skill.findMany({
      where: { groupId: target.groupId },
      orderBy,
      select: { id: true, sortOrder: true },
    });
  }

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[swapIdx]!;

  if (entity === "experience") {
    await prisma.$transaction([
      prisma.experience.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.experience.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (entity === "education") {
    await prisma.$transaction([
      prisma.education.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.education.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (entity === "certification") {
    await prisma.$transaction([
      prisma.certification.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.certification.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (entity === "project") {
    await prisma.$transaction([
      prisma.project.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.project.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (entity === "skillGroup") {
    await prisma.$transaction([
      prisma.skillGroup.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.skillGroup.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (entity === "skill") {
    await prisma.$transaction([
      prisma.skill.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.skill.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  }
}

// ---------------------------------------------------------------------------
// Revalidate all
// ---------------------------------------------------------------------------
export async function revalidateAll(): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    const tags = [
      "profile",
      "experiences",
      "education",
      "certifications",
      "skills",
      "projects",
      "projects-featured",
      "blog",
    ];
    for (const tag of tags) revalidateTag(tag);
    revalidatePath("/", "layout");
    await logActivity(email, "updated", "system", undefined, { action: "revalidateAll" });
    return ok();
  } catch (e) {
    return fail(e);
  }
}
