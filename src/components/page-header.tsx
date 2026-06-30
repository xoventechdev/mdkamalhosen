import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** "hero" uses the section gradient + grid texture (default for top-of-page). */
  /** "subtle" uses a flat tinted band. Use for sub-routes. */
  variant?: "hero" | "subtle";
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  variant = "hero",
  align = "left",
  className,
  children,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border",
        variant === "hero" ? "section-gradient" : "bg-muted/30",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-grid-pattern bg-grid opacity-[0.04] dark:opacity-[0.07]",
          variant === "subtle" && "hidden",
        )}
      />
      <div
        className={cn(
          "container relative py-16 md:py-24",
          align === "center" && "text-center",
        )}
      >
        {eyebrow && (
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full glass-chip px-3 py-1 font-mono text-xs uppercase tracking-[0.18em]",
              align === "center" ? "mx-auto" : "",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-foreground/80">{eyebrow}</span>
          </p>
        )}
        <h1
          className={cn(
            "mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]",
            align === "center" && "mx-auto",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}