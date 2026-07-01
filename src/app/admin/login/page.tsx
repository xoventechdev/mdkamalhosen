"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * /admin/login
 *
 * Public page (the middleware lets the unauthenticated visitor
 * through; everything else under /admin/* is gated). On a successful
 * POST to /api/admin/login the cookie is set and we redirect to the
 * original `redirect=` target (or /admin).
 *
 * The form was refactored in the DB-auth pass to use the shared
 * <Field>/<Input>/<Button> primitives so it matches the rest of the
 * admin UI.
 */

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Sign-in failed");
        setLoading(false);
        return;
      }
      const redirect = params.get("redirect") ?? "/admin";
      router.replace(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold tracking-tight">Admin sign-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted area. Only registered admins may sign in.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mdkamalhosennn@gmail.com"
            />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/admin/forgot-password"
              className="hover:text-foreground hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
