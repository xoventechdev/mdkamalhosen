"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /**
   * Stagger delay in milliseconds. Hard-capped at 200ms so the whole page
   * finishes its reveal well under 1s. Used for both mount-time and
   * scroll-triggered reveals.
   */
  delay?: number;
  /** Vertical translate in px at the start of the animation. Defaults to 12. */
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}

const MAX_DELAY_MS = 200;
const REVEAL_DURATION_MS = 500;

/**
 * Subtle entrance animation for the public site.
 *
 * Behaviour:
 *   - On mount, items that are already inside the viewport (above the fold
 *     or visible on initial render) animate in immediately with a small
 *     staggered `delay`. Each item becomes visible at `delay + duration`
 *     so the whole sequence stays under ~700ms.
 *   - Items below the fold stay at opacity:0 until the IntersectionObserver
 *     fires for them. Once visible, they animate in once with the same
 *     fade-up curve and stay visible. We never re-hide them — so users who
 *     scroll quickly don't see items pop in late.
 *   - `prefers-reduced-motion` is handled in CSS (globals.css already sets
 *     animation-duration to ~0). The observer short-circuits too: if motion
 *     is reduced we just reveal immediately on mount without any animation.
 *
 * Why not framer-motion? Every prior attempt left at least one item
 * invisible to the user. This implementation guarantees every item is
 * eventually visible (no `whileInView` items stuck at opacity:0) while
 * still feeling alive on first load.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
  as = "div",
}: ScrollRevealProps) {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  // `revealed` flips to true exactly once. Once true, the element stays
  // at opacity:1 forever (we never re-hide). This is the key fix for the
  // "stuck invisible items" failure mode.
  const [revealed, setRevealed] = useState(false);

  const safeDelay = Math.min(Math.max(delay, 0), MAX_DELAY_MS);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: skip animation entirely, just show the element.
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setRevealed(true);
      return;
    }

    // If the element is already in view at mount, reveal after the stagger
    // delay. Below-the-fold elements wait for the observer.
    const rect = el.getBoundingClientRect();
    const alreadyInView =
      rect.top < window.innerHeight && rect.bottom > 0;

    if (alreadyInView) {
      const t = window.setTimeout(() => setRevealed(true), safeDelay);
      return () => window.clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Reveal once. The `revealed` state is one-way so the item
            // never disappears again, even if the user scrolls past.
            window.setTimeout(() => setRevealed(true), safeDelay);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [safeDelay]);

  // While `revealed` is false, the element is at opacity:0 + small Y offset.
  // Once revealed, it returns to natural position with a fade-up transition.
  // We avoid CSS @keyframes here so the transition duration is fully
  // controlled by us (the `transition` class) and respects prefers-reduced-motion
  // via globals.css.
  const style: CSSProperties = {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(12px)",
    transition: `opacity ${REVEAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${REVEAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    willChange: revealed ? undefined : "opacity, transform",
  };

  // Cast through `unknown` because the ref's element type depends on `as`.
  return (
    <Tag ref={ref as unknown as React.Ref<never>} className={className} style={style}>
      {children}
    </Tag>
  );
}