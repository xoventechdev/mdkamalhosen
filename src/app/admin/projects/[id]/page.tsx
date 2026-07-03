import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { connect, ProjectModel, toClient } from "@/lib/db";
import { ProjectForm } from "@/components/admin/project-form";
import type { ProjectInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectEditorPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  await connect();
  const doc = await ProjectModel.findById(id).lean();
  if (!doc) notFound();
  const row = toClient(doc) as unknown as {
    id: string;
    slug: string;
    title: string;
    category: ProjectInput["category"];
    year: string;
    clientType?: string | null;
    excerpt: string;
    coverUrl?: string | null;
    problem?: string | null;
    role?: string | null;
    techStack: string[];
    challenges?: string | null;
    solution?: string | null;
    outcome?: string | null;
    lessons?: string | null;
    galleryImages: string[];
    links?: ProjectInput["links"] | null;
    featured: boolean;
    status: ProjectInput["status"];
    sortOrder: number;
  };

  const initial: ProjectInput & { id: string } = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    year: row.year,
    clientType: row.clientType ?? "",
    excerpt: row.excerpt,
    coverUrl: row.coverUrl ?? "",
    problem: row.problem ?? "",
    role: row.role ?? "",
    techStack: row.techStack,
    challenges: row.challenges ?? "",
    solution: row.solution ?? "",
    outcome: row.outcome ?? "",
    lessons: row.lessons ?? "",
    galleryImages: row.galleryImages,
    links: (row.links as ProjectInput["links"]) ?? null,
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
  };

  const featuredCount = await ProjectModel.countDocuments({
    featured: true,
    status: "published",
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to projects
      </Link>
      <ProjectForm initial={initial} featuredCount={featuredCount} />
    </div>
  );
}