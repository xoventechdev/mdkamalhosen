import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];
  const paths: string[] = Array.isArray(body.paths) ? body.paths : [];

  for (const tag of tags) {
    revalidateTag(tag);
  }
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tags,
    paths,
    at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const path = request.nextUrl.searchParams.get("path");
  const tag = request.nextUrl.searchParams.get("tag");
  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);
  return NextResponse.json({ revalidated: true, path, tag });
}