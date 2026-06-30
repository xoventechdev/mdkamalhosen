import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "mdkamalhosennn@gmail.com";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Allow the login route itself.
const path = request.nextUrl.pathname;
  if (path === "/admin/login") return response;

  // Only gate /admin routes.
  if (!path.startsWith("/admin")) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Block search engines from indexing any admin page.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}