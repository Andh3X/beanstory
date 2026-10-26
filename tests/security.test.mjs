import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { contentSecurityPolicy } from "../lib/security.mjs";
import { loadSource } from "./helpers.mjs";
const { NextRequest, NextResponse } = createRequire(import.meta.url)("next/server");

test("CSP Production tidak mengizinkan inline/eval dan membatasi koneksi ke aplikasi", () => {
  const csp = contentSecurityPolicy("nonce-uji");
  assert.match(csp, /script-src 'self' 'nonce-nonce-uji' 'strict-dynamic'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  for (const value of ["connect-src 'self';", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "worker-src 'self'", "form-action 'self'"]) assert.ok(csp.includes(value));
  assert.match(contentSecurityPolicy("uji", true), /unsafe-eval/);
  assert.doesNotMatch(contentSecurityPolicy("uji", true), /upgrade-insecure-requests/);
});

async function proxyModule(db) {
  return loadSource("proxy.js", {
    globals: { Headers, process: { env: { NODE_ENV: "production", SUPABASE_URL: "https://fixture.invalid", SUPABASE_PUBLISHABLE_KEY: "dummy" } } },
    mocks: { "next/server": { NextResponse }, "node:crypto": { randomBytes }, "@supabase/ssr": { createServerClient: (_url, _key, options) => db(options) } },
  });
}
const request = (path) => new NextRequest(`https://toko.invalid${path}`, { headers: { "x-nonce": "nonce-penyerang", "content-security-policy": "script-src *" } });

test("proxy membuat nonce baru, menimpa header kiriman browser, tanpa Auth untuk halaman publik", async () => {
  const mod = await proxyModule(() => assert.fail("Publik tidak boleh memanggil Auth"));
  const a = await mod.proxy(request("/")), b = await mod.proxy(request("/produk/1"));
  const nonce = a.headers.get("x-middleware-request-x-nonce");
  assert.equal(Buffer.from(nonce, "base64").length, 16);
  assert.notEqual(nonce, b.headers.get("x-middleware-request-x-nonce"));
  assert.notEqual(nonce, "nonce-penyerang");
  assert.ok(a.headers.get("content-security-policy").includes(`'nonce-${nonce}'`));
  assert.equal(a.headers.get("x-middleware-request-content-security-policy"), a.headers.get("content-security-policy"));
  assert.equal((await mod.proxy(request("/admin/login"))).status, 200);
});

test("header CSP tetap ada saat admin ditolak; sesi nonaktif dan error tidak diloloskan", async () => {
  for (const [user, status, query] of [[null, true, ""], [{ id: "uji" }, false, "inactive"], [{ id: "uji" }, { error: {} }, "service"]]) {
    const mod = await proxyModule(() => ({ auth: { getUser: async () => ({ data: { user } }) }, rpc: async () => typeof status === "boolean" ? { data: status } : status }));
    const res = await mod.proxy(request("/admin/produk/ekspor"));
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location").includes(`/admin/login${query ? `?error=${query}` : ""}`));
    assert.match(res.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  }
});

test("refresh cookie admin mempertahankan nonce request dan cookie response", async () => {
  const mod = await proxyModule((options) => ({ auth: { getUser: async () => {
    options.cookies.setAll([{ name: "session-uji", value: "baru", options: { httpOnly: true, path: "/" } }]);
    return { data: { user: { id: "uji" } } };
  } }, rpc: async () => ({ data: true }) }));
  const res = await mod.proxy(request("/admin"));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("x-middleware-request-cookie"), /session-uji=baru/);
  assert.match(res.headers.get("set-cookie"), /session-uji=baru/);
  assert.ok(res.headers.get("content-security-policy").includes(res.headers.get("x-middleware-request-x-nonce")));
});
