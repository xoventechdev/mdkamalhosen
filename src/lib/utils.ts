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

/**
 * Format a date with day + month + year + 24-hour time, e.g.
 * "2 Jul 2026, 14:37". Uses UTC components for consistency with
 * `formatDate` (the rest of the site). Used by the admin messages
 * inbox where the precise arrival time matters.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (date === null || date === undefined || date === "") return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()] ?? "";
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/u).length;
  return Math.max(1, Math.round(words / 200));
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

/**
 * Compact integer formatter for view counts. Mirrors the shape used
 * by GitHub: 999 → "999", 1_234 → "1.2k", 12_345 → "12k",
 * 1_234_567 → "1.2m". Pure-function so it works in Server Components
 * too.
 */
export function compactCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1_000) return String(Math.round(n));
  if (n < 1_000_000) {
    const v = n / 1_000;
    const rounded = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
    return `${rounded}k`;
  }
  const v = n / 1_000_000;
  const rounded = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded}m`;
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

/**
 * Format a date as a short relative string for admin feeds, e.g.
 * "just now" (<45s), "3m ago", "2h ago", "yesterday", "5d ago",
 * "3w ago", or falls back to `formatDate` for anything older than ~5 weeks.
 *
 * Uses UTC second-deltas for stability across server-rendered output.
 * Returns "—" for null/invalid input.
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (date === null || date === undefined || date === "") return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  // For ≥24h, use day-aligned math so "yesterday" appears once a day has
  // elapsed at the same UTC time.
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days === 1) return "yesterday";
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(d);
}