import { cn } from "@/lib/utils";

/**
 * Shared visual constants for delta indicators (`+12%` arrows).
 * Centralised here so the KPI tile, views chart, and any future delta
 * displays stay consistent.
 */
export type DeltaTone = "up" | "down" | "flat";

export function deltaTone(pct: number): DeltaTone {
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "flat";
}

export function deltaToneClass(tone: DeltaTone): string {
  return cn(
    tone === "up" &&
      "text-emerald-600 dark:text-emerald-400",
    tone === "down" && "text-red-600 dark:text-red-400",
    tone === "flat" && "text-muted-foreground",
  );
}
