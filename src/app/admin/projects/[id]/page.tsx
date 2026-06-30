import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";
import type { ProjectInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectEditorPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) notFound();

  const initial: ProjectInput & { id: number } = {
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

  const featuredCount = await prisma.project.count({
    where: { featured: true, status: "published" },
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