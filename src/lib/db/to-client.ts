/**
 * Shape returned to the rest of the app: every document is normalized into a
 * plain object with `id` (string) — that's the only identifier exposed to
 * server components, client components, and form payloads. The Mongoose
 * `__v` version key and the raw `_id` ObjectId are dropped: `_id` carries a
 * `buffer` (and a `toJSON`) that React Server Components refuse to serialize
 * across the boundary to client components (see Next.js error:
 * "Objects with toJSON methods are not supported"). All `_id` access in
 * server-side code (queries, actions, seed scripts) operates on the raw
 * Mongoose doc, not on `toClient`'s output, so dropping it here is safe.
 */
export type WithClientId<T> = Omit<T, "_id" | "__v"> & {
  id: string;
};

/**
 * Recursively normalize a Mongoose document (or array) into a plain object
 * with `id` (string) and no `__v` or `_id`.
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

  // Embedded BSON identifiers (ObjectId, Decimal128, Binary, …) look
  // like objects to `typeof`, but `Object.entries` returns `[]` because
  // their data lives on private slots / a backing `Buffer`. If we
  // treated them like plain docs, every embedded `ObjectId` would
  // normalise to `{}` — and `.toString()` on those yields `"[object
  // Object]"`, which then blows up in Mongo with
  // `Cast to ObjectId failed for value "[object Object]" (type string)`.
  //
  // Detect by signature rather than importing Mongoose here: Mongoose's
  // ObjectId (and BSON's) both expose `toHexString()` and 24-char hex
  // `.toString()`. Same for Decimal128 — it has its own hex-like form.
  // We only special-case ObjectId-equivalent identifiers; everything
  // else falls through to the generic branch.
  if (isObjectIdLike(doc)) {
    return doc.toString();
  }

  // Mongoose documents expose a .toObject() that strips the Mongoose
  // internals (paths, getters, virtuals). Lean docs are already plain.
  const source =
    typeof (doc as { toObject?: () => unknown }).toObject === "function"
      ? (doc as unknown as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(source)) {
    if (k === "__v" || k === "_id") continue;
    out[k] = toClient(v);
  }

  // Lift the document's `_id` into `id` so the rest of the app has a
  // stringly-typed identifier (URL params, form fields, React keys).
  const rawId = (source as { _id?: { toString(): string } })._id;
  if (rawId && typeof rawId.toString === "function") {
    out.id = rawId.toString();
  }

  return out;
}

/**
 * True for BSON `ObjectId` and similar 24-hex-char identifiers that
 * Mongoose/BSON hand us in arrays like `tagIds: Types.ObjectId[]`.
 * Detection is shape-based (`toHexString()` is unique to these classes)
 * so we don't couple this util to a specific Mongoose version.
 */
function isObjectIdLike(doc: object): doc is { toString(): string } {
  const candidate = doc as { toHexString?: () => string; toString?: () => string };
  return (
    typeof candidate.toHexString === "function" &&
    typeof candidate.toString === "function" &&
    /^[a-f0-9]{24}$/i.test(candidate.toString())
  );
}