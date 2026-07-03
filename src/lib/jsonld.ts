import { absoluteUrl } from "@/lib/utils";

/**
 * JSON-LD schema builders for the public site.
 *
 * Every builder returns a plain object — the <JsonLd /> component (or any
 * page) is responsible for serialising it. Keep this file dependency-free
 * (no Prisma imports) so it can be reused from both server and client paths.
 */

const SITE_NAME = "Md Kamal Hosen — Portfolio";

interface PersonSchema {
  "@type": "Person";
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: { "@type": "PostalAddress"; addressLocality: string; addressCountry: string };
  sameAs?: string[];
  knowsAbout?: string[];
  alumniOf?: string[];
  worksFor?: { "@type": "Organization"; name: string };
  addressCountry?: string;
  homeLocation?: unknown;
}

interface SiteSchema {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: { "@type": "EntryPoint"; urlTemplate: string };
    "query-input": string;
  };
}

interface ArticleSchema {
  "@type": "Article";
  headline: string;
  description?: string;
  image?: string[];
  datePublished?: string;
  dateModified?: string;
  author: { "@type": "Person"; name: string; url: string };
  publisher: { "@type": "Organization"; name: string; logo?: { "@type": "ImageObject"; url: string } };
  mainEntityOfPage: { "@type": "WebPage"; "@id": string };
  wordCount?: number;
  keywords?: string[];
  articleSection?: string;
}

interface CreativeWorkSchema {
  "@type": "CreativeWork" | "SoftwareSourceCode" | "Article";
  name: string;
  description?: string;
  url: string;
  image?: string[];
  author: { "@type": "Person"; name: string; url: string };
  keywords?: string[];
  dateCreated?: string;
  dateModified?: string;
  genre?: string;
  about?: string;
  programmingLanguage?: string[];
}

interface BreadcrumbSchema {
  "@type": "BreadcrumbList";
  itemListElement: { "@type": "ListItem"; position: number; name: string; item: string }[];
}

export type JsonLdObject =
  | PersonSchema
  | SiteSchema
  | ArticleSchema
  | CreativeWorkSchema
  | BreadcrumbSchema
  | (PersonSchema | SiteSchema | ArticleSchema | CreativeWorkSchema | BreadcrumbSchema)[];

export interface PersonInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  knowsAbout?: string[];
  currentRole?: string;
  currentCompany?: string;
}

export function personJsonLd(p: PersonInput): PersonSchema {
  const url = absoluteUrl("/about");
  const sameAs: string[] = [];
  if (p.linkedinUrl) sameAs.push(p.linkedinUrl);
  if (p.githubUrl) sameAs.push(p.githubUrl);
  sameAs.push(absoluteUrl("/"));

  const person: PersonSchema = {
    "@type": "Person",
    name: p.name,
    url,
    jobTitle: p.currentRole ?? "Building Management System Engineer",
    description:
      p.bio ??
      "BMS Engineer commissioning HVAC plants and shipping the software that runs them.",
  };
  if (p.email) person.email = p.email;
  if (p.phone) person.telephone = p.phone;
  if (p.avatarUrl) person.image = absoluteUrl(p.avatarUrl);
  if (p.location) {
    const [city, country] = p.location.split(",").map((s) => s.trim());
    person.address = {
      "@type": "PostalAddress",
      addressLocality: city ?? p.location,
      addressCountry: country ?? "",
    };
  }
  if (p.knowsAbout && p.knowsAbout.length > 0) person.knowsAbout = p.knowsAbout;
  if (sameAs.length > 0) person.sameAs = sameAs;
  if (p.currentCompany) {
    person.worksFor = { "@type": "Organization", name: p.currentCompany };
  }
  return person;
}

export function websiteJsonLd(opts?: {
  description?: string;
  includeSearchAction?: boolean;
}): SiteSchema {
  const url = absoluteUrl("/");
  const site: SiteSchema = {
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    inLanguage: "en",
  };
  if (opts?.description) site.description = opts.description;
  if (opts?.includeSearchAction) {
    site.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    };
  }
  return site;
}

