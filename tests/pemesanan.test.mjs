import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers.mjs";

const produk = await loadSource("lib/produk.js");
const pesan = await loadSource("lib/pemesanan.js");

test("jumlah dan harga diskon masuk pesan WhatsApp dengan total yang benar", () => {
  const hasil = pesan.buatPesanWhatsApp({ nama: "Kopi & susu", harga: 30000, harga_diskon: 25000, stok: 5 }, "3");
  assert.match(hasil, /Kopi & susu/);
  assert.match(hasil, /Jumlah: 3/);
  assert.match(hasil, /25\.000/);
  assert.match(hasil, /75\.000/);
});

test("stok habis dan jumlah tidak valid tidak menghasilkan link pesan", () => {
  for (const jumlah of ["", "0", "-1", "1.5", "1e2", "6", "NaN"]) {
    assert.equal(pesan.buatPesanWhatsApp({ nama: "Kopi", harga: 1000, stok: 5 }, jumlah), null);
  }
  assert.equal(pesan.buatPesanWhatsApp({ nama: "Kopi", harga: 1000, stok: 0 }, 1), null);
  assert.equal(pesan.batasJumlah({}), 99);
  assert.equal(pesan.batasJumlah({ stok: 2 }), 2);
  assert.equal(pesan.batasJumlah({ stok: 500 }), 99);
});

test("produk lama tetap memakai harga normal dan satu foto; galeri dibersihkan", () => {
  assert.equal(produk.hargaBerlaku({ harga: 1000 }), 1000);
  assert.equal(produk.hargaBerlaku({ harga: 1000, harga_diskon: 2000 }), 1000);
  assert.equal(produk.hargaBerlaku({ harga: 1000, harga_diskon: 0 }), 0);
  assert.deepEqual(Array.from(produk.fotoProduk({ foto_url: "/produk/kopi.svg" })), ["/produk/kopi.svg"]);
  assert.deepEqual(Array.from(produk.fotoProduk({ foto_url: "/produk/kopi.svg", foto_tambahan: ["/produk/kopi.svg", "https://example.com/2.jpg", "javascript:alert(1)"] })), ["/produk/kopi.svg", "https://example.com/2.jpg"]);
  assert.equal(produk.fotoUrlValid("/\\evil.com/foto"), false);
});
