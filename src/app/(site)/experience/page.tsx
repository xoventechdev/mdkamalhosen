import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, ArrowRight, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/badge";
import { getAllExperiences } from "@/server/queries";
import { formatDate, absoluteUrl } from "@/lib/utils";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=default&title=Experience&subtitle=5%2B+years+BMS+across+Bangladesh%2C+Qatar%2C+Saudi+Arabia",
);

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Career timeline of Md Kamal Hosen — BMS Engineer across Bangladesh, Qatar, and Saudi Arabia.",
  alternates: { canonical: "/experience" },
  openGraph: {
    title: "Experience",
    description: "Career timeline of Md Kamal Hosen — BMS Engineer across Bangladesh, Qatar, and Saudi Arabia.",
    url: absoluteUrl("/experience"),
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Experience — Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Experience — Md Kamal Hosen",
    description: "5+ years BMS across Bangladesh, Qatar, Saudi Arabia.",
    images: [ogImage],
  },
};

const fallbackRoles = [
  {
    company: "GLSAN Contracting Company",
    role: "BMS Engineer",
    country: "Saudi Arabia",
    city: "Riyadh",
    startDateLabel: "Sep 2025",
    endDateLabel: null as string | null,
    current: true,
    marquee: "King Abdullah Financial District (KAFD)",
    bullets: [
      "Lead testing, commissioning, and optimisation of BMS networks at the King Abdullah Financial District (KAFD).",
      "Develop logic programming, system configurations, and graphics using Honeywell Alerton and Niagara 4.",
      "Perform functional testing of HVAC systems and validate control sequences.",
      "Diagnose complex BMS integration faults and improve system performance.",
      "Collaborate with consultants, contractors, and vendors to ensure project delivery.",
    ],
    stack: ["Honeywell Alerton", "Niagara 4", "BACnet", "Modbus", "HVAC", "Graphics"],
  },
  {
    company: "Stark Security Services",
    role: "BMS Testing & Commissioning Engineer",
    country: "Qatar",
    city: "Doha",
    startDateLabel: "Nov 2023",
    endDateLabel: "Aug 2025",
    current: false,
    marquee: null,
    bullets: [
      "Programmed and commissioned Honeywell BMS systems including DDC logic and HVAC control strategies.",
      "Integrated third-party equipment through BACnet, Modbus, and M-Bus protocols.",
      "Executed commissioning procedures, troubleshooting, and system validation.",
      "Prepared commissioning reports, test documentation, and as-built records.",
    ],
    stack: ["Honeywell", "DDC", "BACnet", "Modbus", "M-Bus", "Commissioning"],
  },
  {
    company: "Stark Security Services",
    role: "BMS Operator",
    country: "Qatar",
    city: "Doha",
    startDateLabel: "Jul 2020",
    endDateLabel: "Oct 2023",
    current: false,
    marquee: null,
    bullets: [
      "Monitored HVAC, lighting, and energy management systems through central BMS platforms.",
      "Responded to system alarms and coordinated with maintenance teams for issue resolution.",
      "Performed system inspections and supported energy optimisation initiatives.",
    ],
    stack: ["BMS", "HVAC", "Energy Management"],
  },
  {
    company: "Hassanesco",
    role: "BMS Technician",
    country: "Qatar",
    city: "Doha",
    startDateLabel: "Jul 2019",
    endDateLabel: "Jul 2020",
    current: false,
    marquee: null,
    bullets: [
      "Installed and configured sensors, actuators, and DDC controllers.",
      "Supported commissioning teams during system testing and deployment.",
      "Performed preventive maintenance and documented system updates.",
    ],
    stack: ["DDC", "Sensors", "Actuators"],
  },
];

async function loadRoles() {
  try {
    const rows = (await getAllExperiences()) as unknown as Array<{
      company: string;
      role: string;
      country: string;
      city?: string | null;
      startDate: Date;
      endDate?: Date | null;
      current: boolean;
      bullets: string[];
      stack: string[];
      marqueeProject?: string | null;
      sortOrder: number;
    }>;
    if (rows.length === 0) return fallbackRoles;
    return rows.map((r) => ({
      company: r.company,
      role: r.role,
      country: r.country,
      city: r.city,
      startDateLabel: formatDate(r.startDate),
      endDateLabel: r.endDate ? formatDate(r.endDate) : null,
      current: r.current,
      marquee: r.marqueeProject,
      bullets: r.bullets,
      stack: r.stack,
    }));
  } catch (e) {
    console.error("[experience] loadRoles failed:", e);
    return fallbackRoles;
  }
}

export default async function ExperiencePage() {
  const roles = await loadRoles();
  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="5+ years commissioning buildings across the GCC"
        description="A clear progression from technician to lead engineer. Each role taught a different layer of the stack — wiring, integration, operations, commissioning."
      />
      <section>
        <div className="container py-12 md:py-20">
          <ol className="relative space-y-8">
            {/* Continuous rail */}
            <span
              className="absolute left-[7px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-accent via-violet/40 to-transparent sm:block"
              aria-hidden="true"
            />
            {roles.map((r, i) => (
              <ScrollReveal
                as="li"
                key={i}
                delay={i * 80}
                className="relative"
              >
                {/* Timeline node */}
                <span
                  className={`absolute left-0 top-6 hidden h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 sm:flex ${
                    r.current
                      ? "border-accent bg-background"
                      : "border-border bg-muted"
                  }`}
                  aria-hidden="true"
                >
                  {r.current && (
                    <span className="absolute inset-0.5 animate-pulse-ring rounded-full bg-accent" />
                  )}
                </span>

                <article className="relative overflow-hidden rounded-2xl glass-card p-6 sm:ml-10 sm:p-8">
                  {r.current && (
                    <div
                      className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-accent via-violet to-transparent"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h2 className="text-xl font-semibold tracking-tight">
                          {r.role}
                        </h2>
                        {r.current && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-accent">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        {r.company}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {r.city}, {r.country}
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="font-mono text-sm text-muted-foreground">
                        {r.startDateLabel} — {r.endDateLabel ?? "Present"}
                      </p>
                      {r.marquee && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full glass-chip px-2 py-0.5 text-xs text-accent">
                          <Briefcase className="h-3 w-3" aria-hidden="true" />
                          {r.marquee}
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {r.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-sm leading-relaxed"
                      >
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {r.stack.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </ol>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-3 rounded-2xl glass-card p-8 text-center">
            <span className="text-sm text-muted-foreground">
              Need the full CV with dates and certifications?
            </span>
            <Link
              href="/cv"
              className="group inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow"
            >
              Download CV
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}