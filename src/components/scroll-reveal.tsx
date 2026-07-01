import { type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}

// Plain passthrough wrapper. Earlier versions used framer-motion's
// `whileInView` / mount-time `animate` to fade each item in, but every
// approach left at least one item at opacity:0 in the user's experience:
//   - whileInView with IntersectionObserver → below-fold items never fired
//     isIntersecting until the user scrolled, so they stayed invisible for
//     30–60s after page load.
//   - mount-time animate with staggered delay → items with higher `delay`
//     values were still at opacity:0 until their turn in the stagger,
//     reading as "items appearing one at a time".
//
// This component used to be the source of both behaviors. Now it just
// renders its children directly — every item is visible immediately,
// all at once. The component is kept (with the same prop signature) so the
// 14+ call sites don't need to be touched. The `delay`, `y`, `as`, and
// `className` props are accepted for compatibility but unused.
export function ScrollReveal({
  children,
  className,
  as = "div",
}: ScrollRevealProps) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}