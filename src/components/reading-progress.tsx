"use client";

import * as React from "react";

interface ReadingProgressProps {
  /** Optional target element to measure progress against. Defaults to the whole document. */
  targetId?: string;
}

/**
 * Thin accent bar at the top of the viewport that fills as the reader scrolls through
 * the article. Use only on long-form detail pages (e.g. /blog/[slug]).
 *
 * Honours `prefers-reduced-motion: reduce` — the bar still renders, but transitions
 * are killed (handled globally in globals.css).
 */
export function ReadingProgress({ targetId }: ReadingProgressProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    function compute() {
      let start: number;
      let end: number;

      if (targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        start = rect.top + window.scrollY;
        end = rect.bottom + window.scrollY - window.innerHeight;
      } else {
        start = 0;
        end = document.documentElement.scrollHeight - window.innerHeight;
      }

      const span = Math.max(end - start, 1);
      const ratio = Math.min(1, Math.max(0, (window.scrollY - start) / span));
      setProgress(ratio);
    }

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [targetId]);

  return (
    <div
      data-reading-progress
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-accent via-violet to-accent transition-transform duration-75 ease-linear"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}