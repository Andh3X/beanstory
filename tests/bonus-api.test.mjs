import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers.mjs";

test("API seleksi hanya membaca produk aktif; JSON, batas, dan kegagalan ditangani", async () => {
  const calls = []; let gagal = false;
  const db = { from(table) { calls.push(["from", table]); return { select(kolom) { calls.push(["select", kolom]); return this; }, eq(col, value) { calls.push(["eq", col, value]); return this; }, async in(col, ids) { calls.push(["in", col, Array.from(ids)]); return gagal ? { error: new Error("private") } : { data: [{ id: 1, aktif: true }] }; } }; } };
  const mod = await loadSource("app/api/produk/seleksi/route.js", { mocks: { "@/lib/supabase/server": { createServerClient: () => db } }, globals: { Response } });
  const req = (body) => new Request("https://shop.test/api/produk/seleksi", { method: "POST", body });
  const res = await mod.POST(req(JSON.stringify({ ids: ["1", "2"] })));
  assert.equal(res.status, 200); assert.equal(res.headers.get("cache-control"), "no-store"); assert.deepEqual(calls.find((c) => c[0] === "eq"), ["eq", "aktif", true]);
  assert.deepEqual((await res.json()).produk, [{ id: 1, aktif: true }]);
  calls.length = 0;
  for (const body of ["invalid", "null", JSON.stringify({ ids: Array(51).fill("1") }), JSON.stringify({ ids: ["0"] })]) assert.equal((await mod.POST(req(body))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await mod.POST(req("x".repeat(4097)))).status, 413);
  gagal = true; const error = await mod.POST(req('{"ids":["1"]}')); assert.equal(error.status, 503); assert.doesNotMatch(await error.text(), /private/);
});
test("API klik menolak origin asing/input salah; satu ID unik per produk melalui RPC", async () => {
  const calls = []; let gagal = false;
  const mod = await loadSource("app/api/klik-whatsapp/route.js", { mocks: { "@/lib/supabase/server": { createServerClient: () => ({ rpc: async (nama, args) => { calls.push([nama, Array.from(args.p_ids)]); return { error: gagal ? new Error() : null }; } }) } }, globals: { Response } });
  const req = (body, origin = "https://shop.test") => new Request("https://shop.test/api/klik-whatsapp", { method: "POST", headers: { origin }, body });
  assert.equal((await mod.POST(req('{"ids":["1","1","2"]}'))).status, 204);
  assert.deepEqual(calls[0], ["catat_klik_whatsapp", ["1", "2"]]);
  assert.equal((await mod.POST(req('{"ids":["1"]}', "https://other.test"))).status, 403);
  for (const body of ["bad", "null", '{"ids":[]}', JSON.stringify({ ids: Array(21).fill("1") })]) assert.equal((await mod.POST(req(body))).status, 400);
  assert.equal(calls.length, 1);
  gagal = true; assert.equal((await mod.POST(req('{"ids":["1"]}'))).status, 503);
});
test("beacon dan fallback keepalive tidak melempar error atau menunda WhatsApp", async () => {
  let beacon = 0, fetched = 0, ditolak = false;
  const mod = await loadSource("lib/klik-whatsapp.js", { globals: { Blob, navigator: { sendBeacon: (_path, body) => { beacon++; assert.ok(body instanceof Blob); return !ditolak; } }, fetch: (_path, options) => { fetched++; assert.equal(options.keepalive, true); assert.deepEqual(JSON.parse(options.body).ids, ["1"]); return Promise.reject(new Error("offline")); } } });
  assert.equal(mod.catatKlik(["1", "1"]), undefined); assert.equal(beacon, 1); assert.equal(fetched, 0);
  ditolak = true; assert.equal(mod.catatKlik([1]), undefined); await new Promise((r) => setImmediate(r)); assert.equal(fetched, 1);
  const rusak = await loadSource("lib/klik-whatsapp.js", { globals: { navigator: { sendBeacon() { throw new Error("blocked"); } }, Blob, fetch: () => { fetched++; return Promise.reject(new Error("offline")); } } });
  assert.doesNotThrow(() => rusak.catatKlik([1])); await new Promise((r) => setImmediate(r)); assert.equal(fetched, 2);
});
test("media memerlukan rujukan foto produk aktif; objek privat tidak dapat ditebak langsung", async () => {
  const nama = "12345678-1234-4123-8123-123456789012.jpg";
  let tersedia = false, downloads = 0; const filters = [];
  const db = { from(table) { assert.equal(table, "produk"); return { select() { return this; }, eq(col, value) { filters.push([col, value]); return this; }, in(col, values) { filters.push([col, Array.from(values)]); return this; }, async limit() { return { data: tersedia ? [{ id: 1 }] : [] }; } }; }, storage: { from(bucket) { assert.equal(bucket, "produk"); return { async download(file) { assert.equal(file, nama); downloads++; return { data: new Blob(["image"]) }; } }; } } };
  const mod = await loadSource("app/media/produk/[nama]/route.js", { mocks: { "@/lib/supabase/server": { createServerClient: () => db } }, globals: { Response } });
  assert.equal((await mod.GET(null, { params: Promise.resolve({ nama: "../private" }) })).status, 404);
  assert.equal((await mod.GET(null, { params: Promise.resolve({ nama }) })).status, 404); assert.equal(downloads, 0); assert.deepEqual(filters[0], ["aktif", true]);
  tersedia = true; const res = await mod.GET(null, { params: Promise.resolve({ nama }) }); assert.equal(res.status, 200); assert.equal(res.headers.get("content-type"), "image/jpeg"); assert.equal(res.headers.get("cache-control"), "no-store"); assert.equal(downloads, 1);
});
