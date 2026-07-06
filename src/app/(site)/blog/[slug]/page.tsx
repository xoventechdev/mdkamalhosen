import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import { ReadingProgress } from "@/components/reading-progress";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/badge";
import { JsonLd } from "@/components/json-ld";
import { CommentsSection } from "@/components/comments/comments-section";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import {
  getPostBySlug,
  getPublishedPosts,
  getPostViewCount,
} from "@/server/queries";
import { renderMarkdown, extractToc } from "@/lib/markdown";
import { absoluteUrl, compactCount } from "@/lib/utils";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { PostDates } from "@/components/post-dates";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let title = slug;
  let description: string | undefined;
  let post: Awaited<ReturnType<typeof getPostBySlug>> = null;
  try {
    post = await getPostBySlug(slug);
    if (post) {
      title = post.title;
      description = post.metaDescription ?? post.excerpt ?? undefined;
    }
  } catch {
    // keep defaults
  }
  const pageUrl = absoluteUrl(`/blog/${slug}`);
  const ogImage = absoluteUrl(
    `/api/og?type=post&title=${encodeURIComponent(title)}${
      description ? `&subtitle=${encodeURIComponent(description.slice(0, 140))}` : ""
    }`,
  );
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    authors: [{ name: "Md Kamal Hosen" }],
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
      creator: "@mdkamalhosennn",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post || post.status !== "published") notFound();

  const html = await renderMarkdown(post.bodyMd ?? "");
  const toc = extractToc(post.bodyMd ?? "");

  const all = await getPublishedPosts().catch(() => []);
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  // View count is cached per post id; the tracker below records the
  // hit. We surface the compact form in the hero and offer the raw
  // total via the title attribute.
  const viewCount = await getPostViewCount(post.id).catch(() => 0);
  const viewLabel = compactCount(viewCount);

  return (
    <>
      {/* Per-post tracker. The site-wide tracker also fires on this
          route as a generic "page" event; this one tags the hit with
          the post id so the blog-post analytics roll up cleanly. */}
      <PageViewTracker postId={post.id} />

      {/* JSON-LD: Article + BreadcrumbList */}
      <JsonLd
        data={[articleJsonLd({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          coverUrl: post.coverUrl,
          publishedAt: post.publishedAt,
          // Use the real `updatedAt` (Mongoose timestamp) for
          // dateModified, not the publishedAt as the previous code did.
          // `updatedAt` and `publishedAt` will be equal on a post
          // that has never been edited; that matches Schema.org's
          // definition of dateModified.
          updatedAt: post.updatedAt ?? post.publishedAt,
          tags: post.tags.map((t) => t.slug),
          readingMinutes: post.readingMinutes,
          author: { name: "Md Kamal Hosen" },
        }), breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ])]}
      />

      {/* Reading progress bar */}
      <ReadingProgress />

      {/* Hero with cover */}
      <section className="relative overflow-hidden border-b border-border">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : (
          <div
            className="cover-gradient-blog absolute inset-0"
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background"
          aria-hidden="true"
        />
        <div className="container relative py-20 md:py-28">
          <ScrollReveal>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              Blog
            </p>
            <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                {post.excerpt}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <PostDates
                    publishedAt={post.publishedAt}
                    updatedAt={post.updatedAt}
                    className="text-sm text-muted-foreground"
                  />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {post.readingMinutes} min read
              </span>
              <span
                className="inline-flex items-center gap-1.5"
                title={`${viewCount.toLocaleString()} views`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {viewLabel} {viewCount === 1 ? "view" : "views"}
              </span>
              {post.tags.length > 0 && (
                <span className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <Link key={t.id} href={`/blog/tag/${t.slug}`}>
                      <Badge variant="accent">#{t.slug}</Badge>
                    </Link>
                  ))}
                </span>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section>
        <div className="container py-12 md:py-20">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Article body */}
            <article id="article-body" className="lg:col-span-2">
              <div className="glass-card p-6 sm:p-10">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>

              {/* Prev/Next */}
              {(prev || next) && (
                <div className="mt-12 grid gap-4 sm:grid-cols-2">
                  {prev ? (
                    <Link
                      href={`/blog/${prev.slug}`}
                      className="group flex items-center gap-3 rounded-2xl glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                    >
                      <ArrowLeft
                        className="h-4 w-4 text-muted-foreground group-hover:text-accent"
                        aria-hidden="true"
                      />
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
                      href={`/blog/${next.slug}`}
                      className="group flex items-center justify-end gap-3 rounded-2xl glass-card p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Next</p>
                        <p className="mt-0.5 truncate text-sm font-medium">
                          {next.title}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 text-muted-foreground group-hover:text-accent"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              )}

              <CommentsSection
                postId={post.id}
                commentsEnabled={post.commentsEnabled !== false}
              />
            </article>

            {/* Sticky TOC */}
            {toc.length > 0 && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <ScrollReveal>
                  <div className="glass-card p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      On this page
                    </p>
                    <nav className="mt-4">
                      <ul className="space-y-2 text-sm">
                        {toc.map((h) => (
                          <li
                            key={h.id}
                            className={h.level === 3 ? "pl-3" : ""}
                          >
                            <a
                              href={`#${h.id}`}
                              className="link-underline inline-block text-muted-foreground hover:text-foreground"
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </ScrollReveal>
              </aside>
            )}
          </div>
        </div>
      </section>
    </>
  );
}