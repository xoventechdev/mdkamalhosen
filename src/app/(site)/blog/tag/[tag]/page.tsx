import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/badge";
import { JsonLd } from "@/components/json-ld";
import { getPostsByTag, getAllTags } from "@/server/queries";
import { formatDate, absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, websiteJsonLd } from "@/lib/jsonld";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  try {
    const tags = (await getAllTags()) as unknown as Array<{ slug: string }>;
    return tags.map((t) => ({ tag: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const all = ((await getAllTags().catch(() => [])) as unknown) as Array<{
    slug: string;
    name: string;
  }>;
  const found = all.find((t) => t.slug === tag);
  const name = found?.name ?? tag;
  const title = `#${name}`;
  const description = `Blog posts by Md Kamal Hosen tagged ${name}.`;
  const pageUrl = absoluteUrl(`/blog/tag/${tag}`);
  const ogImage = absoluteUrl(
    `/api/og?type=post&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
      description,
    )}`,
  );
  return {
    title,
    description,
    alternates: { canonical: `/blog/tag/${tag}` },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
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

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = ((await getPostsByTag(tag).catch(() => [])) as unknown) as Array<{
    slug: string;
    title: string;
    excerpt?: string | null;
    publishedAt?: Date | null;
    readingMinutes: number;
    tags: Array<{ id: string; slug: string; name: string }>;
  }>;
  const allTags = ((await getAllTags().catch(() => [])) as unknown) as Array<{
    slug: string;
    name: string;
  }>;
  const current = allTags.find((t) => t.slug === tag);
  if (!current) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: `#${current.name}`, href: `/blog/tag/${current.slug}` },
          ]),
          websiteJsonLd({ description: `Posts tagged #${current.name}` }),
        ]}
      />
      <PageHeader
        eyebrow="Tag"
        title={`#${current.name}`}
        description={
          posts.length > 0
            ? `${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged ${current.name}.`
            : "No posts under this tag yet."
        }
      />
      <section>
        <div className="container py-16 md:py-20">
          {posts.length === 0 ? (
            <div className="glass-card mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border-dashed p-10 text-center">
              <p className="text-base font-medium text-foreground">Nothing here yet.</p>
              <p className="text-sm text-muted-foreground">
                Posts tagged <span className="font-mono">#{current.name}</span> will
                land here when published.
              </p>
              <Link
                href="/blog"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg glass-chip px-4 text-sm font-medium text-foreground hover:bg-card"
              >
                <ArrowRight className="h-4 w-4 rotate-180" /> Back to blog
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 70}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                  >
                    <div className="cover-gradient-blog aspect-[16/9]" aria-hidden="true" />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.tags.slice(0, 2).map((t) => (
                          <Badge key={t.id} variant="accent">#{t.slug}</Badge>
                        ))}
                        {p.publishedAt && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatDate(p.publishedAt, { month: true, year: true })}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-accent">
                        {p.title}
                      </h2>
                      {p.excerpt && (
                        <p className="mt-2 flex-1 text-sm text-muted-foreground">
                          {p.excerpt}
                        </p>
                      )}
                      <p className="mt-4 font-mono text-xs text-muted-foreground">
                        {p.readingMinutes} min read
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}