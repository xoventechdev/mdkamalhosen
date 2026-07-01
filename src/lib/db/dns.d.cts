/**
 * Type declaration for the CommonJS companion `dns.cjs`. Without this,
 * TypeScript would have no types to resolve when `instrumentation.ts`
 * imports from `@/lib/db/dns.cjs`.
 *
 * Keeping the types in a separate `.d.cts` file (rather than inline in
 * the `.cjs` source) means the runtime file stays pure CommonJS — no JSDoc
 * or type annotations leaking into the actual code path.
 */
export function configureDns(): void;
