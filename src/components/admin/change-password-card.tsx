"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeMyPassword } from "@/server/actions/change-password";

/**
 * "Change password" card on /admin/settings. Mirrors the rest of the
 * settings UI (Card grid, sonner toasts, Loader2 spinner).
 *
 * On success the server bumps the user's `sessionVersion`, which
 * invalidates the caller's cookie. The toast tells the user that
 * they'll be signed out, and the AdminShell will redirect to
 * /admin/login on the next request.
 */
export function ChangePasswordCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    if (next.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (current === next) {
      setError("New password must differ from the current one.");
      return;
    }
    startTransition(async () => {
      const res = await changeMyPassword(current, next);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(
        "Password updated. You'll be signed out on the next request — sign in again with your new password.",
      );
      reset();
      // Eagerly push the user to /admin/login so they see the sign-in
      // form instead of having it appear after their next click. The
      // session cookie is now invalid, so the next middleware check
      // would redirect anyway.
      setTimeout(() => {
        router.replace("/admin/login");
        router.refresh();
      }, 1200);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Change password
        </CardTitle>
        <CardDescription>
          Update the password you use to sign in to the admin area. After a
          successful change, you&apos;ll be signed out of every device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Current password" htmlFor="cp-current" required>
            <Input
              id="cp-current"
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field
            label="New password"
            htmlFor="cp-next"
            required
            hint="At least 8 characters."
          >
            <Input
              id="cp-next"
              type="password"
              required
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="cp-confirm" required>
            <Input
              id="cp-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
