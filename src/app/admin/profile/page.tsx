import { getProfile } from "@/server/queries";
import { ProfileForm } from "@/components/admin/profile-form";
import type { ProfileInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const row = (await getProfile()) as unknown as
    | (Partial<ProfileInput> & { values?: string[] })
    | null;

  const initial: ProfileInput = {
    name: row?.name ?? "",
    role: row?.role ?? "",
    tagline: row?.tagline ?? "",
    location: row?.location ?? "",
    relocate: row?.relocate ?? true,
    lookingToNewOpportunity: row?.lookingToNewOpportunity ?? true,
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
    highlights: row?.highlights ?? [],
    preferredLocations: row?.preferredLocations ?? [],
    siteTitle: row?.siteTitle ?? "",
    siteDescription: row?.siteDescription ?? "",
    siteKeywords: row?.siteKeywords ?? [],
    twitterHandle: row?.twitterHandle ?? "",
    stats: row?.stats ?? [],
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
