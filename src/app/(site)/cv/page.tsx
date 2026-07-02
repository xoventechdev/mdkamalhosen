import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Award,
  GraduationCap,
  Building2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/badge";
import {
  getProfile,
  getAllExperiences,
  getAllCertifications,
  getAllEducation,
  getSkillGroups,
} from "@/server/queries";
import { formatDate, absoluteUrl } from "@/lib/utils";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=default&title=CV&subtitle=Building+Management+System+Engineer+%C2%B7+Riyadh%2C+KSA",
);

export const metadata: Metadata = {
  title: "CV — Md Kamal Hosen",
  description:
    "Curriculum vitae of Md Kamal Hosen, Building Management System Engineer. Download the PDF.",
  alternates: { canonical: "/cv" },
  openGraph: {
    title: "CV — Md Kamal Hosen",
    description:
      "Curriculum vitae of Md Kamal Hosen, Building Management System Engineer.",
    url: absoluteUrl("/cv"),
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "CV — Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CV — Md Kamal Hosen",
    description: "Curriculum vitae — BMS Engineer · Riyadh, KSA.",
    images: [ogImage],
  },
};

type Experience = {
  company: string;
  role: string;
  country: string;
  city?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  current: boolean;
  bullets: string[];
};

type Certification = {
  name: string;
  issuer: string;
  year?: number | null;
};

type Education = {
  degree: string;
  institution: string;
  startYear: number;
  endYear?: number | null;
  status: string;
};

type Skill = {
  name: string;
  level: number;
};

type Profile = {
  name: string;
  role: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  summary?: string | null;
};

function dateRange(start: Date | string, end: Date | string | null | undefined): string {
  return `${formatDate(start)} — ${end ? formatDate(end) : "Present"}`;
}

export default async function CvPage() {
  // Single roundtrip per entity. The queries are wrapped in
  // `unstable_cache` (60s revalidate) so the public site stays fast
  // and any admin edit lands here within a minute. We swallow per-query
  // errors so one broken collection (e.g. the DB being briefly down)
  // doesn't take the whole CV down — empty sections render an inline
  // hint instead.
  const [profile, experiences, certifications, education, skillGroups] = await Promise.all([
    getProfile().catch(() => null) as Promise<Profile | null>,
    getAllExperiences().catch(() => []) as Promise<Experience[]>,
    getAllCertifications().catch(() => []) as Promise<Certification[]>,
    getAllEducation().catch(() => []) as Promise<Education[]>,
    getSkillGroups().catch(() => []) as Promise<Array<{ name: string; skills: Skill[] }>>,
  ]);

  // Core skills: anything at level 3+ ("Proficient", "Advanced", "Expert").
  // Sorted by level desc, then name asc, capped so the sidebar stays tidy.
  const coreSkills = skillGroups
    .flatMap((g) => g.skills)
    .filter((s) => s.level >= 3)
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
    .map((s) => s.name);

  return (
    <>
      <PageHeader
        eyebrow="Curriculum Vitae"
        title={`${profile?.name ?? "Md Kamal Hosen"} — ${profile?.role ?? "BMS Engineer"}`}
        description={
          profile?.summary ??
          "Building Management System Engineer with 5+ years international experience in HVAC automation, smart building technologies, and large-scale BMS commissioning."
        }
        variant="subtle"
      />
      <section>
        <div className="container py-12 md:py-16 print:py-0">
          {/* Contact strip */}
          <ScrollReveal>
            <div className="glass-card mb-10 flex flex-wrap items-center justify-between gap-4 p-5 print:border-black print:bg-white print:text-black">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" /> {profile.email}
                  </a>
                )}
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" /> {profile.phone}
                  </a>
                )}
                {profile?.location && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> {profile.location}
                  </span>
                )}
                {profile?.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                  >
                    <Linkedin className="h-4 w-4" aria-hidden="true" /> LinkedIn
                  </a>
                )}
              </div>
              <a
                href="/cv/kamal-hosen-cv.pdf"
                download
                className="group inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow print:hidden"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
              </a>
            </div>
          </ScrollReveal>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main column — Experience */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                <Building2 className="h-4 w-4" aria-hidden="true" /> Experience
              </h2>
              {experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No experience entries yet.
                </p>
              ) : (
                <ol className="space-y-5">
                  {experiences.map((e, i) => (
                    <ScrollReveal as="li" key={`${e.company}-${e.role}-${String(e.startDate)}`} delay={i * 60}>
                      <div className="glass-card p-5 print:border-black print:bg-white">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-base font-semibold">{e.role}</h3>
                          <span className="font-mono text-xs text-muted-foreground">
                            {dateRange(e.startDate, e.endDate)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-accent">{e.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {[e.city, e.country].filter(Boolean).join(", ")}
                        </p>
                        {e.bullets.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {e.bullets.map((b, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ScrollReveal>
                  ))}
                </ol>
              )}
            </div>

            {/* Side column */}
            <div className="space-y-8">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  <Award className="h-4 w-4" aria-hidden="true" /> Certifications
                </h2>
                {certifications.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No certifications yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {certifications.map((c) => (
                      <li
                        key={`${c.name}-${c.issuer}`}
                        className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span> — {c.issuer}</span>
                        {c.year ? (
                          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                            ({c.year})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" /> Education
                </h2>
                {education.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No education entries yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {education.map((e) => (
                      <li
                        key={`${e.degree}-${e.institution}-${e.startYear}`}
                        className="rounded-lg border border-border bg-card/60 p-3"
                      >
                        <p className="text-sm font-medium">{e.degree}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.institution} · {e.startYear} — {e.endYear ?? "Present"}
                          {e.status === "ongoing" ? " · ongoing" : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Core skills
                </h2>
                {coreSkills.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No skills yet.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {coreSkills.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 text-center print:hidden">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}