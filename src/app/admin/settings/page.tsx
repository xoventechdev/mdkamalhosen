import { SettingsClient } from "@/components/admin/settings-client";

export const dynamic = "force-dynamic";

function mask(secret: string | undefined): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  return secret.slice(0, 4) + "••••••••";
}

export default function AdminSettingsPage() {
  const revalidateSecretMasked = mask(process.env.REVALIDATE_SECRET);
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
  return (
    <SettingsClient
      revalidateSecretMasked={revalidateSecretMasked}
      smtpConfigured={smtpConfigured}
    />
  );
}