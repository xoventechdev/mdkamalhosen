import type { Types } from "mongoose";

/**
 * Shape returned to the rest of the app: every document has both
 * `_id` (ObjectId, for further queries) and `id` (string, for URLs
 * and forms). The Mongoose `__v` version key is dropped.
 */
export type WithClientId<T> = Omit<T, "_id" | "__v"> & {
  id: string;
  _id: Types.ObjectId;
};

/**
 * Recursively normalize a Mongoose document (or array) into a plain
 * object with `id` (string) and `_id` (ObjectId) and no `__v`.
 *
 * Accepts a single doc, an array of docs, or anything in between.
 * Returns the input unchanged if it is `null`, a Date, or a primitive.
 *
 * The return type is intentionally `unknown`: callers know the shape of the
 * model they queried, so they cast at the call-site (e.g.
 * `toClient(docs) as unknown as MyRow[]`). Trying to express this with a
 * precise conditional type creates unreadable unions downstream.
 */
export function toClient(doc: unknown): unknown {
  if (doc == null) return doc;
  if (Array.isArray(doc)) {
    return doc.map((d) => toClient(d));
  }
  if (doc instanceof Date) return doc;
  if (typeof doc !== "object") return doc;

  // Mongoose documents expose a .toObject() that strips the Mongoose
  // internals (paths, getters, virtuals). Lean docs are already plain.
  const source =
    typeof (doc as { toObject?: () => unknown }).toObject === "function"
      ? (doc as unknown as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(source)) {
    if (k === "__v") continue;
    if (
      k === "_id" &&
      v &&
      typeof v === "object" &&
      typeof (v as { toString?: () => string }).toString === "function"
    ) {
      out.id = (v as { toString(): string }).toString();
      out._id = v;
      continue;
    }
    out[k] = toClient(v);
  }
  return out;
}