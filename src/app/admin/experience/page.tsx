import { getAllExperiences } from "@/server/queries";
import { ExperienceList } from "@/components/admin/experience-list";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const rows = await getAllExperiences();
  return (
    <div className="space-y-6">
      <ExperienceList rows={rows as never} />
    </div>
  );
}
