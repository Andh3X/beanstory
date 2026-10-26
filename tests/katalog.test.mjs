import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers.mjs";

const katalog = await loadSource("lib/katalog.js");

function database({ total = 25, error = false, rows = [{ id: 1 }] } = {}) {
  const calls = [];
  return { calls, from(table) {
    assert.ok(["produk", "kategori"].includes(table));
    const call = { table, eqs: [] };
    calls.push(call);
    const query = {
      select(columns, options) { Object.assign(call, { columns, options }); return query; },
      eq(column, value) { call.eq = [column, value]; call.eqs.push([column, value]); return query; },
      neq(column, value) { call.neq = [column, value]; return query; },
      ilike(column, value) { call.ilike = [column, value]; return query; },
      order(column, options) { (call.order ||= []).push([column, options]); return query; },
      range(start, end) { call.range = [start, end]; return query; },
      limit(value) { call.limit = value; return query; },
      then(resolve, reject) {
        return Promise.resolve({ data: call.options?.head ? null : rows, count: total, error: error ? new Error("detail rahasia") : null }).then(resolve, reject);
      },
    };
    return query;
  } };
}

test("pencarian dan kategori diterapkan pada hitungan dan query halaman", async () => {
  const db = database();
  const opsi = katalog.opsiKatalog({ cari: " Kopi ", kategori: "Minuman", urutan: "termurah", halaman: "2" });
  const hasil = await katalog.ambilHalamanKatalog(db, opsi);
  assert.equal(hasil.total, 25);
  assert.equal(hasil.jumlahHalaman, 3);
  assert.equal(hasil.halaman, 2);
  for (const call of db.calls) {
    assert.deepEqual(call.eqs[0], ["aktif", true]);
    assert.deepEqual(call.eq, ["kategori", "Minuman"]);
    assert.deepEqual(call.ilike, ["nama", "%Kopi%"]);
  }
  assert.equal(db.calls[0].options.head, true);
  assert.deepEqual(db.calls[1].range, [12, 23]);
  assert.equal(db.calls[1].order[0][0], "harga");
  assert.equal(db.calls[1].order[0][1].ascending, true);
});

test("urutan termurah, termahal, terbaru diproses di database dengan urutan ID stabil", async () => {
  for (const [urutan, kolom, naik] of [["termurah", "harga", true], ["termahal", "harga", false], ["terbaru", "created_at", false]]) {
    const db = database();
    await katalog.ambilHalamanKatalog(db, katalog.opsiKatalog({ urutan }));
    assert.equal(db.calls[1].order[0][0], kolom);
    assert.equal(db.calls[1].order[0][1].ascending, naik);
    assert.equal(db.calls[1].order[1][0], "id");
  }
});

test("halaman berlebih dibatasi ke halaman terakhir; katalog kosong tidak mengambil baris", async () => {
  const db = database();
  const hasil = await katalog.ambilHalamanKatalog(db, katalog.opsiKatalog({ halaman: "999" }));
  assert.equal(hasil.halaman, 3);
  assert.deepEqual(db.calls[1].range, [24, 35]);
  const kosong = database({ total: 0, rows: [] });
  assert.equal((await katalog.ambilHalamanKatalog(kosong, katalog.opsiKatalog())).jumlahHalaman, 1);
  assert.equal(kosong.calls.length, 1);
});

test("parameter tidak valid dinormalisasi; link halaman mempertahankan filter", () => {
  const invalid = katalog.opsiKatalog({ cari: ["x"], halaman: "-5", urutan: "harga;drop" });
  assert.equal(invalid.cari, "");
  assert.equal(invalid.halaman, 1);
  assert.equal(invalid.urutan, "terbaru");
  const url = new URL(katalog.linkKatalog(katalog.opsiKatalog({ cari: "kopi & susu", kategori: "Minuman", urutan: "termahal" }), 2), "https://example.com");
  assert.equal(url.searchParams.get("cari"), "kopi & susu");
  assert.equal(url.searchParams.get("halaman"), "2");
});

test("wildcard persen dan garis bawah pada pencarian diperlakukan literal", async () => {
  const db = database();
  await katalog.ambilHalamanKatalog(db, katalog.opsiKatalog({ cari: "50%_" }));
  assert.deepEqual(db.calls[0].ilike, ["nama", "%50\\%\\_%"]);
});

test("produk terkait difilter kategori, mengecualikan produk saat ini, maksimal tiga", async () => {
  const db = database();
  await katalog.ambilProdukTerkait(db, { id: 7, kategori: "Minuman" });
  assert.deepEqual(db.calls[0].eq, ["kategori", "Minuman"]);
  assert.deepEqual(db.calls[0].eqs[0], ["aktif", true]);
  assert.deepEqual(db.calls[0].neq, ["id", 7]);
  assert.equal(db.calls[0].limit, 3);
  const kosong = database();
  assert.equal((await katalog.ambilProdukTerkait(kosong, { id: 7 })).length, 0);
  assert.equal(kosong.calls.length, 0);
});

test("pilihan kategori unik berasal dari database; error database tidak bocor", async () => {
  const db = database({ rows: [{ nama: "Minuman" }, { nama: "Minuman" }, { nama: null }, { nama: "Kue" }] });
  assert.deepEqual(Array.from(await katalog.ambilKategori(db)), ["Kue", "Minuman"]);
  await assert.rejects(() => katalog.ambilHalamanKatalog(database({ error: true }), katalog.opsiKatalog()), /Katalog belum dapat dimuat/);
});
