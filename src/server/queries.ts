import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Cached data-access layer. Every public read goes through here so the entire
// site benefits from Next.js fetch-level caching with tagged invalidation.
// After an admin save we call revalidateTag() with the matching tag.
// ---------------------------------------------------------------------------

export const getProfile = unstable_cache(
  async () => prisma.profile.findUnique({ where: { id: 1 } }),
  ["profile"],
  { tags: ["profile"], revalidate: 60 },
);

export const getAllExperiences = unstable_cache(
  async () =>
    prisma.experience.findMany({
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    }),
  ["experiences"],
  { tags: ["experiences"], revalidate: 60 },
);

export const getAllEducation = unstable_cache(
  async () => prisma.education.findMany({ orderBy: [{ sortOrder: "asc" }] }),
  ["education"],
  { tags: ["education"], revalidate: 60 },
);

export const getAllCertifications = unstable_cache(
  async () =>
    prisma.certification.findMany({ orderBy: [{ sortOrder: "asc" }] }),
  ["certifications"],
  { tags: ["certifications"], revalidate: 60 },
);

export const getSkillGroups = unstable_cache(
  async () =>
    prisma.skillGroup.findMany({
      include: { skills: { orderBy: [{ sortOrder: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }],
    }),
  ["skills"],
  { tags: ["skills"], revalidate: 60 },
);

export const getPublishedProjects = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ["projects"],
  { tags: ["projects"], revalidate: 60 },
);

export const getFeaturedProjects = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { status: "published", featured: true },
      orderBy: [{ sortOrder: "asc" }],
      take: 3,
    }),
  ["projects-featured"],
  { tags: ["projects"], revalidate: 60 },
);

export const getProjectBySlug = unstable_cache(
  async (slug: string) =>
    prisma.project.findUnique({ where: { slug } }),
  ["project-by-slug"],
  { tags: ["projects"], revalidate: 60 },
);

export const getPublishedPosts = unstable_cache(
  async () =>
    prisma.blogPost.findMany({
      where: { status: "published" },
      include: { tags: true },
      orderBy: [{ publishedAt: "desc" }],
    }),
  ["posts"],
  { tags: ["blog"], revalidate: 60 },
);

export const getLatestPosts = unstable_cache(
  async (limit = 3) =>
    prisma.blogPost.findMany({
      where: { status: "published" },
      include: { tags: true },
      orderBy: [{ publishedAt: "desc" }],
      take: limit,
    }),
  ["posts-latest"],
  { tags: ["blog"], revalidate: 60 },
);

export const getPostBySlug = unstable_cache(
  async (slug: string) =>
    prisma.blogPost.findUnique({
      where: { slug },
      include: { tags: true },
    }),
  ["post-by-slug"],
  { tags: ["blog"], revalidate: 60 },
);

export const getPostsByTag = unstable_cache(
  async (tagSlug: string) =>
    prisma.blogPost.findMany({
      where: {
        status: "published",
        tags: { some: { slug: tagSlug } },
      },
      include: { tags: true },
      orderBy: [{ publishedAt: "desc" }],
    }),
  ["posts-by-tag"],
  { tags: ["blog"], revalidate: 60 },
);

export const getAllTags = unstable_cache(
  async () => prisma.blogTag.findMany({ orderBy: [{ name: "asc" }] }),
  ["tags"],
  { tags: ["blog"], revalidate: 60 },
);