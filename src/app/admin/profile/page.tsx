import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admin/profile-form";
import type { ProfileInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const row = await prisma.profile.findUnique({ where: { id: 1 } });

  const initial: ProfileInput = {
    name: row?.name ?? "",
    role: row?.role ?? "",
    tagline: row?.tagline ?? "",
    location: row?.location ?? "",
    relocate: row?.relocate ?? true,
    email: row?.email ?? "",
    phone: row?.phone ?? "",
    linkedinUrl: row?.linkedinUrl ?? "",
    githubUrl: row?.githubUrl ?? "",
    whatsapp: row?.whatsapp ?? "",
    summary: row?.summary ?? "",
    mission: row?.mission ?? "",
    philosophy: row?.philosophy ?? "",
    values: row?.values ?? [],
    availability: (row?.availability as ProfileInput["availability"]) ?? "open",
    avatarUrl: row?.avatarUrl ?? "",
    cvPdfUrl: row?.cvPdfUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Singleton. Updates flow to the home, about, contact, and CV pages.
        </p>
      </div>
      <ProfileForm initial={initial} />
    </div>
  );
}
