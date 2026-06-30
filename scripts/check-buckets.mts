/**
 * List Supabase storage buckets and diff them against the buckets the upload
 * route actually accepts (`ALLOWED_BUCKETS` in src/app/api/admin/upload/route.ts).
 *
 * Exits non-zero if any expected bucket is missing — useful as a pre-deploy
 * sanity check. Run with: `npx tsx scripts/check-buckets.mts`
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * If the vars aren't already in the environment, this script tries to load
 * them from a local `.env` file (no `dotenv` dependency).
 */

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Best-effort .env loader so the script works outside Next.js too.
function loadEnvIfPresent(): void {
  const path = ".env";
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes (single or double).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Don't overwrite anything the shell already set.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
loadEnvIfPresent();

const EXPECTED = ["avatars", "projects", "blog", "cvs"] as const;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Make sure .env is populated, or set the vars in your shell.");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

type Bucket = {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at: string;
};

async function main(): Promise<void> {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Failed to list buckets:", error.message);
    process.exit(1);
  }

  const existing = new Map<string, Bucket>(
    (data ?? []).map((b) => [b.id, b as Bucket]),
  );

  console.log(
    `\nExpected buckets (${EXPECTED.length}): ${EXPECTED.join(", ")}\n`,
  );

  const rows: Array<{
    bucket: string;
    status: "present" | "missing";
    public: string;
    size_limit: string;
    mime_types: string;
  }> = [];

  let missingCount = 0;
  for (const id of EXPECTED) {
    const b = existing.get(id);
    if (!b) {
      missingCount++;
      rows.push({
        bucket: id,
        status: "missing",
        public: "—",
        size_limit: "—",
        mime_types: "—",
      });
      continue;
    }
    rows.push({
      bucket: id,
      status: "present",
      public: b.public ? "yes" : "no",
      size_limit: b.file_size_limit
        ? `${Math.round(b.file_size_limit / 1024)} KB`
        : "—",
      mime_types: b.allowed_mime_types?.join(", ") ?? "(any)",
    });
  }

  // Surplus buckets are informational — list them at the end.
  const surplus = (data ?? [])
    .map((b) => b.id)
    .filter((id) => !EXPECTED.includes(id as (typeof EXPECTED)[number]));

  // Render as a plain-text table (works on Windows / no Unicode alignment gotchas).
  const colW = {
    bucket: Math.max(7, ...rows.map((r) => r.bucket.length)),
    status: 8,
    public: 7,
    size_limit: 11,
    mime_types: 30,
  };
  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));
  const header =
    pad("BUCKET", colW.bucket) +
    "  " +
    pad("STATUS", colW.status) +
    "  " +
    pad("PUBLIC", colW.public) +
    "  " +
    pad("SIZE_LIMIT", colW.size_limit) +
    "  " +
    "MIME_TYPES";
  const sep = "-".repeat(header.length);

  console.log(sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    console.log(
      pad(r.bucket, colW.bucket) +
        "  " +
        pad(r.status, colW.status) +
        "  " +
        pad(r.public, colW.public) +
        "  " +
        pad(r.size_limit, colW.size_limit) +
        "  " +
        (r.mime_types.length > colW.mime_types
          ? r.mime_types.slice(0, colW.mime_types - 1) + "…"
          : r.mime_types),
    );
  }
  console.log(sep);

  if (surplus.length > 0) {
    console.log(
      `\nExtra buckets not used by the upload route: ${surplus.join(", ")}`,
    );
  }

  if (missingCount > 0) {
    console.error(
      `\n${missingCount} expected bucket(s) missing. Apply supabase/storage-policies.sql`,
    );
    console.error(
      "via the Supabase SQL Editor or `npx tsx scripts/apply-storage-policies.mts`.",
    );
    process.exit(1);
  }

  console.log("\nAll expected buckets present. ✅");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});