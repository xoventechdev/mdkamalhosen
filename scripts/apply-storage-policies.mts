/**
 * Apply supabase/storage-policies.sql against the database using the
 * service-role Prisma connection. Mirrors scripts/apply-rls.mts but for the
 * storage buckets + policies instead of the row-level security policies.
 *
 * Statements are split on top-level `;` (the SQL file uses no semicolons
 * inside strings or dollar-quoted blocks except at statement end).
 *
 * Idempotent — every bucket insert uses ON CONFLICT and every policy is
 * drop-then-create, so re-running after a partial failure is safe.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const sqlPath = resolve(process.cwd(), "supabase", "storage-policies.sql");
const raw = readFileSync(sqlPath, "utf8");

/**
 * Strip lines that are entirely SQL comments (`-- ...`) from the start of a
 * string. Preserves blank lines between comments. Used so the splitter can
 * reject a buffer that is purely comments while still accepting a statement
 * that is preceded by comment lines.
 */
function stripLeadingCommentLines(input: string): string {
  return input
    .split(/\r?\n/)
    .reduce<{ out: string[]; allComments: boolean }>(
      (acc, line) => {
        const trimmed = line.trim();
        if (acc.allComments) {
          if (trimmed === "" || trimmed.startsWith("--")) {
            // Drop pure comment / blank lines before the first real statement.
            return acc;
          }
          acc.allComments = false;
        }
        acc.out.push(line);
        return acc;
      },
      { out: [], allComments: true },
    )
    .out
    .join("\n")
    .trim();
}

/**
 * Split SQL into individual statements. Postgres `$$ ... $$` dollar-quoted
 * blocks contain semicolons that we must preserve. Walk the string character-
 * by-character to find statement terminators at depth 0 outside of any
 * quote/dollar-quote.
 */
function splitStatements(input: string): string[] {
  const statements: string[] = [];
  let buf = "";
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let dollarTag: string | null = null;

  while (i < input.length) {
    const c = input[i];
    const next = input[i + 1];

    if (inLineComment) {
      buf += c;
      if (c === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      buf += c;
      if (c === "*" && next === "/") {
        buf += next;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i++;
      continue;
    }
    if (inSingleQuote) {
      buf += c;
      if (c === "'") {
        if (next === "'") {
          buf += next;
          i += 2;
          continue;
        }
        inSingleQuote = false;
      }
      i++;
      continue;
    }
    if (inDoubleQuote) {
      buf += c;
      if (c === '"') inDoubleQuote = false;
      i++;
      continue;
    }
    if (dollarTag) {
      buf += c;
      const closingIdx = input.indexOf(dollarTag, i + 1);
      if (closingIdx === -1) {
        i++;
        continue;
      }
      buf += input.slice(i + 1, closingIdx + dollarTag.length);
      i = closingIdx + dollarTag.length;
      dollarTag = null;
      continue;
    }

    if (c === "-" && next === "-") {
      inLineComment = true;
      buf += c;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlockComment = true;
      buf += c;
      i++;
      continue;
    }
    if (c === "'") {
      inSingleQuote = true;
      buf += c;
      i++;
      continue;
    }
    if (c === '"') {
      inDoubleQuote = true;
      buf += c;
      i++;
      continue;
    }
    if (c === "$") {
      const tagMatch = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(input.slice(i));
      if (tagMatch) {
        dollarTag = tagMatch[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (c === ";") {
      buf += ";";
      // Strip leading "-- ..." comment lines before the statement terminator
      // so a statement preceded by comments isn't mistaken for one.
      const stripped = stripLeadingCommentLines(buf.trim());
      if (stripped.length > 0) {
        statements.push(stripped);
      }
      buf = "";
      i++;
      continue;
    }

    buf += c;
    i++;
  }
  const trailing = stripLeadingCommentLines(buf.trim());
  if (trailing.length > 0) {
    statements.push(trailing);
  }
  return statements;
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const statements = splitStatements(raw);
  console.log(`Split into ${statements.length} statements.`);

  let ok = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      ok++;
      console.log(`  [${i + 1}/${statements.length}] OK  - ${preview}…`);
    } catch (e: unknown) {
      const err = e as { meta?: { code?: string }; message?: string };
      const code = err.meta?.code ?? "???";
      console.error(`  [${i + 1}/${statements.length}] FAIL (${code}) - ${preview}…`);
      console.error(`    ${err.message?.split("\n")[0] ?? e}`);
      // Continue past benign errors but bail on hard ones.
      if (code !== "42710" /* duplicate policy */ && code !== "42P07" /* duplicate table */) {
        await prisma.$disconnect();
        process.exit(1);
      }
    }
  }
  console.log(`\nApplied ${ok}/${statements.length} statements.`);

  // Verify buckets + policies.
  // `pg_policies` doesn't expose bucket_id as a column — the bucket name is
  // embedded in the `qual` text (USING clause). We extract it with a regex
  // so the verify table is human-readable.
  const buckets = await prisma.$queryRaw<
    Array<{
      id: string;
      public: boolean;
      file_size_limit: number | null;
    }>
  >`SELECT id, public, file_size_limit FROM storage.buckets ORDER BY id`;
  console.log(`\nActive buckets (${buckets.length}):`);
  for (const b of buckets) {
    // file_size_limit is bigint in Postgres; convert to Number for the KB calc.
    const sizeBytes = b.file_size_limit != null ? Number(b.file_size_limit) : null;
    const sizeKb = sizeBytes != null ? `${Math.round(sizeBytes / 1024)} KB` : "—";
    console.log(`  ${b.id.padEnd(12)} public=${b.public ? "yes" : "no"}  size_limit=${sizeKb}`);
  }

  const policies = await prisma.$queryRaw<
    Array<{ policyname: string; qual: string; cmd: string }>
  >`
    SELECT policyname, qual::text, cmd FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname
  `;
  console.log(`\nStorage policies (${policies.length}):`);
  for (const p of policies) {
    // Extract bucket name from `bucket_id = 'xxx'` inside the USING clause.
    const m = /bucket_id\s*=\s*'([^']+)'/.exec(p.qual);
    const bucket = m ? m[1] : "—";
    console.log(
      `  ${p.policyname.padEnd(36)} bucket=${bucket.padEnd(12)} ${p.cmd}`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});