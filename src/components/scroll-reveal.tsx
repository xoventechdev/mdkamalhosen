"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { MotionProps } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}

const common: MotionProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export function ScrollReveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = "div",
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const motionProps: MotionProps = {
    ...common,
    initial: { opacity: 0, y },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  };

  switch (as) {
    case "section":
      return (
        <motion.section className={className} {...motionProps}>
          {children}
        </motion.section>
      );
    case "li":
      return (
        <motion.li className={className} {...motionProps}>
          {children}
        </motion.li>
      );
    case "article":
      return (
        <motion.article className={className} {...motionProps}>
          {children}
        </motion.article>
      );
    case "span":
      return (
        <motion.span className={className} {...motionProps}>
          {children}
        </motion.span>
      );
    default:
      return (
        <motion.div className={className} {...motionProps}>
          {children}
        </motion.div>
      );
  }
}