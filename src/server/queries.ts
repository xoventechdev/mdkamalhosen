import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Cached data-access layer. Every public read goes through here so the entire
// site benefits from Next.js fetch-level caching with tagged invalidation.
// After an admin save we call revalidateTag() with the matching tag.
// ---------------------------------------------------------------------------

/**
 * Wraps a Prisma call with timing logs. Visible in Vercel runtime logs so we
 * can identify which query is the bottleneck on cold starts. The wrapper
 * itself is non-caching — caching is handled by `unstable_cache` further out.
 */
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`[queries][${label}] start`);
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`[queries][${label}] end ${ms}ms`);
    if (ms > 1000) {
      console.warn(`[queries][${label}] SLOW ${ms}ms`);
    }
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[queries][${label}] error after ${ms}ms`, err);
    throw err;
  }
}

export const getProfile = unstable_cache(
  async () =>
    timed("getProfile", () =>
      prisma.profile.findUnique({ where: { id: 1 } }),
    ),
  ["profile"],
  { tags: ["profile"], revalidate: 60 },
);

export const getAllExperiences = unstable_cache(
  async () =>
    timed("getAllExperiences", () =>
      prisma.experience.findMany({
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      }),
    ),
  ["experiences"],
  { tags: ["experiences"], revalidate: 60 },
);

export const getAllEducation = unstable_cache(
  async () =>
    timed("getAllEducation", () =>
      prisma.education.findMany({ orderBy: [{ sortOrder: "asc" }] }),
    ),
  ["education"],
  { tags: ["education"], revalidate: 60 },
);

export const getAllCertifications = unstable_cache(
  async () =>
    timed("getAllCertifications", () =>
      prisma.certification.findMany({ orderBy: [{ sortOrder: "asc" }] }),
    ),
  ["certifications"],
  { tags: ["certifications"], revalidate: 60 },
);

export const getSkillGroups = unstable_cache(
  async () =>
    timed("getSkillGroups", () =>
      prisma.skillGroup.findMany({
        include: { skills: { orderBy: [{ sortOrder: "asc" }] } },
        orderBy: [{ sortOrder: "asc" }],
      }),
    ),
  ["skills"],
  { tags: ["skills"], revalidate: 60 },
);

export const getPublishedProjects = unstable_cache(
  async () =>
    timed("getPublishedProjects", () =>
      prisma.project.findMany({
        where: { status: "published" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ),
  ["projects"],
  { tags: ["projects"], revalidate: 60 },
);

export const getFeaturedProjects = unstable_cache(
  async () =>
    timed("getFeaturedProjects", () =>
      prisma.project.findMany({
        where: { status: "published", featured: true },
        orderBy: [{ sortOrder: "asc" }],
        take: 3,
      }),
    ),
  ["projects-featured"],
  { tags: ["projects"], revalidate: 60 },
);

export const getProjectBySlug = unstable_cache(
  async (slug: string) =>
    timed("getProjectBySlug", () =>
      prisma.project.findUnique({ where: { slug } }),
    ),
  ["project-by-slug"],
  { tags: ["projects"], revalidate: 60 },
);

export const getPublishedPosts = unstable_cache(
  async () =>
    timed("getPublishedPosts", () =>
      prisma.blogPost.findMany({
        where: { status: "published" },
        include: { tags: true },
        orderBy: [{ publishedAt: "desc" }],
      }),
    ),
  ["posts"],
  { tags: ["blog"], revalidate: 60 },
);

export const getLatestPosts = unstable_cache(
  async (limit = 3) =>
    timed("getLatestPosts", () =>
      prisma.blogPost.findMany({
        where: { status: "published" },
        include: { tags: true },
        orderBy: [{ publishedAt: "desc" }],
        take: limit,
      }),
    ),
  ["posts-latest"],
  { tags: ["blog"], revalidate: 60 },
);

export const getPostBySlug = unstable_cache(
  async (slug: string) =>
    timed("getPostBySlug", () =>
      prisma.blogPost.findUnique({
        where: { slug },
        include: { tags: true },
      }),
    ),
  ["post-by-slug"],
  { tags: ["blog"], revalidate: 60 },
);

export const getPostsByTag = unstable_cache(
  async (tagSlug: string) =>
    timed("getPostsByTag", () =>
      prisma.blogPost.findMany({
        where: {
          status: "published",
          tags: { some: { slug: tagSlug } },
        },
        include: { tags: true },
        orderBy: [{ publishedAt: "desc" }],
      }),
    ),
  ["posts-by-tag"],
  { tags: ["blog"], revalidate: 60 },
);

export const getAllTags = unstable_cache(
  async () =>
    timed("getAllTags", () =>
      prisma.blogTag.findMany({ orderBy: [{ name: "asc" }] }),
    ),
  ["tags"],
  { tags: ["blog"], revalidate: 60 },
);