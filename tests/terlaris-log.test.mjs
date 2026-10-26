import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadSource } from "./helpers.mjs";

const admin = await loadSource("lib/admin-data.js");
test("terlaris meminta maksimum lima hasil database dan menjaga batas bila RPC lama memberi lebih", async () => {
  const calls = [];
  const ranking = [8, 8, 7, 6, 5, 4, 3].map((jumlah, i) => ({ produk_id: i + 1, nama: `Produk ${i + 1}`, jumlah }));
  const db = { rpc(nama) { calls.push(["rpc", nama]); return { async limit(n) { calls.push(["limit", n]); return { data: ranking }; } }; } };
  const hasil = await admin.ambilProdukTerlaris(db);
  assert.deepEqual(calls, [["rpc", "produk_terlaris"], ["limit", 5]]);
  assert.deepEqual(Array.from(hasil, (p) => p.produk_id), [1, 2, 3, 4, 5]);
  assert.deepEqual(Array.from(hasil, (p) => p.jumlah), [8, 8, 7, 6, 5]);
});

test("terlaris kosong atau kurang dari lima tidak membuat produk/klik fiktif", async () => {
  for (const data of [null, [], [{ produk_id: 1, nama: "Kopi", jumlah: 2 }]]) {
    const db = { rpc: () => ({ limit: async () => ({ data }) }) };
    const hasil = await admin.ambilProdukTerlaris(db);
    assert.equal(hasil.length, data?.length || 0);
  }
});

test("RPC terlaris gagal dibedakan dari hasil kosong tanpa membocorkan error database", async () => {
  for (const mode of ["response", "throw"]) {
    const db = { rpc: () => ({ limit: async () => {
      if (mode === "throw") throw new Error("koneksi uji gagal");
      return { error: new Error("detail internal"), data: null };
    } }) };
    await assert.rejects(() => admin.ambilProdukTerlaris(db));
  }
});

test("definisi SQL yang disertakan di pemanggil identik dengan migrasi 003", async () => {
  const root = new URL("../", import.meta.url);
  const normalize = (sql) => sql.replace(/\s+/g, " ").trim();
  const migration = normalize(await readFile(new URL("docs/migrations/003-us41-us50.sql", root), "utf8"));
  for (const [path, label] of [["lib/admin-data.js", "US-41"], ["app/admin/actions.js", "US-45 tabel"], ["app/admin/actions.js", "US-45 trigger"]]) {
    const source = await readFile(new URL(path, root), "utf8");
    const match = source.match(new RegExp(`Awal SQL ${label}\\r?\\n([\\s\\S]*?)\\s*\\* Akhir SQL ${label}`));
    assert.ok(match, `Definisi ${label} harus disertakan lengkap`);
    assert.ok(migration.includes(normalize(match[1])), `${label} berbeda dari migrasi yang diterapkan`);
  }
});
