import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Github,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CategoryBadge } from "@/components/badge";
import { ImageGallery } from "@/components/image-gallery";
import { JsonLd } from "@/components/json-ld";
import { getProjectBySlug, getPublishedProjects } from "@/server/queries";
import { paragraphs, absoluteUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, creativeWorkJsonLd } from "@/lib/jsonld";

// Performance: Force static generation for better caching
export const dynamic = 'force-static';
export const revalidate = 60 * 60 * 24; // 24 hours cache

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Performance: Generate static params at build time
export async function generateStaticParams() {
  try {
    const projects = (await getPublishedProjects()) as unknown as Array<{ slug: string }>;
    return projects.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// Performance: Cache metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let title = slug;
  let description = "Case study by Md Kamal Hosen.";
  let project: { title: string; excerpt?: string | null } | null = null;
  try {
    project = ((await getProjectBySlug(slug)) as unknown) as {
      title: string;
      excerpt?: string | null;
    } | null;
    if (project) {
      title = project.title;
      description = project.excerpt ?? description;
    }
  } catch {
    // keep defaults
  }
  const pageUrl = absoluteUrl(`/projects/${slug}`);
  const ogImage = absoluteUrl(
    `/api/og?type=project&title=${encodeURIComponent(title)}${
      description ? `&subtitle=${encodeURIComponent(description.slice(0, 140))}` : ""
    }`,
  );
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const sections = [
  { key: "problem", label: "Problem", color: "text-cat-bms" },
  { key: "role", label: "My role", color: "text-cat-iot" },
  { key: "tech", label: "Technology", color: "text-cat-software" },
  { key: "challenges", label: "Challenges", color: "text-cat-android" },
  { key: "solution", label: "Solution", color: "text-accent" },
  { key: "outcome", label: "Outcome", color: "text-cat-iot" },
  { key: "lessons", label: "Lessons learned", color: "text-cat-software" },
] as const;

const coverByCategory: Record<string, string> = {
  bms: "cover-gradient-bms",
  software: "cover-gradient-software",
  iot: "cover-gradient-iot",
  android: "cover-gradient-android",
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Performance: Fetch all data in parallel
  const [project, allProjects] = await Promise.all([
    getProjectBySlug(slug).catch(() => null),
    getPublishedProjects().catch(() => []),
  ]);

  const parsedProject = project as unknown as {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverUrl?: string | null;
    status: string;
    category: string;
    year: string;
    clientType?: string | null;
    techStack: string[];
    problem?: string | null;
    role?: string | null;
    challenges?: string | null;
    solution?: string | null;
    outcome?: string | null;
    lessons?: string | null;
    galleryImages?: string[];
    links?: { live?: string | null; github?: string | null; pdf?: string | null } | null;
  } | null;

  if (!parsedProject || parsedProject.status !== "published") notFound();

  const all = allProjects as unknown as Array<{
    slug: string;
    title: string;
    excerpt: string;
    coverUrl?: string | null;
    category: string;
    year: string;
    techStack: string[];
  }>;
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const links = (parsedProject.links ?? {}) as {
    live?: string | null;
    github?: string | null;
    pdf?: string | null;
  };
  const gallery: string[] = parsedProject.galleryImages ?? [];
  const coverClass =
    coverByCategory[parsedProject.category as string] ?? "cover-gradient-blog";

  return (
    <>
      {/* JSON-LD: CreativeWork + BreadcrumbList */}
      <JsonLd
        data={[creativeWorkJsonLd({
          slug: parsedProject.slug,
          title: parsedProject.title,
          excerpt: parsedProject.excerpt,
          coverUrl: parsedProject.coverUrl,
          techStack: parsedProject.techStack,
          category: parsedProject.category,
          year: parsedProject.year,
          createdAt: null,
          updatedAt: null,
          type: (parsedProject.category as "bms" | "software" | "iot" | "android") ?? "general",
        }), breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
          { name: parsedProject.title, href: `/projects/${parsedProject.slug}` },
        ])]}
      />

      {/* Cover band — shows the uploaded `coverUrl` as a full-bleed
          image with a category-tinted gradient as a fallback when no
          cover is set. The bottom gradient keeps the page header
          legible regardless of the underlying image. */}
      <section className="relative overflow-hidden border-b border-border">
        {parsedProject.coverUrl ? (
          <img
            src={parsedProject.coverUrl}
            alt={`${parsedProject.title} cover`}
            className="aspect-[21/9] w-full object-cover md:aspect-[21/7]"
            loading="eager"
            priority={true}
          />
        ) : (
          <div
            className={cn("aspect-[21/9] w-full md:aspect-[21/7]", coverClass)}
            aria-hidden="true"
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background"
          aria-hidden="true"
        />
      </section>

      <PageHeader
        variant="subtle"
        eyebrow={`Case study · ${parsedProject.category.toUpperCase()}`}
        title={parsedProject.title}
        description={parsedProject.excerpt || parsedProject.problem || ""}
      />

      <section>
        <div className="container py-12 md:py-16">
          {/* Gallery at the top */}
          {gallery.length > 0 && (
            <div className="mb-12">
              <ScrollReveal>
                <ImageGallery images={gallery} title={parsedProject.title} />
              </ScrollReveal>
            </div>
          )}

          {/* Meta row + actions */}
          <div className="mb-12 flex flex-wrap items-center gap-3">
            <CategoryBadge category={parsedProject.category as "bms" | "software" | "iot" | "android"} />
            <span className="font-mono text-sm text-muted-foreground">
              {parsedProject.year}
            </span>
            {parsedProject.clientType && (
              <span className="text-sm text-muted-foreground">
                · {parsedProject.clientType}
              </span>
            )}
          </div>

          {links.live || links.github || links.pdf ? (
            <div className="mb-12 flex flex-wrap gap-3">
              {links.live && (
                <a
                  href={links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:shadow-glow"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Live
                </a>
              )}
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg glass-chip px-4 text-sm font-medium text-foreground hover:bg-card"
                >
                  <Github className="h-4 w-4" aria-hidden="true" /> Source
                </a>
              )}
              {links.pdf && (
                <a
                  href={links.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg glass-chip px-4 text-sm font-medium text-foreground hover:bg-card"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> PDF
                </a>
              )}
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main column — 7-part narrative */}
            <div className="space-y-6 lg:col-span-2">
              {sections.map((s, i) => {
                let content: string | string[] | null = null;
                if (s.key === "tech") {
                  content = parsedProject.techStack?.length ? parsedProject.techStack : null;
                } else if (s.key === "role") {
                  content = parsedProject.role ? paragraphs(parsedProject.role) : null;
                } else if (s.key === "problem") {
                  content = parsedProject.problem ? paragraphs(parsedProject.problem) : null;
                } else if (s.key === "challenges") {
                  content = parsedProject.challenges ? paragraphs(parsedProject.challenges) : null;
                } else if (s.key === "solution") {
                  content = parsedProject.solution ? paragraphs(parsedProject.solution) : null;
                } else if (s.key === "outcome") {
                  content = parsedProject.outcome ? paragraphs(parsedProject.outcome) : null;
                } else if (s.key === "lessons") {
                  content = parsedProject.lessons ? paragraphs(parsedProject.lessons) : null;
                }
                if (!content || (Array.isArray(content) && content.length === 0)) return null;
                return (
                  <ScrollReveal as="article" key={s.key} delay={i * 60}>
                    <div className="glass-card relative overflow-hidden p-6 sm:p-7">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                        <h2 className={cn("text-sm font-semibold uppercase tracking-wider", s.color)}>
                          {s.label}
                        </h2>
                      </div>

                      {s.key === "tech" && Array.isArray(content) ? (
                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {content.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : Array.isArray(content) ? (
                        <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
                          {content.map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                          {content}
                        </p>
                      )}
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Side column — quick facts */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="glass-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Quick facts
                </p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Category
                    </dt>
                    <dd className="mt-1 font-medium capitalize">
                      {parsedProject.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Year
                    </dt>
                    <dd className="mt-1 font-medium">{parsedProject.year}</dd>
                  </div>
                  {parsedProject.clientType && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Client type
                      </dt>
                      <dd className="mt-1 font-medium">{parsedProject.clientType}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Stack
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {parsedProject.techStack.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          {/* Prev/Next */}
          {(prev || next) && (
            <div className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/projects/${prev.slug}`}
                  className="group flex items-center gap-3 rounded-xl glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-accent" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="mt-0.5 truncate text-sm font-medium">
                      {prev.title}
                    </p>
                  </div>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/projects/${next.slug}`}
                  className="group flex items-center justify-end gap-3 rounded-xl glass-card p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Next</p>
                    <p className="mt-0.5 truncate text-sm font-medium">
                      {next.title}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
