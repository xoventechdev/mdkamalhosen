import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { getPublishedProjects } from "@/server/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=project&title=Projects&subtitle=BMS+%C2%B7+Software+%C2%B7+IoT+%C2%B7+Android",
);

export const metadata: Metadata = {
  title: "Projects",
  description:
    "BMS, software, IoT, and Android projects by Md Kamal Hosen — with case studies in problem, role, technology, challenges, solution, outcome, and lessons learned.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects",
    description:
      "BMS, software, IoT, and Android projects by Md Kamal Hosen — case studies with problems, roles, tech stacks, and outcomes.",
    url: absoluteUrl("/projects"),
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Projects — Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects — Md Kamal Hosen",
    description: "BMS, software, IoT, and Android projects with full case studies.",
    images: [ogImage],
  },
};

const filters = [
  { value: "all", label: "All", color: "text-foreground" },
  { value: "bms", label: "BMS", color: "text-cat-bms" },
  { value: "software", label: "Software", color: "text-cat-software" },
  { value: "iot", label: "IoT", color: "text-cat-iot" },
  { value: "android", label: "Android", color: "text-cat-android" },
];

const projects = [
  {
    slug: "kafd-bms-commissioning",
    title: "KAFD District — BMS Commissioning",
    excerpt:
      "Commissioning BMS networks across the King Abdullah Financial District.",
    category: "bms" as const,
    year: 2025,
    techStack: ["Honeywell Alerton", "Niagara 4", "BACnet", "Modbus"],
  },
  {
    slug: "red-palace-bms",
    title: "Red Palace — BMS Integration",
    excerpt:
      "BMS commissioning and graphics deliverables for a heritage commercial site.",
    category: "bms" as const,
    year: 2024,
    techStack: ["Honeywell", "BACnet", "Modbus", "M-Bus"],
  },
  {
    slug: "resume-builder",
    title: "Resume Builder",
    excerpt:
      "A web tool to generate role-targeted resumes from structured data.",
    category: "software" as const,
    year: 2024,
    techStack: ["Next.js", "TypeScript", "Prisma", "Supabase"],
  },
  {
    slug: "attendance-system",
    title: "Attendance System",
    excerpt:
      "Time-and-attendance tracking built for small engineering teams.",
    category: "software" as const,
    year: 2023,
    techStack: ["Node.js", "MySQL", "React"],
  },
  {
    slug: "iot-dashboard",
    title: "IoT Dashboard",
    category: "iot" as const,
    excerpt: "Real-time MQTT dashboard for ESP8266 sensor networks.",
    year: 2023,
    techStack: ["Node.js", "MQTT", "ESP8266"],
  },
  {
    slug: "android-100k-downloads",
    title: "Android App — 100K+ Downloads",
    category: "android" as const,
    excerpt: "Published Android application with over 100,000 downloads.",
    year: 2022,
    techStack: ["Android", "Java", "REST"],
  },
];

async function loadProjects(): Promise<ProjectCardData[]> {
  try {
    const rows = (await getPublishedProjects()) as unknown as Array<{
      slug: string;
      title: string;
      excerpt: string;
      category: string;
      year: number;
      techStack: string[];
    }>;
    if (rows.length === 0) return projects;
    return rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category as ProjectCardData["category"],
      year: p.year,
      techStack: p.techStack,
    }));
  } catch (e) {
    console.error("[projects] loadProjects failed:", e);
    return projects;
  }
}

// ProjectFilter is a client component because the chips toggle state in the
// browser — no extra round-trips to the server.
import { ProjectFilter } from "@/components/project-filter";

export default async function ProjectsPage() {
  const allProjects = await loadProjects();
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Case studies across BMS and software"
        description="Each project is documented in seven parts — problem, role, technology, challenges, solution, outcome, and lessons learned. Filter by domain below."
      />
      <section>
        <div className="container py-16 md:py-20">
          <ProjectFilter projects={allProjects} filters={filters} />
        </div>
      </section>
    </>
  );
}