import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedPosts, getBatchPostViewCounts } from "@/server/queries";
import { absoluteUrl, compactCount } from "@/lib/utils";
import { PostDates } from "@/components/post-dates";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=post&title=Blog&subtitle=Notes+on+BACnet%2C+Niagara+4%2C+and+AI+in+engineering",
);

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on BACnet, Niagara 4 commissioning, building automation, IoT, and AI in engineering by Md Kamal Hosen.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog",
    description:
      "Notes on BACnet, Niagara 4 commissioning, building automation, IoT, and AI in engineering.",
    url: absoluteUrl("/blog"),
    type: "website",
    images: [
      { url: ogImage, width: 1200, height: 630, alt: "Blog — Md Kamal Hosen" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Md Kamal Hosen",
    description: "Notes on BACnet, Niagara 4, IoT, and AI in engineering.",
    images: [ogImage],
  },
};

async function loadPosts() {
  try {
    const rows = await getPublishedPosts();
    // One aggregation round-trip for the whole listing — keeps
    // render time flat regardless of post count.
    const viewCounts = await getBatchPostViewCounts(rows.map((r) => r.id));
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      // Pulled through unchanged so the <PostDates /> chip on each
      // card can render "Updated …" when the post has been edited
      // after it was first published.
      updatedAt: p.updatedAt,
      readingMinutes: p.readingMinutes,
      tags: p.tags.map((t) => t.slug),
      coverUrl: p.coverUrl,
      viewCount: viewCounts[p.id] ?? 0,
    }));
  } catch (e) {
    console.error("[blog] loadPosts failed:", e);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await loadPosts();

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Notes from commissioning and code"
        description="Field lessons, protocol references, and AI-in-engineering practice. Short, technical, and honest. No filler."
      />
      <section>
        <div className="container py-12 md:py-20">
          {posts.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No published posts yet."
              description="Notes on BACnet, Niagara 4, commissioning, and AI in engineering land here. In the meantime, get in touch if you want a heads-up when I publish."
              action={
                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:shadow-glow"
                >
                  Get notified
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((p, i) => (
                  <ScrollReveal key={p.slug} delay={i * 70}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        {p.coverUrl ? (
                          <Image
                            src={p.coverUrl}
                            alt={`${p.title} cover`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={70}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="cover-gradient-blog absolute inset-0"
                            aria-hidden="true"
                          />
                        )}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="accent">
                              #{t}
                            </Badge>
                          ))}
                          {p.publishedAt && (
                            <PostDates
                              publishedAt={p.publishedAt}
                              updatedAt={p.updatedAt}
                              className="text-muted-foreground text-[11px]"
                            />
                          )}
                        </div>
                        <h2 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-accent">
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p className="text-muted-foreground mt-2 flex-1 text-sm">
                            {p.excerpt}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-5 inline-flex items-center gap-3 font-mono text-xs">
                          <span className="inline-flex items-center gap-1">
                            <span className="opacity-70">·</span>
                            {p.readingMinutes} min read
                          </span>
                          {p.viewCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1"
                              title={`${p.viewCount.toLocaleString()} views`}
                            >
                              <Eye className="h-3 w-3" aria-hidden="true" />
                              {compactCount(p.viewCount)}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
              <p className="text-muted-foreground mt-16 text-center text-xs">
                More posts land as I publish them. Subscribe via{" "}
                <Link
                  href="/contact"
                  className="link-underline text-accent hover:text-accent-soft"
                >
                  contacting me
                </Link>{" "}
                if you want a heads-up.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
