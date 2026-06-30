"use client";

import { useEffect } from "react";

/**
 * Root error boundary for the App Router. Catches errors thrown by Server
 * Components (including Prisma/Supabase failures) and renders a friendly
 * fallback with a "Try again" action.
 *
 * Next.js requires this to be a Client Component.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in Vercel runtime logs. Keep the message small so we don't
    // spam logs in production.
    console.error("[app:error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-semibold">Couldn&apos;t load the page</h2>
      <p className="text-sm text-muted-foreground">
        Something went wrong reaching the database. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40 hover:bg-card/80"
      >
        Try again
      </button>
    </div>
  );
}
