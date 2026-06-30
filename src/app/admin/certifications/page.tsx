import { prisma } from "@/lib/prisma";
import { CertificationsList } from "@/components/admin/certifications-list";

export const dynamic = "force-dynamic";

export default async function AdminCertificationsPage() {
  const rows = await prisma.certification.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return (
    <div className="space-y-6">
      <CertificationsList rows={rows} />
    </div>
  );
}