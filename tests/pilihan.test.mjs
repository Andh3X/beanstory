import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers.mjs";

const p = await loadSource("lib/pilihan.js");
test("akses penyimpanan ditolak atau kuota penuh tetap aman dan dilaporkan", () => {
  const ditolak = () => { throw new Error("SecurityError"); };
  assert.equal(p.muatPilihan(ditolak).tersedia, false);
  assert.equal(p.muatPilihan(ditolak).data.favorit.length, 0);
  assert.equal(p.simpanPilihan(p.kosong(), ditolak), false);
  assert.equal(p.simpanPilihan(p.kosong(), () => ({ setItem() { throw new Error("QuotaExceeded"); } })), false);
  let tersimpan;
  assert.equal(p.simpanPilihan(p.kosong(), () => ({ setItem(key, value) { assert.equal(key, p.KUNCI_PILIHAN); tersimpan = value; } })), true);
  assert.equal(p.muatPilihan(() => ({ getItem: () => tersimpan })).tersedia, true);
});
test("penyimpanan rusak atau bentuk salah kembali kosong tanpa melempar error", () => {
  for (const value of [null, "rusak", "[]", "null", "42", "{}", '{"favorit":null,"keranjang":[null,{},"1"]}']) {
    const hasil = p.bacaPilihan(value);
    assert.equal(hasil.keranjang.length, 0);
    assert.equal(hasil.favorit.length, 0);
  }
});
test("normalisasi hanya menyimpan ID/jumlah valid, unik, dan dibatasi", () => {
  const ids = Array.from({ length: 70 }, (_, i) => String(i + 1));
  const hasil = p.bacaPilihan(JSON.stringify({ favorit: ["1", "1", "-1", ...ids], riwayat: ids, banding: ids, keranjang: [{ id: "1", jumlah: 2, harga: 900 }, { id: "1", jumlah: 1 }, { id: "2", jumlah: 0 }, ...ids.slice(2).map((id) => ({ id, jumlah: 1 }))] }));
  assert.equal(hasil.favorit.length, 50); assert.equal(hasil.riwayat.length, 6); assert.equal(hasil.banding.length, 2); assert.equal(hasil.keranjang.length, 20);
  assert.deepEqual(Object.keys(hasil.keranjang[0]), ["id", "jumlah"]);
});
test("batas perbandingan ketiga ditolak, pilihan lama dapat dihapus", () => {
  let data = p.kosong();
  data = p.tambahPilihan(data, "banding", "1").data;
  data = p.tambahPilihan(data, "banding", "2").data;
  assert.match(p.tambahPilihan(data, "banding", "3").error, /Maksimal 2/);
  assert.equal(data.banding.length, 2);
  assert.equal(p.tambahPilihan(data, "banding", "1").data.banding.length, 1);
});
test("keranjang 20 produk unik, jumlah digabung; riwayat terbaru maksimal enam", () => {
  let data = p.kosong();
  for (let i = 1; i <= 20; i++) data = p.tambahPilihan(data, "keranjang", String(i), 1).data;
  assert.ok(p.tambahPilihan(data, "keranjang", "21", 1).error);
  data = p.tambahPilihan(data, "keranjang", "1", 2).data;
  assert.equal(data.keranjang[0].jumlah, 3);
  assert.ok(p.tambahPilihan(data, "keranjang", "1", 99).error);
  for (let i = 1; i <= 8; i++) data = p.tambahPilihan(data, "riwayat", String(i)).data;
  data = p.tambahPilihan(data, "riwayat", "5").data;
  assert.deepEqual(Array.from(data.riwayat), ["5", "8", "7", "6", "4", "3"]);
});
test("total keranjang memakai harga terbaru dan diskon, pesan semua satu tautan", () => {
  const produk = [{ id: 1, nama: "Kopi", harga: 100, harga_diskon: 80, stok: 5, aktif: true }, { id: 2, nama: "Teh", harga: 50, stok: null, aktif: true }];
  const hasil = p.hitungKeranjang([{ id: "1", jumlah: 2 }, { id: "2", jumlah: 3 }], produk);
  assert.equal(hasil.total, 310); assert.equal(hasil.bolehPesan, true);
  const pesan = p.pesanKeranjang(hasil); assert.match(pesan, /Kopi/); assert.match(pesan, /Teh/); assert.match(pesan, /310/);
  assert.equal(p.hitungKeranjang([{ id: "1", jumlah: 2 }], [{ ...produk[0], harga_diskon: 60 }]).total, 120);
});
test("stok habis, kurang, hilang, nonaktif, dan jumlah salah memblokir seluruh pesanan", () => {
  const item = [{ id: "1", jumlah: 2 }];
  for (const produk of [[], [{ id: 1, harga: 100, stok: 0, aktif: true }], [{ id: 1, harga: 100, stok: 1, aktif: true }], [{ id: 1, harga: 100, stok: 5, aktif: false }]]) {
    const hasil = p.hitungKeranjang(item, produk); assert.equal(hasil.bolehPesan, false); assert.equal(p.pesanKeranjang(hasil), null);
  }
  assert.equal(p.hitungKeranjang([], []).bolehPesan, false);
  assert.equal(p.hitungKeranjang([{ id: "1", jumlah: -1 }], [{ id: 1, harga: 100, aktif: true }]).bolehPesan, false);
});
test("resolusi ID menolak input berlebih, injeksi, bigint berlebih dan bilangan tak aman", () => {
  for (const ids of [null, {}, ["1 OR 1=1"], ["9223372036854775808"], [9007199254740992], Array(51).fill("1")]) assert.equal(p.daftarId(ids), null);
  assert.deepEqual(Array.from(p.daftarId([1, "1", "2"])), ["1", "2"]);
});
