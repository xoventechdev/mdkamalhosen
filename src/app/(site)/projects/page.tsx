import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { EmptyState } from "@/components/ui/empty-state";
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

// Filter chips used by the category toolbar. Static UI config, not a DB
// fallback — leaving as-is so the toolbar always renders the same five options.
const filters = [
  { value: "all", label: "All", color: "text-foreground" },
  { value: "bms", label: "BMS", color: "text-cat-bms" },
  { value: "software", label: "Software", color: "text-cat-software" },
  { value: "iot", label: "IoT", color: "text-cat-iot" },
  { value: "android", label: "Android", color: "text-cat-android" },
];

async function loadProjects(): Promise<ProjectCardData[]> {
  // Errors bubble to the nearest error.tsx — same convention as the home page.
  // No static fallback: an empty DB renders an EmptyState so this page
  // always matches the admin panel's view.
  const rows = (await getPublishedProjects()) as unknown as Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    year: string;
    techStack: string[];
  }>;
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category as ProjectCardData["category"],
    year: p.year,
    techStack: p.techStack,
  }));
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
          {allProjects.length === 0 ? (
            <EmptyState
              icon={<ArrowRight className="h-6 w-6" />}
              title="No published projects yet."
              description="Projects are managed from the admin panel. Create one with status 'published' and it will appear here within seconds."
              action={
                <Link
                  href="/admin/projects"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:shadow-glow"
                >
                  Open admin
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            />
          ) : (
            <ProjectFilter projects={allProjects} filters={filters} />
          )}
        </div>
      </section>
    </>
  );
}
