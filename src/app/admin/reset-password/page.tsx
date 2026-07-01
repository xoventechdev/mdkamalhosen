"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * /admin/reset-password?token=…
 *
 * Public page. The user landed here from the reset email. We collect a
 * new password + confirmation and POST to /api/admin/reset-password.
 * On success the API sets a fresh session cookie and returns ok; the
 * user is signed in and we redirect them to /admin.
 *
 * If the token is missing we render an error state immediately —
 * there's no point in showing the form if the reset can't complete.
 */

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Defensive: hide the form immediately on the client if there's no
  // token. The page is otherwise valid HTML and the server renders
  // the same view, so we get one consistent experience.
  const hasToken = Boolean(token && token.length >= 10);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.replace("/admin"), 800);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  if (!hasToken) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
          <h1 className="text-xl font-semibold tracking-tight">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password-reset link is missing or malformed. Request a new one
            from the sign-in page.
          </p>
          <div className="mt-6 space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/forgot-password">Request a new link</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/admin/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
          <h1 className="text-xl font-semibold tracking-tight">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re now signed in. Redirecting to the dashboard…
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Reset failed");
        setPending(false);
        return;
      }
      setSuccess(true);
      // The API set a fresh session cookie; refresh the server tree so
      // the AdminShell / middleware see the new auth state.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your admin account. Use at least 12 characters.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="New password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm" required>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
