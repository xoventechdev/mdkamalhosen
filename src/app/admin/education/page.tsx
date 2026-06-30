import { prisma } from "@/lib/prisma";
import { EducationList } from "@/components/admin/education-list";

export const dynamic = "force-dynamic";

export default async function AdminEducationPage() {
  const rows = await prisma.education.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return (
    <div className="space-y-6">
      <EducationList rows={rows} />
    </div>
  );
}