import mongoose from "mongoose";
import { configureDns } from "./dns.cjs";

// Node-only resolver override for dev environments whose OS resolver refuses
// SRV lookups. Idempotent, and evaluated before `mongoose.connect()` runs.
configureDns();

declare global {
  // eslint-disable-next-line no-var
  var _mongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

/**
 * Cached Mongoose connection. Re-using a single connection across serverless
 * invocations is essential: each fresh `mongoose.connect()` triggers a TCP
 * handshake + driver initialisation, which is the difference between a
 * 50ms query and a 2s query on a warm Vercel function.
 *
 * Buffering is disabled globally so a failed connect surfaces as an
 * immediate error rather than an indefinite hang.
 */
const cached = (globalThis._mongoose ??= { conn: null, promise: null });

export async function connect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("[db] MONGODB_URI not set");
    }
    mongoose.set("bufferCommands", false);
    mongoose.set("strictQuery", true);
    cached.promise = mongoose.connect(uri, {
      dbName: "portfolio",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnect(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Re-exported for consumers that need direct access (e.g. Types.ObjectId).
export { mongoose };
