import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  Sparkles,
  Building2,
  Code2,
  Cpu,
  Smartphone,
  Mail,
  MapPin,
  Briefcase,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SectionHeading } from "@/components/section-heading";
import { StatGrid } from "@/components/stat-grid";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { getFeaturedProjects, getLatestPosts } from "@/server/queries";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Static content arrays (no DB dependency — render immediately).
// ---------------------------------------------------------------------------

const proof = [
  "5+ years international",
  "Honeywell Alerton",
  "Niagara 4 certified",
  "KAFD commissioning",
  "100K+ app downloads",
  "Open to relocation",
  "BACnet · Modbus · M-Bus",
  "DDC controllers",
  "Graphics",
];

const workflow = [
  { step: "01", label: "Planning", icon: Sparkles, color: "text-cat-bms" },
  { step: "02", label: "Documentation", icon: Code2, color: "text-cat-software" },
  { step: "03", label: "Coding", icon: Cpu, color: "text-cat-iot" },
  { step: "04", label: "Troubleshooting", icon: Building2, color: "text-cat-android" },
  { step: "05", label: "Research", icon: Smartphone, color: "text-accent" },
];

const bmsTechTags = [
  "Honeywell Alerton",
  "Niagara 4",
  "BACnet",
  "Modbus",
  "M-Bus",
  "DDC",
  "HVAC",
  "Graphics",
];

const softwareTags = ["React", "Next.js", "Node.js", "MQTT", "ESP8266", "Android"];

