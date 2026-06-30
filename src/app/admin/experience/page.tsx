import { prisma } from "@/lib/prisma";
import { ExperienceList, type ExperienceRow } from "@/components/admin/experience-list";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const rows = await prisma.experience.findMany({
    orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
  });
  const items: ExperienceRow[] = rows.map((r) => ({
    ...r,
    // Prisma returns Date | null for endDate; narrow for the typed row.
    endDate: r.endDate,
  }));
  return (
    <div className="space-y-6">
      <ExperienceList rows={items} />
    </div>
  );
}
