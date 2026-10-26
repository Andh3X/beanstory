import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadSource } from "./helpers.mjs";

const csv = await loadSource("lib/csv.js");
test("CSV BOM, koma/kutip/baris baru dan formula spreadsheet aman", () => {
  assert.equal(csv.selCsv('Kopi, "enak"\nBaru'), '"Kopi, ""enak""\nBaru"');
  for (const value of ["=1+2", "+CMD", "-3", "@SUM(A1)", "  =IMPORTXML()", "\tdata", "\rdata"]) assert.ok(csv.selCsv(value).startsWith('"\''));
  assert.equal(csv.selCsv(25000), '"25000"');
  const hasil = csv.buatCsv([{ id: 1, nama: 'Kopi, "A"', aktif: false }]);
  assert.equal(hasil.charCodeAt(0), 0xFEFF); assert.match(hasil, /"aktif"/); assert.match(hasil, /"false"/);
});
test("ekspor dan sitemap mengambil lebih dari seribu produk dalam batch stabil", async () => {
  const calls = [];
  const mod = await loadSource("lib/produk-server.js", { mocks: { react: { cache: (fn) => fn }, "@/lib/supabase/server": { createServerClient: () => assert.fail("Client tidak dipakai oleh pembaca batch") } } });
  const db = { from(table) { assert.equal(table, "produk"); const call = { aktif: false }; calls.push(call); return { select(kolom) { call.kolom = kolom; return this; }, order(key) { assert.equal(key, "id"); return this; }, eq(key, value) { assert.equal(key, "aktif"); call.aktif = value; return this; }, async range(start, end) { call.range = [start, end]; return { data: Array.from({ length: start === 0 ? 1000 : 5 }, (_, i) => ({ id: start + i + 1 })) }; } }; } };
  assert.equal((await mod.semuaProduk(db)).length, 1005);
  assert.deepEqual(calls.map((c) => c.range), [[0,999], [1000,1999]]); assert.equal(calls[0].aktif, false);
  calls.length = 0;
  await mod.semuaProduk(db, "id,created_at", true); assert.ok(calls.every((c) => c.aktif));
});
test("upload menolak tipe palsu, signature salah, kosong, dan ukuran berlebih sebelum Storage", async () => {
  const mod = await loadSource("lib/upload.js", { mocks: { "node:crypto": { randomUUID } }, globals: { Uint8Array, console } });
  const db = { storage: { from() { throw new Error("Storage tidak boleh dipanggil"); } } };
  for (const file of [{ name: "x.txt", size: 2, type: "text/plain", arrayBuffer: async () => new Uint8Array([1,2]).buffer }, { name: "x.png", size: 2, type: "image/png", arrayBuffer: async () => new Uint8Array([1,2]).buffer }, { name: "x.jpg", size: mod.BATAS_FOTO + 1, type: "image/jpeg", arrayBuffer: async () => { throw new Error(); } }, { name: "kosong.jpg", size: 0, type: "image/jpeg", arrayBuffer: async () => new ArrayBuffer(0) }, "bukan file"]) assert.ok((await mod.unggahFoto(db, file)).error);
  assert.equal((await mod.unggahFoto(db, null)).error, undefined);
  assert.equal(mod.signatureFoto(new Uint8Array([255,216,255]), "image/jpeg"), true);
  assert.equal(mod.signatureFoto(new Uint8Array([137,80,78,71,13,10,26,10]), "image/png"), true);
  assert.equal(mod.signatureFoto(new TextEncoder().encode("RIFF1234WEBP"), "image/webp"), true);
});
test("upload asli memakai bucket privat, UUID, URL aplikasi; error Storage tidak sukses", async () => {
  const mod = await loadSource("lib/upload.js", { mocks: { "node:crypto": { randomUUID } }, globals: { Uint8Array, console } });
  const calls = [];
  const file = { name: "nama-dari-browser.jpg", size: 3, type: "image/jpeg", arrayBuffer: async () => new Uint8Array([255,216,255]).buffer };
  const db = { storage: { from(bucket) { assert.equal(bucket, "produk"); return { async upload(nama, bytes, opsi) { calls.push({ nama, bytes, opsi }); return {}; }, async remove(nama) { calls.push({ hapus: nama }); return {}; } }; } } };
  const hasil = await mod.unggahFoto(db, file);
  assert.match(hasil.nama, /^[a-f0-9-]{36}\.jpg$/); assert.equal(hasil.url, `/media/produk/${hasil.nama}`); assert.equal(calls[0].opsi.upsert, false);
  await mod.bersihkanUpload(db, hasil.nama); assert.deepEqual(Array.from(calls[1].hapus), [hasil.nama]);
  db.storage.from = () => ({ upload: async () => ({ error: new Error("secret") }) });
  assert.ok((await mod.unggahFoto(db, file)).error);
});

