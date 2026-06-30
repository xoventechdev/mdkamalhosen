import { prisma } from "@/lib/prisma";
import { SkillsList, type SkillGroupRow } from "@/components/admin/skills-list";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const groups = await prisma.skillGroup.findMany({
    include: { skills: { orderBy: [{ sortOrder: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }],
  });
  const items: SkillGroupRow[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    sortOrder: g.sortOrder,
    skills: g.skills.map((s) => ({
      id: s.id,
      name: s.name,
      platform: s.platform,
      years: s.years,
      level: s.level,
      sortOrder: s.sortOrder,
    })),
  }));
  return (
    <div className="space-y-6">
      <SkillsList groups={items} />
    </div>
  );
}