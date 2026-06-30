import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const categoryStyles: Record<string, string> = {
  bms: "text-cat-bms bg-cat-bms/10 border-cat-bms/20",
  software: "text-cat-software bg-cat-software/10 border-cat-software/20",
  iot: "text-cat-iot bg-cat-iot/10 border-cat-iot/20",
  android: "text-cat-android bg-cat-android/10 border-cat-android/20",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const styles = categoryStyles[category] ?? "";
  const label =
    category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "accent" | "outline";
}) {
  const styles = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent/10 text-accent",
    outline: "border border-border text-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}