export interface ArticleInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  tags?: string[];
  readingMinutes?: number;
  author: { name: string };
}

export function articleJsonLd(a: ArticleInput): ArticleSchema {
  const url = absoluteUrl(`/blog/${a.slug}`);
  const article: ArticleSchema = {
    "@type": "Article",
    headline: a.title,
    author: {
      "@type": "Person",
      name: a.author.name,
      url: absoluteUrl("/about"),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/api/og?type=default"),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
  if (a.excerpt) article.description = a.excerpt;
  if (a.coverUrl) {
    article.image = [absoluteUrl(a.coverUrl)];
  } else {
    article.image = [absoluteUrl(`/api/og?type=post&title=${encodeURIComponent(a.title)}`)];
  }
  if (a.publishedAt) {
    article.datePublished =
      a.publishedAt instanceof Date ? a.publishedAt.toISOString() : new Date(a.publishedAt).toISOString();
  }
  if (a.updatedAt) {
    article.dateModified =
      a.updatedAt instanceof Date ? a.updatedAt.toISOString() : new Date(a.updatedAt).toISOString();
  }
  if (a.tags && a.tags.length > 0) article.keywords = a.tags;
  if (a.readingMinutes) {
    // approximate words: 200/minute
    article.wordCount = a.readingMinutes * 200;
  }
  return article;
}

export interface CreativeWorkInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  techStack?: string[];
  category?: string;
  /**
   * Free-form year label. Currently `string` for new data (e.g.
   * `"2024 - Present"`); the legacy `number` form is still
   * accepted for any documents written before the change.
   */
  year?: number | string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  type?: "software" | "bms" | "iot" | "android" | "general";
}

export function creativeWorkJsonLd(p: CreativeWorkInput): CreativeWorkSchema {
  const url = absoluteUrl(`/projects/${p.slug}`);
  const typeMap: Record<NonNullable<CreativeWorkInput["type"]>, CreativeWorkSchema["@type"]> = {
    software: "SoftwareSourceCode",
    bms: "Article",
    iot: "Article",
    android: "SoftwareSourceCode",
    general: "CreativeWork",
  };
  const cw: CreativeWorkSchema = {
    "@type": typeMap[p.type ?? "general"],
    name: p.title,
    url,
    author: {
      "@type": "Person",
      name: "Md Kamal Hosen",
      url: absoluteUrl("/about"),
    },
  };
  if (p.excerpt) cw.description = p.excerpt;
  if (p.coverUrl) {
    cw.image = [absoluteUrl(p.coverUrl)];
  } else {
    cw.image = [absoluteUrl(`/api/og?type=project&title=${encodeURIComponent(p.title)}`)];
  }
  if (p.techStack && p.techStack.length > 0) {
    cw.keywords = p.techStack;
    cw.programmingLanguage = p.techStack;
  }
  if (p.category) cw.genre = p.category;
  if (p.year) cw.about = `Project category: ${p.category ?? "general"} (${p.year}).`;
  if (p.createdAt) {
    cw.dateCreated =
      p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString();
  }
  if (p.updatedAt) {
    cw.dateModified =
      p.updatedAt instanceof Date ? p.updatedAt.toISOString() : new Date(p.updatedAt).toISOString();
  }
  return cw;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): BreadcrumbSchema {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href),
    })),
  };
}

/**
 * Combine multiple JSON-LD objects into a single script payload (Google supports
 * `@graph` arrays, but emitting multiple top-level objects in one <script> is
 * also valid and easier to read).
 *
 * Returns a `JsonLdObject[]` so the JSON serialiser always emits a list — even
 * with one entry — which keeps downstream callers free of branchy logic.
 */
export function combineJsonLd(...objects: JsonLdObject[]): JsonLdObject[] {
  return objects;
}