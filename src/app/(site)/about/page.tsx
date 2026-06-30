import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Code2,
  Cpu,
  Download,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ScrollSpyNav } from "@/components/scroll-spy-nav";
import { JsonLd } from "@/components/json-ld";
import { getProfile } from "@/server/queries";
import { paragraphs, absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=default&title=About&subtitle=BMS+Engineer+%C2%B7+Bangladesh+%E2%86%92+Qatar+%E2%86%92+Saudi+Arabia",
);

export const metadata: Metadata = {
  title: "About",
  description:
    "Md Kamal Hosen — BMS Engineer combining building automation with software development and AI. Bangladesh → Qatar → Saudi Arabia, moving toward international smart-building consultancy.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About",
    description:
      "Md Kamal Hosen — BMS Engineer combining building automation with software development and AI.",
    url: absoluteUrl("/about"),
    type: "profile",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "About Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About",
    description:
      "Md Kamal Hosen — BMS Engineer combining building automation with software development and AI.",
    images: [ogImage],
  },
};

const timeline = [
  {
    year: "2019",
    place: "Doha, Qatar",
    role: "BMS Technician",
    company: "Hassanesco",
    summary:
      "Installed and configured sensors, actuators, and DDC controllers. First exposure to live commissioning teams.",
    color: "text-cat-bms",
  },
  {
    year: "2020",
    place: "Doha, Qatar",
    role: "BMS Operator",
    company: "Stark Security Services",
    summary:
      "Monitored HVAC, lighting, and energy management from central BMS platforms. Responded to alarms, supported energy optimisation.",
    color: "text-cat-bms",
  },
  {
    year: "2023",
    place: "Doha, Qatar",
    role: "BMS Testing & Commissioning Engineer",
    company: "Stark Security Services",
    summary:
      "Programmed and commissioned Honeywell BMS systems. Integrated third-party equipment via BACnet, Modbus, M-Bus. Wrote as-built records.",
    color: "text-cat-software",
  },
  {
    year: "2025",
    place: "Riyadh, Saudi Arabia",
    role: "BMS Engineer",
    company: "GLSAN Contracting Company",
    summary:
      "Lead testing, commissioning, and optimisation at the King Abdullah Financial District (KAFD). Niagara 4 logic, graphics, fault diagnosis.",
    color: "text-accent",
    current: true,
  },
];

const spySections = [
  { id: "story", label: "Story", href: "#story" },
  { id: "journey", label: "Journey", href: "#journey" },
  { id: "philosophy", label: "Philosophy", href: "#philosophy" },
  { id: "cta", label: "Get in touch", href: "#cta" },
];

export default async function AboutPage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <main className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">Profile not yet created.</p>
      </main>
    );
  }

  const displayValues = profile.values ?? [];
  const mission = profile.mission ?? "";
  const story = profile.summary ? paragraphs(profile.summary) : [];

  return (
    <>
      {/* Person JSON-LD is emitted by the root layout (site-wide). About page
          only contributes its breadcrumb so Google sees a single Person entry. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ])}
      />
      <PageHeader
        eyebrow="About"
        title={
          <>
            I commission building automation systems — and build the software that
            makes them smarter.
          </>
        }
        description="5+ years across Bangladesh, Qatar, and Saudi Arabia. My career sits at the intersection of two disciplines that rarely meet: hands-on BMS commissioning and software development."
      />

      {/* Story */}
      <section id="story" data-spy-target="true" className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2">
              <p className="inline-flex items-center gap-1.5 rounded-full glass-chip px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Story
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                A path that does not fit a template
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                {story.map((p, i) => (
                  <p key={i}>
                    {i === 2 ? (
                      <>
                        Today I lead BMS commissioning at{" "}
                        <span className="font-medium text-foreground">
                          King Abdullah Financial District (KAFD)
                        </span>{" "}
                        in Riyadh while continuing to ship software on the side. The
                        next chapter is international smart-building consultancy —
                        combining Niagara 4 field work with cloud BMS, digital twins,
                        and AI-assisted commissioning.
                      </>
                    ) : (
                      p
                    )}
                  </p>
                ))}
              </div>
            </div>

            <ScrollReveal delay={150}>
              <div className="glass-card sticky top-24 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Mission
                </p>
                <p className="mt-3 text-pretty text-base leading-relaxed">
                  {mission}
                </p>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    What I value
                  </p>
                  <ul className="mt-3 space-y-2">
                    {displayValues.map((v) => (
                      <li
                        key={v}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section id="journey" data-spy-target="true" className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="flex flex-col gap-2">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full glass-chip px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Journey
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Bangladesh → Qatar → Saudi Arabia
            </h2>
          </div>
          <ol className="mt-10 space-y-0">
            {timeline.map((t, i) => (
              <ScrollReveal as="li" key={i} delay={i * 80}>
                <div className="relative flex gap-4 border-l border-border pb-10 pl-6 last:border-l-transparent last:pb-0 sm:gap-6">
                  <span
                    className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                      t.current ? "bg-accent" : "bg-muted-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {t.current && (
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
                    )}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className={`font-mono text-sm ${t.color}`}>
                        {t.year}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t.place}
                      </span>
                      {t.current && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Current
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">
                      {t.role}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.company}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {t.summary}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" data-spy-target="true" className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="flex flex-col gap-2">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full glass-chip px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
              <Compass className="h-3 w-3 text-accent" aria-hidden="true" /> Philosophy
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How I think about engineering work
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Building2,
                color: "text-cat-bms",
                title: "Solve engineering problems",
                body: "I do not write software because I enjoy coding. I build tools because something on a site is repetitive, error-prone, or slow.",
              },
              {
                icon: Code2,
                color: "text-cat-software",
                title: "Bridge IT and OT",
                body: "Most crews speak only one side. Translating between software and HVAC controllers is where I add the most value to a project.",
              },
              {
                icon: Cpu,
                color: "text-cat-iot",
                title: "AI in the workflow",
                body: "AI is built into planning, documentation, coding, and research — but I never ship something I would not defend in front of a consultant.",
              },
            ].map((card, i) => (
              <ScrollReveal key={card.title} delay={i * 120}>
                <div className="glass-card h-full p-6">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${card.color}`}
                  >
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" data-spy-target="true">
        <div className="container py-16 text-center md:py-20">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Want the full picture?
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/experience"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow"
            >
              See full experience{" "}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/cv"
              className="inline-flex h-11 items-center gap-2 rounded-lg glass-chip px-6 text-sm font-medium hover:bg-card"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Download CV
            </Link>
          </div>
        </div>
      </section>

      {/* Floating scroll-spy nav for desktop */}
      <div className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <div className="pointer-events-auto">
          <ScrollSpyNav sections={spySections} className="glass-side px-4 py-4" />
        </div>
      </div>
    </>
  );
}