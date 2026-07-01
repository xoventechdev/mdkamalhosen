/**
 * Force Node.js to use reliable public DNS resolvers instead of the OS
 * defaults. Fixes `querySrv ECONNREFUSED _mongodb._tcp.*.mongodb.net` in
 * dev environments where the system resolver refuses SRV lookups
 * (corporate networks, some ISPs, misconfigured Windows adapters).
 *
 * Public DNS servers we fall back to (in order):
 *  - Cloudflare (1.1.1.1) — fast, claims no logging, DNSSEC-aware
 *  - Google    (8.8.8.8) — universal fallback
 *
 * `configureDns()` is invoked from `src/instrumentation.ts` (which runs
 * before any route handler) so the override is in place before Mongoose
 * performs its first SRV lookup. Calling `setServers` more than once is
 * safe — it just overwrites the previous list.
 */
import dns from "node:dns";

const FALLBACK_RESOLVERS = ["1.1.1.1", "8.8.8.8"];

let configured = false;

export function configureDns(): void {
  if (configured) return;
  try {
    dns.setServers(FALLBACK_RESOLVERS);
    configured = true;
    // eslint-disable-next-line no-console
    console.log(
      "[db][dns] resolvers overridden to:",
      dns.getServers(),
    );
  } catch (err) {
    // Log once; do not re-throw — the platform resolver may still work.
    // eslint-disable-next-line no-console
    console.warn(
      "[db][dns] failed to override resolvers, using OS defaults:",
      err,
    );
  }
}

// Belt-and-suspenders: also run on direct import. Idempotent thanks to
// the `configured` guard above.
configureDns();