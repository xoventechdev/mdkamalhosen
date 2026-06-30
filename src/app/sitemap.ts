import type { MetadataRoute } from "next";
import { getPublishedProjects, getPublishedPosts, getAllTags } from "@/server/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: Array<MetadataRoute.Sitemap[number]> = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/experience`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/skills`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/cv`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const [projects, posts, tags] = await Promise.all([
    getPublishedProjects().catch(() => []),
    getPublishedPosts().catch(() => []),
    getAllTags().catch(() => []),
  ]);

  const projectRoutes: Array<MetadataRoute.Sitemap[number]> = projects.map((p) => ({
    url: `${siteUrl}/projects/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const postRoutes: Array<MetadataRoute.Sitemap[number]> = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const tagRoutes: Array<MetadataRoute.Sitemap[number]> = tags.map((t) => ({
    url: `${siteUrl}/blog/tag/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...projectRoutes, ...postRoutes, ...tagRoutes];
}