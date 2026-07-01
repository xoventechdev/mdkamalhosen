import { getAllCertifications } from "@/server/queries";
import { CertificationsList } from "@/components/admin/certifications-list";

export const dynamic = "force-dynamic";

export default async function AdminCertificationsPage() {
  const rows = await getAllCertifications();
  return (
    <div className="space-y-6">
      <CertificationsList rows={rows as never} />
    </div>
  );
}