import { formatRupiah } from "./format";
import { hargaBerlaku, produkHabis } from "./produk";

export function batasJumlah(produk) {
  return produkHabis(produk) ? 0 : Math.min(99, Number.isInteger(produk.stok) && produk.stok > 0 ? produk.stok : 99);
}

export function buatPesanWhatsApp(produk, jumlah) {
  const angka = Number(jumlah);
  if (!/^\d+$/.test(String(jumlah)) || !Number.isInteger(angka) || angka < 1 || angka > batasJumlah(produk)) return null;
  const harga = hargaBerlaku(produk);
  return `Halo, saya ingin memesan ${produk.nama}.\nJumlah: ${angka}\nHarga satuan: ${formatRupiah(harga)}\nTotal: ${formatRupiah(harga * angka)}.`;
}
