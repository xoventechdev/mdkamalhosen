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
 * This file is a CommonJS (`.cjs`) module so that `require("dns")` here
 * is Node's real CommonJS require. The Next.js server webpack config
 * marks Node's `builtinModules` (including `dns`) as externals on the
 * server side, so the require is satisfied by Node at runtime and is
 * never parsed by webpack. This is the simplest reliable way to use a
 * Node built-in from a Next.js project without tripping the
 * `UnhandledSchemeError: Reading from "node:dns"` build failure.
 *
 * Side effect: `configureDns()` is called as soon as this file is
 * required (idempotent via the `configured` guard), so the resolver
 * override is in place before Mongoose's first SRV lookup.
 */

const FALLBACK_RESOLVERS = ["1.1.1.1", "8.8.8.8"];

let configured = false;

function configureDns() {
  if (configured) return;
  try {
    // `require("dns")` is treated as an external by Next.js's server
    // webpack config (Node's `builtinModules` is in the externals list),
    // so the require is satisfied by Node at runtime and webpack does
    // not attempt to resolve a "dns" package on disk. The dev-mode
    // "Module not found" warning is a static-analyzer artifact only and
    // does not affect the runtime path.
    const dns = require("dns");
    dns.setServers(FALLBACK_RESOLVERS);
    configured = true;
    // eslint-disable-next-line no-console
    console.log("[db][dns] resolvers overridden to:", dns.getServers());
  } catch (err) {
    // Log once; do not re-throw — the platform resolver may still work.
    // eslint-disable-next-line no-console
    console.warn(
      "[db][dns] failed to override resolvers, using OS defaults:",
      err,
    );
  }
}

module.exports = { configureDns };

// Run on require. Idempotent.
configureDns();
