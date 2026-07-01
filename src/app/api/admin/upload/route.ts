import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set(["avatars", "projects", "blog", "cvs"]);
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * POST /api/admin/upload
 *
 * Multipart form fields:
 *   • file:   the file to upload
 *   • bucket: one of `avatars` | `projects` | `blog` | `cvs`
 *   • slug:   path prefix (e.g. project slug or blog slug)
 *
 * Returns `{ url, path }` on success. The URL is the public Vercel Blob URL
 * that Next/Image can render directly (it is added to `images.remotePatterns`
 * in next.config.ts).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "");
  const slug = String(form.get("slug") ?? "misc");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 2MB" },
      { status: 413 },
    );
  }

  const ext = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const safeSlug =
    slug.toLowerCase().replace(/[^a-z0-9-]/g, "x") || "misc";
  const path = `${safeSlug}/${crypto.randomUUID().slice(0, 8)}-${Date.now()}.${ext}`;

  try {
    const blob = await put(`${bucket}/${path}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, path: blob.pathname });
  } catch (err) {
    console.error("[api/admin/upload] Vercel Blob error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
