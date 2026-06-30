"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw, Mail, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { revalidateAll } from "@/server/actions";

export interface SettingsClientProps {
  revalidateSecretMasked: string;
  smtpConfigured: boolean;
}

export function SettingsClient({ revalidateSecretMasked, smtpConfigured }: SettingsClientProps) {
  const [pending, startTransition] = useTransition();

  function revalidateEverything() {
    startTransition(async () => {
      const res = await revalidateAll();
      if (res.ok) toast.success("All caches revalidated.");
      else toast.error(res.error);
    });
  }

  async function revalidateHome() {
    startTransition(async () => {
      const res = await fetch(`/api/revalidate?secret=${encodeURIComponent(process.env.NEXT_PUBLIC_REVALIDATE_FALLBACK ?? "")}&path=/`);
      // The route is server-side and uses process.env.REVALIDATE_SECRET;
      // we can't expose it client-side. Fall back to action above.
      if (!res.ok) {
        const res2 = await revalidateAll();
        if (res2.ok) toast.success("All caches revalidated.");
        else toast.error(res2.error);
      } else {
        toast.success("Home revalidated.");
      }
    });
  }

  async function smokeTestSmtp() {
    startTransition(async () => {
      // Call the contact route with a no-op payload; if SMTP is wired,
      // the server will attempt a verify. We use a magic route instead.
      try {
        const res = await fetch("/api/admin/smtp-test", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.ok) toast.success("SMTP transport verified.");
        else toast.error(data.error ?? "SMTP failed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "SMTP test failed.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cache and integration controls. Sensitive values are read from environment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Revalidation
          </CardTitle>
          <CardDescription>
            Flush cached server-rendered pages. Useful if you change content directly in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={revalidateEverything} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" /> Revalidate everything
          </Button>
          <Button variant="secondary" onClick={revalidateHome} disabled={pending}>
            Revalidate home only
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> SMTP
          </CardTitle>
          <CardDescription>
            Used by the contact form to forward submissions to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Status:{" "}
            {smtpConfigured ? (
              <span className="font-medium text-emerald-600">Configured</span>
            ) : (
              <span className="text-muted-foreground">
                Not configured — submissions still land in the inbox.
              </span>
            )}
          </p>
          <Button
            variant="secondary"
            onClick={smokeTestSmtp}
            disabled={pending || !smtpConfigured}
          >
            SMTP smoke test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revalidate secret</CardTitle>
          <CardDescription>
            Set via <code className="text-xs">REVALIDATE_SECRET</code> env var. Required for the
            public revalidate endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block rounded-md border border-border bg-muted/30 p-3 text-sm">
            {revalidateSecretMasked || "(not set)"}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}