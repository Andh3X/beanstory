import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { contentSecurityPolicy } from "./lib/security.mjs";

export async function proxy(request) {
  const nonce = randomBytes(16).toString("base64");
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  // Timpa header kiriman browser; hanya nonce yang dibuat server yang dipercaya.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  const secure = (response) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const login = (query = "") => secure(NextResponse.redirect(new URL(`/admin/login${query}`, request.url)));
  const path = request.nextUrl.pathname;
  if (!/^\/admin(?:\/|$)/.test(path) || path === "/admin/login") {
    return secure(next());
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return login("?error=service");
  }

  let response = next();
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
          // Teruskan cookie hasil refresh beserta nonce ke Server Component.
          requestHeaders.set("cookie", request.headers.get("cookie") || "");
          response = next();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return login("?error=service");
    }

    if (!data.user) {
      return login();
    }
    const status = await supabase.rpc("admin_aktif");
    if (status.error || status.data !== true) {
      return login(`?error=${status.error ? "service" : "inactive"}`);
    }

    return secure(response);
  } catch {
    return login("?error=service");
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|produk/[^/]+\\.svg$|offline\\.(?:html|css)$|theme-init\\.js$|sw\\.js$|robots\\.txt$|sitemap\\.xml$|manifest\\.webmanifest$).*)"],
};
