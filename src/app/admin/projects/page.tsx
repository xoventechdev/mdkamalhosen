import Link from "next/link";
import { Plus, Star, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, CategoryBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function createNewProject() {
  "use server";
  const { redirect } = await import("next/navigation");
  const { createProject } = await import("@/server/actions");
  const res = await createProject({
    slug: `untitled-${Date.now()}`,
    title: "Untitled project",
    category: "bms",
    year: new Date().getFullYear(),
    excerpt: "Click to edit this project's description.",
    techStack: [],
    galleryImages: [],
    featured: false,
    status: "draft",
    sortOrder: 0,
  });
  if (res.ok && res.id) {
    redirect(`/admin/projects/${res.id}`);
  }
}

export default async function AdminProjectsPage() {
  const rows = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <form action={createNewProject}>
          <Button type="submit">
            <Plus className="h-4 w-4" /> New project
          </Button>
        </form>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5}>No projects yet. Create one.</TableEmpty>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {row.featured && <Star className="h-3.5 w-3.5 text-amber-500" />}
                    {row.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.slug}</div>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={row.category} />
                </TableCell>
                <TableCell>{row.year}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "published" ? "accent" : "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/projects/${row.id}`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}