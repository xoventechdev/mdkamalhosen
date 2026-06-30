import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set(["avatars", "projects", "blog", "cvs"]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
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
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 2MB" }, { status: 413 });
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "x") || "misc";
  const path = `${safeSlug}/${crypto.randomUUID().slice(0, 8)}-${Date.now()}.${ext}`;

  try {
    const supabase = createSupabaseServiceClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: pub.publicUrl, path });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
