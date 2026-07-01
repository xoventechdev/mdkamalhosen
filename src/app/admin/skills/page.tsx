import { getSkillGroups } from "@/server/queries";
import { SkillsList, type SkillGroupRow } from "@/components/admin/skills-list";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const groups = (await getSkillGroups()) as unknown as Array<{
    id: string;
    name: string;
    sortOrder: number;
    skills: Array<{
      id: string;
      name: string;
      platform?: string | null;
      years?: number | null;
      level: number;
      sortOrder: number;
    }>;
  }>;
  const items: SkillGroupRow[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    sortOrder: g.sortOrder,
    skills: g.skills.map((s) => ({
      id: s.id,
      name: s.name,
      platform: s.platform ?? null,
      years: s.years ?? null,
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