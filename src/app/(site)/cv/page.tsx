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
import { absoluteUrl } from "@/lib/utils";

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
      "Curriculum vitae of Md Kamal Hosen, Building Management System Engineer. Download the PDF.",
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

const experience = [
  {
    role: "BMS Engineer",
    company: "GLSAN Contracting Company",
    location: "Riyadh, Saudi Arabia",
    dates: "Sep 2025 — Present",
    bullets: [
      "Lead testing, commissioning, and optimisation of BMS networks at KAFD.",
      "Develop logic programming, configurations, and graphics using Honeywell Alerton and Niagara 4.",
      "Validate HVAC control sequences and diagnose integration faults.",
      "Collaborate with consultants, contractors, and vendors.",
    ],
  },
  {
    role: "BMS Testing & Commissioning Engineer",
    company: "Stark Security Services",
    location: "Doha, Qatar",
    dates: "Nov 2023 — Aug 2025",
    bullets: [
      "Programmed and commissioned Honeywell BMS systems (DDC logic + HVAC).",
      "Integrated third-party equipment via BACnet, Modbus, M-Bus.",
      "Prepared commissioning reports, test records, and as-built documentation.",
    ],
  },
  {
    role: "BMS Operator",
    company: "Stark Security Services",
    location: "Doha, Qatar",
    dates: "Jul 2020 — Oct 2023",
    bullets: [
      "Monitored HVAC, lighting, and energy systems from central BMS platforms.",
      "Handled alarms and supported energy optimisation initiatives.",
    ],
  },
  {
    role: "BMS Technician",
    company: "Hassanesco",
    location: "Doha, Qatar",
    dates: "Jul 2019 — Jul 2020",
    bullets: [
      "Installed and configured sensors, actuators, and DDC controllers.",
      "Supported commissioning teams during testing and deployment.",
    ],
  },
];

const certifications = [
  "Niagara 4 BACnet Driver — Tridium University",
  "Commissioning a JACE — Tridium University",
  "BACnet Engineering — Honeywell Buildings University",
  "Honeywell VFD Training — Honeywell Buildings University",
  "Networking Fundamentals — Honeywell Buildings University",
  "Cyber Security in BAS Systems — Honeywell Buildings University",
];

const education = [
  {
    degree: "Bachelor of Arts (Ongoing)",
    school: "Bangladesh Open University",
    year: "Est. 2027",
  },
  {
    degree: "Diploma in Electrical Engineering",
    school: "Bangladesh Youth Technical Training",
    year: "2016",
  },
];

const coreSkills = [
  "Honeywell Alerton",
  "Tridium Niagara 4",
  "DDC Controllers",
  "BACnet (IP/MSTP)",
  "Modbus (RTU/TCP)",
  "M-Bus",
  "HVAC Control Logic",
  "Functional Testing",
  "Energy Optimisation",
  "Java",
  "Python",
  "Node.js",
  "React",
  "Next.js",
  "Prisma",
  "Supabase",
  "MQTT",
  "ESP8266",
  "Android",
  "AI Workflow",
];

export default function CvPage() {
  return (
    <>
      <PageHeader
        eyebrow="Curriculum Vitae"
        title="Md Kamal Hosen — BMS Engineer"
        description="Building Management System Engineer with 5+ years international experience in HVAC automation, smart building technologies, and large-scale BMS commissioning."
        variant="subtle"
      />
      <section>
        <div className="container py-12 md:py-16 print:py-0">
          {/* Contact strip */}
          <ScrollReveal>
            <div className="glass-card mb-10 flex flex-wrap items-center justify-between gap-4 p-5 print:border-black print:bg-white print:text-black">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <a
                  href="mailto:mdkamalhosennn@gmail.com"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" /> mdkamalhosennn@gmail.com
                </a>
                <a
                  href="tel:+966583471377"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" /> +966 58 347 1377
                </a>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> Riyadh, Saudi Arabia
                </span>
                <a
                  href="https://linkedin.com/in/mdkamalhosennn"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" /> LinkedIn
                </a>
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
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                <Building2 className="h-4 w-4" aria-hidden="true" /> Experience
              </h2>
              <ol className="space-y-5">
                {experience.map((e, i) => (
                  <ScrollReveal as="li" key={i} delay={i * 60}>
                    <div className="glass-card p-5 print:border-black print:bg-white">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-semibold">{e.role}</h3>
                        <span className="font-mono text-xs text-muted-foreground">
                          {e.dates}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-accent">{e.company}</p>
                      <p className="text-xs text-muted-foreground">{e.location}</p>
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
                    </div>
                  </ScrollReveal>
                ))}
              </ol>
            </div>

            {/* Side column */}
            <div className="space-y-8">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  <Award className="h-4 w-4" aria-hidden="true" /> Certifications
                </h2>
                <ul className="mt-4 space-y-2">
                  {certifications.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" /> Education
                </h2>
                <ul className="mt-4 space-y-3">
                  {education.map((e) => (
                    <li
                      key={e.degree}
                      className="rounded-lg border border-border bg-card/60 p-3"
                    >
                      <p className="text-sm font-medium">{e.degree}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.school} · {e.year}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Core skills
                </h2>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {coreSkills.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
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