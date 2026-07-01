import { getAllEducation } from "@/server/queries";
import { EducationList } from "@/components/admin/education-list";

export const dynamic = "force-dynamic";

export default async function AdminEducationPage() {
  const rows = await getAllEducation();
  return (
    <div className="space-y-6">
      <EducationList rows={rows as never} />
    </div>
  );
}