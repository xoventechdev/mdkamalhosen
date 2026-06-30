import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["query", "error", "warn"],
  });

// Always cache on globalThis. Vercel reuses serverless function instances
// for several minutes between requests, so caching the PrismaClient across
// invocations prevents the binary engine from cold-starting on every call.
globalForPrisma.prisma = prisma;
