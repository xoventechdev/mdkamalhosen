import { SettingsClient, type AiSettingsView } from "@/components/admin/settings-client";
import { ChangePasswordCard } from "@/components/admin/change-password-card";
import { getAiSettings } from "@/server/actions";
import { maskSecret } from "@/lib/crypto-secret";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const revalidateSecretMasked = maskSecret(process.env.REVALIDATE_SECRET);
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
  const aiView: AiSettingsView | null = await getAiSettings();
  return (
    <div className="space-y-6">
      <SettingsClient
        revalidateSecretMasked={revalidateSecretMasked}
        smtpConfigured={smtpConfigured}
        aiSettings={aiView}
      />
      <ChangePasswordCard />
    </div>
  );
}