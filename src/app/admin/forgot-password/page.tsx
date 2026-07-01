"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * /admin/forgot-password
 *
 * Public page. The user enters their admin email; on submit we POST to
 * /api/admin/forgot-password. The API always returns 200 to avoid
 * account enumeration, and we render the same "check your inbox"
 * confirmation regardless of whether the email matched a real admin.
 *
 * Uses the shared <Field>/<Input>/<Button> primitives so the form
 * looks identical to the rest of the admin UI.
 */

function ForgotInner() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Network errors are intentionally swallowed — the same
      // confirmation renders either way.
    } finally {
      setPending(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
          <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            we&apos;ve sent a password-reset link. The link expires in one hour.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Didn&apos;t get the email? Check your spam folder, or try again from
            the sign-in page.
          </p>
          <div className="mt-6">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/admin/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email you use to sign in and we&apos;ll send you a reset link.
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
              placeholder="you@example.com"
            />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/admin/login" className="hover:text-foreground hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <ForgotInner />
    </Suspense>
  );
}
