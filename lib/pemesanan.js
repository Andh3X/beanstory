import { formatRupiah } from "./format";
import { hargaPesanan, produkHabis } from "./produk";

export function batasJumlah(produk) {
  return produkHabis(produk) ? 0 : Math.min(99, Number.isInteger(produk.stok) && produk.stok > 0 ? produk.stok : 99);
}

export function buatPesanWhatsApp(produk, jumlah, varianId = null) {
  const angka = Number(jumlah);
  if (!/^\d+$/.test(String(jumlah)) || !Number.isInteger(angka) || angka < 1 || angka > batasJumlah(produk)) return null;
  const pilihan=hargaPesanan(produk,varianId);
  if(!pilihan)return null;
  const {harga,namaVarian}=pilihan;
  return `Halo, saya ingin memesan ${produk.nama}.${namaVarian?`\nVarian: ${namaVarian}`:""}\nJumlah: ${angka}\nHarga satuan: ${formatRupiah(harga)}\nTotal: ${formatRupiah(harga * angka)}.`;
}
