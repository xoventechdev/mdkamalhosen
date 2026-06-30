"use client";

import * as React from "react";

interface SpySection {
  id: string;
  label: string;
  href: string;
}

interface ScrollSpyNavProps {
  sections: SpySection[];
  /** Selector that wraps all spied sections in the document. */
  targetSelector?: string;
  /** Optional className applied to the inner nav. */
  className?: string;
}

/**
 * Side anchor list that highlights the section currently in view.
 *
 * Pages mark their sections with `id` matching `SpySection.id`. The component
 * uses IntersectionObserver to detect which section is most visible and updates
 * the active indicator. Reduced-motion is respected globally.
 */
export function ScrollSpyNav({ sections, targetSelector, className }: ScrollSpyNavProps) {
  const [activeId, setActiveId] = React.useState<string>(sections[0]?.id ?? "");

  React.useEffect(() => {
    const ids = sections.map((s) => s.id);
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // Track which targets are "currently in view" — pick the topmost visible.
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }

        // Pick the visible section whose top is closest to 0 (or the smallest positive).
        let bestId: string | null = null;
        let bestTop = Number.POSITIVE_INFINITY;
        for (const [id, top] of visible.entries()) {
          const absTop = Math.abs(top);
          if (absTop < bestTop) {
            bestTop = absTop;
            bestId = id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.5, 1],
      },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections, targetSelector]);

  return (
    <nav
      aria-label="On this page"
      className={className}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        On this page
      </p>
      <ul className="mt-4 space-y-1.5">
        {sections.map((s) => {
          const active = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={s.href}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "block rounded-md border-l-2 border-accent bg-accent/5 py-1 pl-3 text-sm font-medium text-foreground"
                    : "block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}