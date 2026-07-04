import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connect, BlogPostModel, CommentModel } from "@/lib/db";
import { currentAdmin } from "@/lib/auth";
import { take } from "@/lib/auth-rate-limit";
import { commentCreateSchema } from "@/lib/schemas";

/**
 * Public POST endpoint for blog comments.
 *
 * Visitors who submit go through approve-before-publish moderation:
 * their comment is stored with `status: "pending"` until an admin
 * approves it from /admin/comments. Admin visitors are detected via
 * the existing session cookie and bypass moderation entirely.
 *
 * Two hard gates suppress submissions before any DB work happens:
 *   1. `DISABLE_COMMENTS=true` in the server env disables everything.
 *   2. The post's `commentsEnabled: false` DB field hides just one post.
 *
 * Rate limiting (5 submissions per IP per 60s) and a honeypot field
 * mirror the contact form pattern. The author email is intentionally
 * kept on the stored doc — never returned by public read queries —
 * so admins can use it to reply by email.
 */

const isGloballyDisabled = () => process.env.DISABLE_COMMENTS === "true";

/**
 * Lightweight IPv4 prefix for abuse-signature grouping without keeping
 * a full IP on file (GDPR-friendly). Returns "unknown" when no header
 * is present so the limiter still has a key to bucket.
 */
function ipPrefixFromHeaders(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() ?? "";
  if (!ip) return "unknown";
  const parts = ip.split(".");
  if (parts.length === 4) return parts.slice(0, 3).join(".");
  // IPv6: keep the first 32 chars. Enough to group a household without
  // fingerprinting individual devices.
  return ip.slice(0, 32);
}

export async function POST(request: NextRequest) {
  if (isGloballyDisabled()) {
    return NextResponse.json(
      { ok: false, error: "Comments are globally disabled." },
      { status: 403 },
    );
  }

  const json = (await request.json().catch(() => null)) as unknown;
  const parsed = commentCreateSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: first ? `${first.path.join(".") || first.message}: ${first.message}` : "Invalid input.",
      },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot — pretend success so the bot does not retry, but do not
  // store anything.
  if (data._hp && data._hp.length > 0) {
    return NextResponse.json({ ok: true, id: null, status: "pending" });
  }

  const ip = ipPrefixFromHeaders(request);
  const { ok: underLimit } = take(`comments:${ip}`, 5, 60_000);
  if (!underLimit) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again in a minute." },
      { status: 429 },
    );
  }

  // Validate post + per-post toggle + threading rules before any
  // write. We deliberately keep these checks after the rate limiter
  // because their cost is dominated by the database trip — the
  // limiter is the only thing that scales as the bots scale.
  let post: { _id: Types.ObjectId; slug: string; status: string; commentsEnabled?: boolean } | null = null;
  try {
    await connect();
    if (!Types.ObjectId.isValid(data.postId)) {
      return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
    }
    post = await BlogPostModel.findById(data.postId)
      .select("_id slug status commentsEnabled")
      .lean();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || "Database error." },
      { status: 500 },
    );
  }

  if (!post || post.status !== "published") {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }
  if (post.commentsEnabled === false) {
    return NextResponse.json(
      { ok: false, error: "Comments are disabled on this post." },
      { status: 403 },
    );
  }

  if (data.parentId) {
    const parent = await CommentModel.findById(data.parentId)
      .select("_id parentId postId status")
      .lean();
    if (!parent || String(parent.postId) !== String(data.postId)) {
      return NextResponse.json(
        { ok: false, error: "Parent comment not found." },
        { status: 400 },
      );
    }
    if (parent.parentId) {
      return NextResponse.json(
        { ok: false, error: "Replies cannot be nested further." },
        { status: 400 },
      );
    }
    if (parent.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Cannot reply to an unapproved comment." },
        { status: 403 },
      );
    }
  }

  // Admin detection: only inside an authenticated session. The session
  // cookie carries an HMAC signature, so we trust the result.
  const admin = await currentAdmin();
  const isAdmin = !!admin;
  const status = isAdmin ? "approved" : "pending";

  const ua = (request.headers.get("user-agent") ?? "").slice(0, 512) || null;

  let created;
  try {
    created = await CommentModel.create({
      postId: new Types.ObjectId(data.postId),
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      body: data.body,
      status,
      isAdmin,
      authorUserId: isAdmin && admin ? new Types.ObjectId(admin.userId) : null,
      ipPrefix: ip,
      userAgent: ua,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || "Could not save comment." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: String(created._id),
    status: created.status,
  });
}
