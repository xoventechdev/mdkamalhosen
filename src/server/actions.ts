"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Types } from "mongoose";
import {
  connect,
  ProfileModel,
  PROFILE_ID,
  ExperienceModel,
  EducationModel,
  CertificationModel,
  SkillGroupModel,
  SkillModel,
  ProjectModel,
  BlogPostModel,
  BlogTagModel,
  MessageModel,
  CommentModel,
  ActivityLogModel,
} from "@/lib/db";
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
  commentReplySchema,
  commentIdSchema,
  setPostCommentsEnabledSchema,
  reorderSchema,
  type ActionResult,
  type ReorderEntity,
} from "@/lib/schemas";
import { slugify, readingMinutes } from "@/lib/utils";
import { sendEmail } from "@/lib/mail";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
//
// All primary keys are ObjectId strings (e.g. "507f1f77bcf86cd799439011").
// The Profile singleton has a fixed id — see lib/db/models/profile.model.ts.
// We re-export it here so internal references stay readable.
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
  | "message"
  | "comment";

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
    comment: "comments",
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
    comment: ["/blog", "/sitemap.xml"],
  };
  return map[name];
}

async function revalidateEntity(name: EntityName) {
  revalidateTag(entityTag(name));
  for (const path of entityPath(name)) {
    revalidatePath(path);
  }
}

/**
 * Mongoose's duplicate-key error carries a different shape than Prisma's
 * (code 11000, not P2002). Map it to the same human-friendly message the
 * legacy UI expected.
 */
function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

async function logActivity(
  userEmail: string,
  action: "created" | "updated" | "deleted",
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await connect();
    await ActivityLogModel.create({
      userEmail,
      action,
      entity,
      entityId,
      meta: meta ?? null,
    });
  } catch {
    // Activity log is best-effort; never block the primary action.
  }
}

function ok<T = void>(data?: T, id?: string): ActionResult<T> {
  return { ok: true, data: data as T, id };
}

