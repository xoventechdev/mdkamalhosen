/**
 * Find and (optionally) fix duplicate blog slugs.
 *
 * MongoDB allows duplicate values when no unique index is enforced on a
 * field. The blog_posts collection declares `slug` as `unique: true` in
 * its schema, but if the index was never built (e.g. Mongoose's
 * `autoIndex` was off, or the collection was seeded outside Mongoose),
 * duplicate slugs can accumulate in production. Adding a unique index
 * later on a collection with existing duplicates throws an error — so
 * we need to clean them up first.
 *
 * Usage:
 *
 *   # 1. Dry-run: print collisions, do not modify anything.
 *   npm run db:dedupe-blog-slugs
 *
 *   # 2. Apply: rename all but the oldest post in each collision group,
 *   #          suffixing with `-2`, `-3`, ... so the unique index can
 *   #          be built afterwards.
 *   npm run db:dedupe-blog-slugs -- --apply
 *
 *   # 3. Optional: also enforce the unique index once the collection is
 *   #             clean. Safe to re-run — `createIndex` is idempotent.
 *   npm run db:dedupe-blog-slugs -- --apply --index
 *
 * The script is idempotent: re-running `--apply` on an already-clean
 * collection is a no-op.
 */

// `tsx` does not auto-load `.env`; Next.js does (for dev/build/start).
// The DB scripts are run outside Next.js, so we load env ourselves.
import "dotenv/config";

import { connect, disconnect, BlogPostModel } from "@/lib/db";
import { slugify } from "@/lib/utils";

interface CliArgs {
  apply?: boolean;
  index?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (const a of argv) {
    if (a === "--apply") out.apply = true;
    else if (a === "--index") out.index = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(
    [
      "Dedupe blog_posts.slug",
      "",
      "Options:",
      "  --apply   Rename duplicates so each slug is unique (default: dry-run)",
      "  --index   After dedupe, build the unique index on slug",
      "  --help    Show this message",
      "",
      "Examples:",
      "  npm run db:dedupe-blog-slugs",
      "  npm run db:dedupe-blog-slugs -- --apply",
      "  npm run db:dedupe-blog-slugs -- --apply --index",
    ].join("\n"),
  );
}

interface SlugGroup {
  slug: string;
  count: number;
  postIds: string[];
}

async function findCollisions(): Promise<SlugGroup[]> {
  // Aggregate by slug, returning only slugs with more than one post.
  // `$group` + `$match { count > 1 }` is the standard pattern for
  // finding duplicate values on a non-indexed field.
  const grouped = await BlogPostModel.aggregate<{
    _id: string;
    count: number;
    ids: import("mongoose").Types.ObjectId[];
  }>([
    { $group: { _id: "$slug", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return grouped.map((g) => ({
    slug: g._id,
    count: g.count,
    postIds: g.ids.map((id) => id.toString()),
  }));
}

async function findUniqueSuffix(baseSlug: string): Promise<string> {
  // Generate `baseSlug-2`, `baseSlug-3`, ... until we find one that
  // doesn't already exist. Cap at 1000 attempts to avoid an infinite
  // loop in pathological cases (then bail loudly).
  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseSlug}-${i}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await BlogPostModel.exists({ slug: candidate });
    if (!exists) return candidate;
  }
  throw new Error(`Could not find a unique suffix for "${baseSlug}"`);
}

async function applyFixes(groups: SlugGroup[]): Promise<{
  renamed: Array<{ id: string; from: string; to: string }>;
}> {
  const renamed: Array<{ id: string; from: string; to: string }> = [];

  for (const group of groups) {
    // Load every post in this group, sorted by createdAt ascending so
    // the oldest one (most likely the original / intentional) keeps the
    // canonical slug.
    const posts = await BlogPostModel.find({ slug: group.slug })
      .sort({ createdAt: 1, _id: 1 })
      .select({ _id: 1, slug: 1, title: 1 })
      .lean();

    // Skip the first one — that's the canonical slug holder.
    const duplicates = posts.slice(1);

    for (const post of duplicates) {
      // Prefer re-deriving from the title if it's slug-safe; fall back
      // to a numeric suffix. `slugify` returns a normalized lowercase
      // hyphen-separated string. We don't want to overwrite an existing
      // post's slug.
      const fromTitle = post.title ? slugify(post.title) : "";
      const preferred =
        fromTitle && fromTitle !== group.slug ? fromTitle : group.slug;

      // If the preferred name happens to be free, use it. Otherwise
      // suffix the canonical slug.
      const existsAtPreferred = await BlogPostModel.exists({
        slug: preferred,
        _id: { $ne: post._id },
      });
      const target = existsAtPreferred
        ? await findUniqueSuffix(preferred)
        : preferred;

      // eslint-disable-next-line no-console
      console.log(
        `  rename ${post._id.toString()}  "${group.slug}"  ->  "${target}"  (title: "${post.title}")`,
      );

      await BlogPostModel.updateOne(
        { _id: post._id },
        { $set: { slug: target } },
      );

      renamed.push({
        id: post._id.toString(),
        from: group.slug,
        to: target,
      });
    }
  }

  return { renamed };
}

async function ensureUniqueIndex(): Promise<void> {
  // Mongoose builds indexes declared on the schema when `autoIndex`
  // is true (the default in dev), but `createIndex` here is the
  // explicit, idempotent equivalent. Throws on a remaining
  // duplicate, so call this only AFTER `applyFixes`.
  // eslint-disable-next-line no-console
  console.log("Ensuring unique index on blog_posts.slug…");
  await BlogPostModel.collection.createIndex(
    { slug: 1 },
    { unique: true, name: "slug_1" },
  );
  // eslint-disable-next-line no-console
  console.log("  done.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  await connect();

  try {
    const collisions = await findCollisions();

    if (collisions.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No duplicate slugs found. Collection is clean.");
      if (args.index) await ensureUniqueIndex();
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `Found ${collisions.length} duplicate slug group(s) (${collisions.reduce(
        (n, g) => n + g.count,
        0,
      )} posts total):`,
    );
    for (const group of collisions) {
      // eslint-disable-next-line no-console
      console.log(
        `  slug="${group.slug}"  count=${group.count}  ids=[${group.postIds.join(", ")}]`,
      );
    }

    if (!args.apply) {
      // eslint-disable-next-line no-console
      console.log(
        "\nDry-run only. Re-run with --apply to rename duplicates.",
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.log("\nApplying fixes…");
    const { renamed } = await applyFixes(collisions);
    // eslint-disable-next-line no-console
    console.log(`\nRenamed ${renamed.length} post(s).`);

    // Verify clean.
    const remaining = await findCollisions();
    if (remaining.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `ERROR: ${remaining.length} collision(s) remain after fix. ` +
          `Investigate manually before adding the unique index.`,
      );
      process.exitCode = 1;
      return;
    }

    if (args.index) {
      await ensureUniqueIndex();
    } else {
      // eslint-disable-next-line no-console
      console.log(
        "\nSlug values are now unique. Build the index with --index, " +
          "or it will be created automatically the next time Mongoose " +
          "connects with autoIndex enabled.",
      );
    }
  } finally {
    await disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("dedupe-blog-slugs failed:", err);
  process.exitCode = 1;
  void disconnect();
});