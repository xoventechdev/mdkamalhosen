/**
 * Runs once when the Next.js server boots — before any route handler,
 * middleware, or module is loaded. This is the only reliable place to
 * install DNS-side effects in dev, because module evaluation order in
 * the dev bundle is not guaranteed and `import "./dns"` from inside
 * `src/lib/db/connect.ts` can race with Mongoose's first SRV lookup.
 *
 * On Vercel the platform resolver already works, so this is a no-op in
 * production — but it costs nothing to run.
 *
 * `src/lib/db/dns.cjs` is a CommonJS file that uses Node's
 * `require("dns")` directly. The Next.js server webpack config marks
 * Node built-ins as externals, so the require is satisfied by Node at
 * runtime and is not parsed by webpack — avoiding the
 * `UnhandledSchemeError` that a static `import ... from "node:dns"`
 * would produce. The import below is a plain local-path import with no
 * `node:` scheme, so the static analyzer is happy.
 */
import { configureDns } from "@/lib/db/dns.cjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  configureDns();
}