function fail(error: unknown): ActionResult<never> {
  let message: string;
  if (isZodError(error)) {
    message = formatZod(error);
  } else if (isDuplicateKey(error)) {
    message = "That value is already taken (duplicate slug or natural key).";
  } else if (error instanceof Error) {
    message = error.message || "Database error.";
  } else {
    message = "Unexpected error.";
  }
  return { ok: false, error: message };
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

/**
 * Coerce a parsed schema payload to its persisted shape. Currently used to
 * convert YYYY-MM-DD strings into JS Dates and tagIds strings into ObjectIds.
 */
function toObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.map((id) => new Types.ObjectId(id));
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function upsertProfile(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);

  try {
    await connect();
    const data = parsed.data;
    const row = await ProfileModel.findByIdAndUpdate(
      PROFILE_ID,
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const id = row?._id.toString() ?? PROFILE_ID.toString();
    await revalidateEntity("profile");
    await logActivity(email, "updated", "profile", id);
    return ok({ id }, id);
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
  await connect();
  // Use the $max approach: each collection carries a sortOrder. We find the
  // current top so a new row can land at max+1. Each Model's document type
  // differs, so we cast to a uniform `{ sortOrder: number } | null` shape.
  const filter = {} as Record<string, unknown>;
  const sort = { sortOrder: -1 } as const;
  let top: { sortOrder: number } | null = null;
  if (entity === "experience") {
    const d = await ExperienceModel.findOne(filter).sort(sort).select({ sortOrder: 1 }).lean();
    top = d ? { sortOrder: d.sortOrder } : null;
  } else if (entity === "education") {
    const d = await EducationModel.findOne(filter).sort(sort).select({ sortOrder: 1 }).lean();
    top = d ? { sortOrder: d.sortOrder } : null;
  } else if (entity === "certification") {
    const d = await CertificationModel.findOne(filter).sort(sort).select({ sortOrder: 1 }).lean();
    top = d ? { sortOrder: d.sortOrder } : null;
  } else {
    const d = await ProjectModel.findOne(filter).sort(sort).select({ sortOrder: 1 }).lean();
    top = d ? { sortOrder: d.sortOrder } : null;
  }
  return (top?.sortOrder ?? 0) + 1;
}

export async function createExperience(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = experienceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("experience"));
    const { id: _ignored, startDate, endDate, current, ...rest } = data;
    void _ignored;
    const row = await ExperienceModel.create({
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current,
      sortOrder,
    });
    const id = row._id.toString();
    await revalidateEntity("experience");
    await logActivity(email, "created", "experience", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateExperience(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const { id, startDate, endDate, current, ...rest } = parsed.data;
    // current=true means endDate is null.
    const update: Record<string, unknown> = {
      ...rest,
      startDate: new Date(startDate),
      endDate: current || !endDate ? null : new Date(endDate),
      current,
    };
    const row = await ExperienceModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!row) return fail(new Error("Record not found."));
    await revalidateEntity("experience");
    await logActivity(email, "updated", "experience", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await ExperienceModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
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
export async function createEducation(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = educationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("education"));
    const { id: _ignored, ...rest } = data;
    void _ignored;
    const row = await EducationModel.create({ ...rest, sortOrder });
    const id = row._id.toString();
    await revalidateEntity("education");
    await logActivity(email, "created", "education", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateEducation(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const { id, ...rest } = parsed.data;
    const row = await EducationModel.findByIdAndUpdate(id, { $set: rest }, { new: true });
    if (!row) return fail(new Error("Record not found."));
    await revalidateEntity("education");
    await logActivity(email, "updated", "education", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await EducationModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
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
export async function createCertification(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = certificationSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    const sortOrder = data.sortOrder || (await bumpSortOrder("certification"));
    const { id: _ignored, ...rest } = data;
    void _ignored;
    const row = await CertificationModel.create({ ...rest, sortOrder });
    const id = row._id.toString();
    await revalidateEntity("certification");
    await logActivity(email, "created", "certification", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateCertification(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const { id, ...rest } = parsed.data;
    const row = await CertificationModel.findByIdAndUpdate(id, { $set: rest }, { new: true });
    if (!row) return fail(new Error("Record not found."));
    await revalidateEntity("certification");
    await logActivity(email, "updated", "certification", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCertification(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await CertificationModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
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
export async function createSkillGroup(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillGroupSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const row = await SkillGroupModel.create(parsed.data);
    const id = row._id.toString();
    await revalidateEntity("skillGroup");
    await logActivity(email, "created", "skillGroup", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateSkillGroup(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const { id, ...rest } = parsed.data;
    const row = await SkillGroupModel.findByIdAndUpdate(id, { $set: rest }, { new: true });
    if (!row) return fail(new Error("Record not found."));
    await revalidateEntity("skillGroup");
    await logActivity(email, "updated", "skillGroup", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSkillGroup(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    // Cascade delete skills in the group.
    const group = await SkillGroupModel.findById(id).select({ _id: 1 }).lean();
    if (!group) return fail(new Error("Record not found."));
    await SkillModel.deleteMany({ groupId: group._id });
    await SkillGroupModel.findByIdAndDelete(id);
    await revalidateEntity("skillGroup");
    await logActivity(email, "deleted", "skillGroup", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function createSkill(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    const row = await SkillModel.create({
      ...data,
      groupId: new Types.ObjectId(data.groupId),
    });
    const id = row._id.toString();
    await revalidateEntity("skill");
    await logActivity(email, "created", "skill", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateSkill(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const { id, groupId, ...rest } = parsed.data;
    const row = await SkillModel.findByIdAndUpdate(
      id,
      { $set: { ...rest, groupId: new Types.ObjectId(groupId) } },
      { new: true },
    );
    if (!row) return fail(new Error("Record not found."));
    await revalidateEntity("skill");
    await logActivity(email, "updated", "skill", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await SkillModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
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
export async function createProject(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const sortOrder = data.sortOrder || (await bumpSortOrder("project"));
    const { id: _ignored, links, ...rest } = data;
    void _ignored;
    const row = await ProjectModel.create({
      ...rest,
      sortOrder,
      links: links ?? null,
    });
    const id = row._id.toString();
    await revalidateEntity("project");
    if (data.featured) revalidateTag("projects-featured");
    await logActivity(email, "created", "project", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateProject(raw: unknown): Promise<ActionResult<{ id: string; featuredCount: number }>> {
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
    await connect();
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id, links, ...rest } = data;
    const existing = await ProjectModel.findById(id).select({ featured: 1 }).lean();
    if (!existing) return fail(new Error("Record not found."));
    const row = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: { ...rest, links: links ?? null } },
      { new: true },
    );
    const featuredCount = await ProjectModel.countDocuments({
      featured: true,
      status: "published",
    });
    await revalidateEntity("project");
    if (rest.featured || existing.featured) revalidateTag("projects-featured");
    await logActivity(email, "updated", "project", id);
    return ok({ id: id!, featuredCount }, id!);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const existing = await ProjectModel.findById(id).select({ featured: 1 }).lean();
    if (!existing) return fail(new Error("Record not found."));
    await ProjectModel.findByIdAndDelete(id);
    await revalidateEntity("project");
    if (existing.featured) revalidateTag("projects-featured");
    await logActivity(email, "deleted", "project", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Blog post + tag
// ---------------------------------------------------------------------------
//
// After the Mongo migration blog posts embed `tagIds: Types.ObjectId[]`
// instead of a Prisma M2M relation. The admin schemas accept ids as strings,
// so we convert them to ObjectIds at the boundary.
// ---------------------------------------------------------------------------
export async function createBlogPost(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id: _ignored, tagIds, publishedAt, bodyMd, readingMinutes: rm, ...rest } = data;
    void _ignored;
    const publishedAtDate =
      rest.status === "published"
        ? publishedAt
          ? new Date(publishedAt)
          : new Date()
        : null;
    const row = await BlogPostModel.create({
      ...rest,
      bodyMd,
      readingMinutes: rm || readingMinutes(bodyMd),
      publishedAt: publishedAtDate,
      tagIds: toObjectIds(tagIds ?? []),
    });
    const id = row._id.toString();
    await revalidateEntity("blogPost");
    await logActivity(email, "created", "blogPost", id);
    return ok({ id }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function updateBlogPost(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
    await connect();
    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);
    const { id, tagIds, publishedAt, bodyMd, readingMinutes: rm, ...rest } = data;
    const existing = await BlogPostModel.findById(id)
      .select({ status: 1, publishedAt: 1 })
      .lean();
    if (!existing) return fail(new Error("Record not found."));
    const publishedAtDate =
      rest.status === "published"
        ? publishedAt
          ? new Date(publishedAt)
          : existing.publishedAt ?? new Date()
        : null;
    const row = await BlogPostModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...rest,
          bodyMd,
          readingMinutes: rm || readingMinutes(bodyMd),
          publishedAt: publishedAtDate,
          tagIds: toObjectIds(tagIds ?? []),
        },
      },
      { new: true },
    );
    await revalidateEntity("blogPost");
    await logActivity(email, "updated", "blogPost", id);
    return ok({ id: id! }, id!);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await BlogPostModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
    await revalidateEntity("blogPost");
    await logActivity(email, "deleted", "blogPost", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function createBlogTag(raw: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = blogTagSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const data = parsed.data;
    const slug = data.slug || slugify(data.name);
    const row = await BlogTagModel.findOneAndUpdate(
      { slug },
      { $set: { name: data.name }, $setOnInsert: { slug } },
      { upsert: true, new: true },
    );
    const id = row._id.toString();
    await revalidateEntity("blogTag");
    await logActivity(email, "created", "blogTag", id);
    return ok({ id, slug }, id);
  } catch (e) {
    return fail(e);
  }
}

export async function attachTagsToPost(
  postId: string,
  tagIds: string[],
): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await BlogPostModel.findByIdAndUpdate(
      postId,
      { $set: { tagIds: toObjectIds(tagIds) } },
      { new: true },
    );
    if (!res) return fail(new Error("Record not found."));
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
export async function markMessageRead(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await MessageModel.findByIdAndUpdate(id, { $set: { readAt: new Date() } }, { new: true });
    if (!res) return fail(new Error("Record not found."));
    await logActivity(email, "updated", "message", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function markMessageUnread(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await MessageModel.findByIdAndUpdate(id, { $set: { readAt: null } }, { new: true });
    if (!res) return fail(new Error("Record not found."));
    await logActivity(email, "updated", "message", id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function markMessageArchived(id: string, archived: boolean): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await MessageModel.findByIdAndUpdate(id, { $set: { archived } }, { new: true });
    if (!res) return fail(new Error("Record not found."));
    await logActivity(email, "updated", "message", id, { archived });
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  try {
    await connect();
    const res = await MessageModel.findByIdAndDelete(id);
    if (!res) return fail(new Error("Record not found."));
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
    await connect();
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

type SortableRow = { id: string; sortOrder: number };

async function loadSortableRows(
  entity: ReorderEntity,
  id: string,
): Promise<SortableRow[]> {
  const sort = { sortOrder: 1, _id: 1 } as const;
  if (entity === "experience") {
    return ExperienceModel.find({}).sort(sort).select({ _id: 1, sortOrder: 1 }).lean()
      .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
  }
  if (entity === "education") {
    return EducationModel.find({}).sort(sort).select({ _id: 1, sortOrder: 1 }).lean()
      .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
  }
  if (entity === "certification") {
    return CertificationModel.find({}).sort(sort).select({ _id: 1, sortOrder: 1 }).lean()
      .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
  }
  if (entity === "project") {
    return ProjectModel.find({}).sort(sort).select({ _id: 1, sortOrder: 1 }).lean()
      .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
  }
  if (entity === "skillGroup") {
    return SkillGroupModel.find({}).sort(sort).select({ _id: 1, sortOrder: 1 }).lean()
      .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
  }
  // skill: scoped to its group
  const target = await SkillModel.findById(id).select({ groupId: 1 }).lean();
  if (!target) return [];
  return SkillModel.find({ groupId: target.groupId })
    .sort(sort)
    .select({ _id: 1, sortOrder: 1 })
    .lean()
    .then((r) => r.map((d) => ({ id: d._id.toString(), sortOrder: d.sortOrder })));
}

async function swapSortOrder(
  entity: ReorderEntity,
  id: string,
  direction: "up" | "down",
) {
  if (entity === "blogPost") {
    // BlogPost has no sortOrder; reordering falls back to createdAt which
    // is not cheap to swap. Keep the legacy no-op behaviour.
    return;
  }

  const rows = await loadSortableRows(entity, id);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[swapIdx]!;

  // Sequential updates — fine for portfolio-scale writes. Each Model has a
  // different generic so we route by entity instead of using a union.
  const update = async (id: string, sortOrder: number) => {
    if (entity === "experience") return ExperienceModel.findByIdAndUpdate(id, { $set: { sortOrder } });
    if (entity === "education") return EducationModel.findByIdAndUpdate(id, { $set: { sortOrder } });
    if (entity === "certification") return CertificationModel.findByIdAndUpdate(id, { $set: { sortOrder } });
    if (entity === "project") return ProjectModel.findByIdAndUpdate(id, { $set: { sortOrder } });
    if (entity === "skillGroup") return SkillGroupModel.findByIdAndUpdate(id, { $set: { sortOrder } });
    return SkillModel.findByIdAndUpdate(id, { $set: { sortOrder } });
  };

  await update(a.id, b.sortOrder);
  await update(b.id, a.sortOrder);
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

// ---------------------------------------------------------------------------
// AI settings (provider, model, encrypted key, enabled flag)
//
// The plaintext API key is received from the form, encrypted with
// AES-256-GCM (see src/lib/crypto-secret.ts), and stored. The key is
// never returned to a client-facing surface — only a masked preview.
// ---------------------------------------------------------------------------

import { AiSettingsModel, AI_SETTINGS_ID } from "@/lib/db";
import { aiSettingsSchema, type AiProviderId } from "@/lib/schemas";
import { encryptSecret, maskSecret } from "@/lib/crypto-secret";

export interface AiSettingsView {
  provider: AiProviderId;
  model: string;
  keyMask: string;
  enabled: boolean;
  configured: true;
}

/**
 * Returns the current AI settings (with a masked key) or null if no
 * settings have been saved yet. Never returns the plaintext key.
 */
export async function getAiSettings(): Promise<AiSettingsView | null> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return null;
  }
  void email; // We don't surface the actor for this read.
  try {
    await connect();
    const doc = await AiSettingsModel.findById(AI_SETTINGS_ID).lean();
    if (!doc) return null;
    return {
      provider: doc.provider as AiProviderId,
      model: doc.model,
      keyMask: doc.keyMask,
      enabled: doc.enabled,
      configured: true,
    };
  } catch {
    return null;
  }
}

/**
 * Persist new AI settings. Encrypts the API key before writing.
 * If a row already exists it is updated in place; otherwise inserted.
 */
export async function saveAiSettings(
  raw: unknown,
): Promise<ActionResult<{ keyMask: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = aiSettingsSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const { provider, model, apiKey, enabled } = parsed.data;
  try {
    const encrypted = encryptSecret(apiKey);
    const keyMask = maskSecret(apiKey);
    await connect();
    await AiSettingsModel.findByIdAndUpdate(
      AI_SETTINGS_ID,
      {
        $set: {
          provider,
          model,
          encryptedKey: encrypted,
          keyMask,
          enabled,
          updatedBy: email,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await logActivity(email, "updated", "system", undefined, {
      action: "saveAiSettings",
      provider,
      model,
    });
    return ok({ keyMask });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Sends a 1-token ping to the configured provider to verify the key
 * works. Returns ok on success, error with the upstream message on
 * failure. Requires settings to already exist.
 */
export async function testAiSettings(): Promise<ActionResult> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  void email;
  try {
    await connect();
    const doc = await AiSettingsModel.findById(AI_SETTINGS_ID).lean();
    if (!doc) {
      return { ok: false, error: "AI settings are not configured yet." };
    }
    // Decrypt is intentionally NOT imported here. The /api/admin/ai
    // route is what should do live model calls — it carries the rate
    // limit and the JSON-validation. We just confirm the row exists
    // and is decryptable, then ping the provider via the API route
    // pattern. For simplicity (and to avoid circular imports) we use
    // the same client directly here.
    const { decryptSecret } = await import("@/lib/crypto-secret");
    const { callChat } = await import("@/lib/ai/client");
    const key = decryptSecret(doc.encryptedKey);
    const result = await callChat(
      doc.provider as AiProviderId,
      doc.model,
      key,
      [
        {
          role: "system",
          content: "You are a connectivity probe. Reply with the single word OK.",
        },
        { role: "user", content: "ping" },
      ],
    );
    if (!result.text || result.text.length === 0) {
      return { ok: false, error: "Provider returned an empty response." };
    }
    return ok();
  } catch (e) {
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "AiError") {
      return { ok: false, error: (e as Error).message };
    }
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * Helpers for any action that mutates a comment: bust the global
 * `comments` cache AND the specific post page so the public tree
 * refreshes on the very next render (no 60-second staleness).
 */
async function revalidateCommentTargets(postId: Types.ObjectId) {
  revalidateEntity("comment");
  try {
    const post = await BlogPostModel.findById(postId).select("slug").lean();
    if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  } catch {
    // best-effort: the entity-level revalidation already covers
    // the bulk of the public cache.
  }
}

export async function approveComment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = commentIdSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const c = await CommentModel.findByIdAndUpdate(
      parsed.data.id,
      { $set: { status: "approved" } },
      { new: true },
    )
      .select("postId")
      .lean();
    if (!c) return { ok: false, error: "Comment not found." };
    await revalidateCommentTargets(c.postId);
    await logActivity(email, "updated", "comment", String(c._id), { status: "approved" });
    return ok({ id: String(c._id) }, String(c._id));
  } catch (e) {
    return fail(e);
  }
}

export async function rejectComment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = commentIdSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const c = await CommentModel.findByIdAndUpdate(
      parsed.data.id,
      { $set: { status: "rejected" } },
      { new: true },
    )
      .select("postId")
      .lean();
    if (!c) return { ok: false, error: "Comment not found." };
    await revalidateCommentTargets(c.postId);
    await logActivity(email, "updated", "comment", String(c._id), { status: "rejected" });
    return ok({ id: String(c._id) }, String(c._id));
  } catch (e) {
    return fail(e);
  }
}

export async function markCommentSpam(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = commentIdSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const c = await CommentModel.findByIdAndUpdate(
      parsed.data.id,
      { $set: { status: "spam" } },
      { new: true },
    )
      .select("postId")
      .lean();
    if (!c) return { ok: false, error: "Comment not found." };
    await revalidateCommentTargets(c.postId);
    await logActivity(email, "updated", "comment", String(c._id), { status: "spam" });
    return ok({ id: String(c._id) }, String(c._id));
  } catch (e) {
    return fail(e);
  }
}

/**
 * Hard-delete. Top-level comments cascade-delete their replies; replies
 * themselves are leaf nodes so a single delete is enough.
 */
export async function deleteComment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = commentIdSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const c = await CommentModel.findById(parsed.data.id)
      .select("_id postId parentId")
      .lean();
    if (!c) return { ok: false, error: "Comment not found." };

    if (!c.parentId) {
      await CommentModel.deleteMany({ parentId: c._id });
    }
    await CommentModel.deleteOne({ _id: c._id });

    await revalidateCommentTargets(c.postId);
    await logActivity(email, "deleted", "comment", String(c._id));
    return ok({ id: String(c._id) }, String(c._id));
  } catch (e) {
    return fail(e);
  }
}

/**
 * Admin reply. Auto-approved. Best-effort email notification to the
 * parent's author email (failures are swallowed so the action never
 * blocks on SMTP).
 */
export async function replyToComment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return fail(e);
  }
  const parsed = commentReplySchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const parent = await CommentModel.findById(parsed.data.parentId)
      .select("_id parentId postId authorEmail authorName status")
      .lean();
    if (!parent) return { ok: false, error: "Parent comment not found." };
    if (parent.parentId) return { ok: false, error: "Cannot reply to a reply." };
    if (parent.status !== "approved") {
      return { ok: false, error: "Parent comment is not approved yet." };
    }

    const displayName = admin.email.split("@")[0] || "Admin";
    const created = await CommentModel.create({
      postId: parent.postId,
      parentId: parent._id,
      authorName: displayName,
      authorEmail: admin.email,
      body: parsed.data.body,
      status: "approved",
      isAdmin: true,
      authorUserId: new Types.ObjectId(admin.userId),
    });

    await revalidateCommentTargets(parent.postId);

    // Best-effort: notify the original commenter that the site owner has
    // replied. Failures must never block the action result.
    try {
      const post = await BlogPostModel.findById(parent.postId)
        .select("slug title")
        .lean();
      if (post?.slug && parent.authorEmail) {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
        const url = `${base}/blog/${post.slug}#comment-${parent._id}`;
        const safeBody = parsed.data.body.replace(/[&<>]/g, (c) =>
          c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
        );
        const html = `<p>Hi ${parent.authorName},</p><p>${displayName} replied to your comment:</p><blockquote>${safeBody}</blockquote><p><a href="${url}">View the discussion</a></p>`;
        await sendEmail({
          to: parent.authorEmail,
          subject: `New reply to your comment on "${post.title}"`,
          text: `Hi ${parent.authorName},\n\n${displayName} replied:\n\n${parsed.data.body}\n\nView: ${url}`,
          html,
        });
      }
    } catch {
      /* never block on mail failure */
    }

    await logActivity(admin.email, "created", "comment", String(created._id), { reply: true });
    return ok({ id: String(created._id) }, String(created._id));
  } catch (e) {
    return fail(e);
  }
}

/**
 * Per-post comments toggle. Busts both the blog and comments caches
 * because the section header and the form visibility both depend on it.
 */
export async function setPostCommentsEnabled(raw: unknown): Promise<ActionResult<{ postId: string; enabled: boolean }>> {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch (e) {
    return fail(e);
  }
  const parsed = setPostCommentsEnabledSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  try {
    await connect();
    const updated = await BlogPostModel.findByIdAndUpdate(
      parsed.data.postId,
      { $set: { commentsEnabled: parsed.data.enabled } },
      { new: true },
    )
      .select("slug")
      .lean();
    if (!updated) return { ok: false, error: "Post not found." };
    revalidateEntity("blogPost");
    revalidateEntity("comment");
    if (updated.slug) revalidatePath(`/blog/${updated.slug}`);
    await logActivity(email, "updated", "blogPost", String(updated._id), {
      commentsEnabled: parsed.data.enabled,
    });
    return ok({ postId: String(updated._id), enabled: parsed.data.enabled }, String(updated._id));
  } catch (e) {
    return fail(e);
  }
}