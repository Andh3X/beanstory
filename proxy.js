import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.redirect(
      new URL("/admin/login?error=service", request.url)
    );
  }

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.redirect(
        new URL("/admin/login?error=service", request.url)
      );
    }

    if (!data.user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const status = await supabase.rpc("admin_aktif");
    if (status.error || status.data !== true) {
      return NextResponse.redirect(new URL(`/admin/login?error=${status.error ? "service" : "inactive"}`, request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?error=service", request.url)
    );
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
