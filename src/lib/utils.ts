import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(
  date: Date | string | null | undefined,
  opts: { month?: boolean; year?: boolean } = { month: true, year: true },
): string {
  if (date === null || date === undefined || date === "") return "Present";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Present";
  const parts: string[] = [];
  if (opts.month) parts.push(MONTHS[d.getUTCMonth()] ?? "");
  if (opts.year) parts.push(String(d.getUTCFullYear()));
  return parts.join(" ");
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/u).length;
  return Math.max(1, Math.round(words / 200));
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function initials(name: string): string {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Split a string on blank lines into paragraphs. Used for narrative sections where
 * the fallback / DB content is stored as one block with `\n\n` separators.
 */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/u)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Inclusive date range label, e.g. "2022 — 2025" / "2024 — Present".
 */
export function dateRange(start: Date | string, end: Date | string | null | undefined): string {
  const startLabel = formatDate(start, { month: false, year: true });
  const endLabel = end ? formatDate(end, { month: false, year: true }) : "Present";
  return `${startLabel} — ${endLabel}`;
}