/**
 * Runs once when the Next.js server boots — before any route handler,
 * middleware, or module is loaded. This is the only reliable place to
 * install DNS-side effects in dev, because module evaluation order in
 * the dev bundle is not guaranteed and `import "./dns"` from inside
 * `src/lib/db/connect.ts` can race with Mongoose's first SRV lookup.
 *
 * On Vercel the platform resolver already works, so this is a no-op in
 * production — but it costs nothing to run.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Use a runtime `require` instead of a static `import` so webpack does
  // not try to walk the import graph during the edge-runtime build.
  // The edge runtime bundle never executes this branch (it returns
  // above), but webpack still parses the source statically.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { configureDns } = require("./lib/db/dns") as {
    configureDns: () => void;
  };
  configureDns();
}