const ulasan = await loadSource("lib/ulasan.js");
function form(values = {}) { const fd = new FormData(); for (const [k, v] of Object.entries({ nama: "Nama uji", rating: "5", komentar: "Kopi enak sekali", website: "", ...values })) fd.set(k, v); return fd; }
test("ulasan memvalidasi semua field, batas rating/panjang, ID dan honeypot", () => {
  assert.equal(ulasan.validasiUlasan("1", form()).data.p_rating, 5);
  for (const values of [{ nama: "a" }, { nama: "a".repeat(81) }, { rating: "0" }, { rating: "6" }, { rating: "1.5" }, { komentar: "x" }, { komentar: "a".repeat(1001) }, { website: "spam" }]) assert.ok(ulasan.validasiUlasan("1", form(values)).error);
  const gagal = ulasan.validasiUlasan("1", form({ nama: "", rating: "0", komentar: "" }));
  assert.equal(Object.keys(gagal.fieldErrors).length, 3);
  assert.ok(ulasan.validasiUlasan("x", form()).error);
});
test("aksi ulasan hanya menulis via RPC sempit; kegagalan tidak mengumumkan sukses", async () => {
  let args, gagal = false, calls = 0; const cache = [];
  const mod = await loadSource("app/produk/ulasan-actions.js", { mocks: { "@/lib/supabase/server": { createServerClient: () => ({ rpc: async (nama, data) => { calls++; assert.equal(nama, "kirim_ulasan"); args = data; return gagal ? { error: new Error("private") } : { data: 1 }; } }) }, "next/cache": { revalidatePath: (path) => cache.push(path) } } });
  assert.ok((await mod.kirimUlasan("1", {}, form())).success); assert.equal(args.p_produk_id, "1"); assert.deepEqual(cache, ["/produk/1", "/admin/ulasan"]);
  gagal = true; assert.ok((await mod.kirimUlasan("1", {}, form())).error);
  await mod.kirimUlasan("1", {}, form({ website: "spam" })); assert.equal(calls, 2);
});
test("seluruh aksi kategori/status/moderasi dan ekspor memeriksa sesi sebelum query", async () => {
  const mocks = { "@/lib/supabase/admin": { requireAdmin: async () => { throw new Error("LOGIN_REQUIRED"); } }, "next/cache": { revalidatePath: () => assert.fail("Tidak boleh revalidasi") }, "@/lib/produk-server": { semuaProduk: () => assert.fail("Tidak boleh membaca produk") } };
  const mod = await loadSource("app/admin/kelola-actions.js", { mocks });
  for (const panggil of [() => mod.tambahKategori({}, form()), () => mod.ubahKategori("Lama", {}, form()), () => mod.hapusKategori("Lama", {}, form()), () => mod.ubahStatusProduk("1", false, {}, form()), () => mod.moderasiUlasan("1", "hapus", {}, form())]) await assert.rejects(panggil, /LOGIN_REQUIRED/);
  const ekspor = await loadSource("app/admin/produk/ekspor/route.js", { mocks, globals: { Response } });
  await assert.rejects(() => ekspor.GET(), /LOGIN_REQUIRED/);
});
test("pencarian admin dan paginasi tidak menyaring produk aktif", async () => {
  const mod = await loadSource("lib/admin-data.js"); const calls = [];
  const db = { from() { const call = {}; calls.push(call); return { select(_c, opsi) { call.opsi = opsi; return this; }, ilike(key, value) { call.filter = [key, value]; return this; }, order() { return this; }, range(a, b) { call.range = [a,b]; return this; }, then(resolve) { return Promise.resolve({ count: 25, data: [{ id: 1, aktif: false }] }).then(resolve); } }; } };
  const hasil = await mod.halamanAdmin(db, { cari: "Kopi%", halaman: "2" }); assert.equal(hasil.halaman, 2); assert.equal(hasil.jumlahHalaman, 3); assert.deepEqual(calls[1].range, [12,23]); assert.deepEqual(calls[0].filter, ["nama", "%Kopi\\%%"]); assert.equal(hasil.daftarProduk[0].aktif, false);
});

test("pembacaan detail hanya produk aktif; ID salah tidak mengakses database", async () => {
  const calls = []; let data = { id: 1, aktif: true };
  const db = { from(table) { calls.push(["from",table]); return { select() { return this; }, eq(col, value) { calls.push([col,value]); return this; }, async maybeSingle() { return { data }; } }; } };
  const mod = await loadSource("lib/produk-server.js", { mocks: { react: { cache: (fn)=>fn }, "@/lib/supabase/server": { createServerClient: ()=>db } } });
  assert.equal(await mod.ambilProdukPublik("abc"),null); assert.equal(calls.length,0);
  assert.equal((await mod.ambilProdukPublik("1")).id,1); assert.deepEqual(calls.at(-1),["aktif",true]);
  data=null; assert.equal(await mod.ambilProdukPublik("3"),null);
});