// ---------------------------------------------------------------------------
// Static JSX blocks, extracted as named components.
// Each renders synchronously inside <HomePage> with no DB call.
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container relative pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-40">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 rounded-full glass-chip px-3 py-1.5 text-xs font-medium text-foreground/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500/80" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Open to relocation · UK &amp; Europe
              </span>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <p className="mt-6 font-mono text-sm text-accent">
                {"// Md Kamal Hosen"}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <h1 className="mt-3 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.5rem]">
                Building Management System Engineer{" "}
                <span className="text-gradient">
                  commissioning HVAC plants
                </span>{" "}
                and shipping the software that runs them.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                5+ years across Bangladesh, Qatar, and Saudi Arabia on Honeywell
                Alerton and Tridium Niagara 4 platforms. I bridge IT and OT in
                modern smart buildings — and build the tools that make them
                smarter.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={280}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/projects"
                  className="group inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-br from-violet to-accent px-6 text-sm font-medium text-white shadow-glow transition-all"
                >
                  View projects
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/cv"
                  className="inline-flex h-11 items-center gap-2 rounded-lg glass-chip px-6 text-sm font-medium backdrop-blur-md transition-all hover:border-accent/40 hover:bg-card"
                >
                  <Download className="h-4 w-4" aria-hidden="true" /> Download CV
                </Link>
                <a
                  href="https://linkedin.com/in/mdkamalhosennn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  LinkedIn <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right column — hero glass stat card */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={160}>
              <div className="glass-card relative overflow-hidden p-7">
                <div
                  className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet/30 to-accent/20 blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-br from-cat-iot/20 to-cat-software/20 blur-3xl"
                  aria-hidden="true"
                />

                <p className="inline-flex items-center gap-1.5 rounded-full glass-chip px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Currently
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Lead BMS Engineer
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  GLSAN Contracting · Riyadh, Saudi Arabia
                </p>

                <dl className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-card/60 p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Started
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">Sep 2025</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Project
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">KAFD</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Stack
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">Niagara 4</dd>
                  </div>
                </dl>

                <div className="mt-6 space-y-3 border-t border-border pt-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>BMS commissioning &amp; integration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>HVAC control logic &amp; graphics</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>Riyadh · open to UK / EU</span>
                  </div>
                </div>

                <Link
                  href="/experience"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-soft"
                >
                  Full career timeline <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeBar() {
  return (
    <section className="relative border-y border-border bg-card/30 py-4 backdrop-blur-sm">
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-12 px-6 text-sm text-muted-foreground">
          {[...proof, ...proof].map((item, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="border-b border-border">
      <div className="container py-16">
        <StatGrid />
      </div>
    </section>
  );
}

function Bento() {
  return (
    <section className="border-b border-border">
      <div className="container py-20 md:py-28">
        <SectionHeading
          eyebrow="What I do"
          title="Two disciplines, one operator"
          description={
            <>
              Most BMS engineers do not ship software. Most developers do not
              understand HVAC controllers. I do both — and the combination is
              where the smart buildings of the next decade get built.
            </>
          }
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {/* Large BMS card */}
          <ScrollReveal
            as="article"
            className="group relative overflow-hidden rounded-2xl glass-card p-7 transition-all hover:-translate-y-1 hover:shadow-card-hover lg:col-span-2"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cat-bms/30 to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-cat-bms">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-semibold tracking-tight">
                Building automation
              </h3>
            </div>
            <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Honeywell Alerton · Tridium Niagara 4 · BACnet IP/MSTP · Modbus
              RTU/TCP · M-Bus · DDC controllers · HVAC control logic ·
              commissioning · graphics.
            </p>
            <div className="relative mt-6 flex flex-wrap gap-1.5">
              {bmsTechTags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* Smaller Software card */}
          <ScrollReveal
            as="article"
            delay={100}
            className="group relative overflow-hidden rounded-2xl glass-card p-7 transition-all hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cat-software/30 to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-cat-software">
                <Code2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-semibold tracking-tight">
                Software + IoT
              </h3>
            </div>
            <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">
              React · Next.js · Node.js · Python · Prisma · Supabase · MQTT ·
              ESP8266 · Android apps (100K+ downloads).
            </p>
            <div className="relative mt-6 flex flex-wrap gap-1.5">
              {softwareTags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="border-b border-border">
      <div className="container py-20 md:py-28">
        <SectionHeading
          eyebrow="Workflow"
          title="How I work"
          description="AI is integrated into every step of my engineering workflow, not bolted on at the end."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {workflow.map((w, i) => (
            <ScrollReveal
              as="article"
              key={w.label}
              delay={i * 80}
              className="group relative overflow-hidden rounded-2xl glass-card p-5 transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs ${w.color}`}>{w.step}</span>
                <w.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium">{w.label}</p>
              <span
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative">
      <div className="container relative py-24 text-center md:py-32">
        <ScrollReveal>
          <span className="inline-flex items-center gap-2 rounded-full glass-chip px-3 py-1.5 text-xs font-medium text-foreground/90">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Open to opportunities
          </span>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Looking for a BMS engineer{" "}
            <span className="text-gradient">who also builds</span>?
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Open to relocation across UK and Europe. Let&apos;s talk about your
            next project.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={260}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-br from-violet to-accent px-6 text-sm font-medium text-white shadow-glow-violet transition-all"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Get in touch
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/cv"
              className="inline-flex h-11 items-center gap-2 rounded-lg glass-chip px-6 text-sm font-medium backdrop-blur-md transition-all hover:bg-card"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> CV
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders — shown by <Suspense> while DB queries resolve.
// aria-busy / role="status" gives assistive tech a hint that the region is
// still updating.
// ---------------------------------------------------------------------------

function FeaturedProjectsSkeleton() {
  return (
    <section className="border-b border-border" aria-busy="true" aria-label="Loading featured projects">
      <div className="container py-20 md:py-28">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-muted/40"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestPostsSkeleton() {
  return (
    <section className="border-b border-border" aria-busy="true" aria-label="Loading latest posts">
      <div className="container py-20 md:py-28">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl bg-muted/40"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Data-driven sections (rendered inside <Suspense>).
// Each one calls the DB directly. If the query returns empty, we render an
// empty state — no fallback data, no try/catch — errors bubble to error.tsx.
// ---------------------------------------------------------------------------

async function FeaturedProjectsSection() {
  const projects = (await getFeaturedProjects()) as unknown as Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    year: number;
    coverUrl?: string | null;
    techStack: string[];
  }>;

  if (projects.length === 0) {
    return (
      <section className="border-b border-border">
        <div className="container py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Selected work"
              title="Featured projects"
              description="Three pieces of work that show both sides of what I do."
            />
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              All projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-12 text-sm text-muted-foreground">
            No published projects yet.
          </p>
        </div>
      </section>
    );
  }

  const cards: ProjectCardData[] = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category as ProjectCardData["category"],
    year: p.year,
    techStack: p.techStack,
  }));

  return (
    <section className="border-b border-border">
      <div className="container py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Selected work"
            title="Featured projects"
            description="Three pieces of work that show both sides of what I do."
          />
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            All projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((p, i) => (
            <ScrollReveal key={p.slug} delay={i * 90}>
              <ProjectCard project={p} className="h-full" />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

async function LatestPostsSection() {
  const posts = (await getLatestPosts()) as unknown as Array<{
    slug: string;
    title: string;
    excerpt?: string | null;
    publishedAt?: Date | null;
    readingMinutes: number;
    tags: Array<{ slug: string }>;
  }>;

  // If no published posts exist, render nothing — no fallback content. The
  // surrounding page still works; this section just doesn't appear.
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border">
      <div className="container py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Latest from the blog"
            title="Recent writing"
          />
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            All posts <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {posts.map((p, i) => (
            <ScrollReveal key={p.slug} delay={i * 80}>
              <Link
                href={`/blog/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div
                  className="cover-gradient-blog aspect-[16/10]"
                  aria-hidden="true"
                />
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatDate(p.publishedAt, { month: true, year: true })}
                    {" · "}
                    {p.readingMinutes} min read
                  </p>
                  <h3 className="mt-3 text-base font-semibold tracking-tight group-hover:text-accent">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {p.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page composition. Static sections render immediately. Data-dependent
// sections stream in via <Suspense> fallbacks while their queries resolve.
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeBar />
      <StatsSection />
      <Bento />

      <Suspense fallback={<FeaturedProjectsSkeleton />}>
        <FeaturedProjectsSection />
      </Suspense>

      <Workflow />

      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPostsSection />
      </Suspense>

      <CTA />
    </>
  );
}
