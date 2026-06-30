import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Apply supabase/rls.sql against the database using the service-role Prisma
 * connection. Statements are split on top-level `;` (the SQL file uses no
 * semicolons inside strings or dollar-quoted blocks except at statement end).
 *
 * Idempotent — the SQL uses DO blocks and drop policy if exists.
 */

const sqlPath = resolve(process.cwd(), "supabase", "rls.sql");
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
        // malformed; bail
        i++;
        continue;
      }
      buf += input.slice(i + 1, closingIdx + dollarTag.length);
      i = closingIdx + dollarTag.length;
      dollarTag = null;
      continue;
    }

    // Detect start of comments / quotes / dollar-quote
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
      // Detect $$ or $tag$
      const tagMatch = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(input.slice(i));
      if (tagMatch) {
        dollarTag = tagMatch[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    // Statement terminator
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

async function main() {
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
      // Continue past benign errors but bail on hard ones
      if (code !== "42710" /* duplicate policy */ && code !== "42P07" /* duplicate table */) {
        await prisma.$disconnect();
        process.exit(1);
      }
    }
  }
  console.log(`\nApplied ${ok}/${statements.length} statements.`);

  // Verify
  const policies = await prisma.$queryRaw<Array<{ tablename: string; policyname: string; cmd: string }>>`
    SELECT tablename, policyname, cmd FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  console.log(`\nActive policies (${policies.length}):`);
  for (const r of policies) {
    console.log(`  ${r.tablename.padEnd(14)} ${r.policyname.padEnd(36)} ${r.cmd}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});