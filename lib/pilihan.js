import { idProdukValid, hargaPesanan } from "@/lib/produk";
import { batasJumlah } from "@/lib/pemesanan";
import { formatRupiah } from "@/lib/format";

export const KUNCI_PILIHAN = "beanstory:pilihan:v2";
export const KUNCI_LAMA = "beanstory:pilihan:v1";
export const kunciItem=(item)=>`${item.id}${item.varian_id?`:${item.varian_id}`:""}`;
export const BATAS = { keranjang: 20, favorit: 50, riwayat: 6, banding: 2 };
export function kosong() { return { keranjang: [], favorit: [], riwayat: [], banding: [] }; }
export function muatPilihan(akses = () => window.localStorage) {
  try { const storage=akses();return { data: bacaPilihan(storage.getItem(KUNCI_PILIHAN) ?? storage.getItem(KUNCI_LAMA)), tersedia: true }; }
  catch { return { data: kosong(), tersedia: false }; }
}
export function simpanPilihan(data, akses = () => window.localStorage) {
  try { akses().setItem(KUNCI_PILIHAN, JSON.stringify(data)); return true; }
  catch { return false; }
}
export function daftarId(ids, max = 50) {
  if (!Array.isArray(ids) || ids.length > max || ids.some((id) => !idProdukValid(id))) return null;
  return [...new Set(ids.map(String))];
}
export function bacaPilihan(teks) {
  try {
    const data = JSON.parse(teks);
    if (!data || typeof data !== "object" || Array.isArray(data)) return kosong();
    const hasil = kosong();
    for (const tipe of ["favorit", "riwayat", "banding"]) {
      hasil[tipe] = [...new Set((Array.isArray(data[tipe]) ? data[tipe] : []).filter(idProdukValid).map(String))].slice(0, BATAS[tipe]);
    }
    const unik = new Set();
    hasil.keranjang = (Array.isArray(data.keranjang) ? data.keranjang : []).filter((item) => {
      if (!item || !idProdukValid(item.id) || (item.varian_id!=null&&!idProdukValid(item.varian_id)) || !Number.isInteger(item.jumlah) || item.jumlah < 1 || item.jumlah > 99 || unik.has(kunciItem(item))) return false;
      unik.add(kunciItem(item)); return true;
    }).slice(0, BATAS.keranjang).map(({ id, jumlah, varian_id }) => ({ id: String(id), jumlah, ...(varian_id!=null?{varian_id:String(varian_id)}:{}) }));
    return hasil;
  } catch { return kosong(); }
}
export function tambahPilihan(data, tipe, id, jumlah = 1, varianId = null) {
  if (!Object.hasOwn(BATAS, tipe) || !idProdukValid(id)) return { error: "Pilihan produk tidak valid." };
  id = String(id);
  if (tipe === "keranjang") {
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 99) return { error: "Jumlah harus antara 1 dan 99." };
    if(varianId!==null&&!idProdukValid(varianId))return{error:"Varian tidak valid."};
    const baru={id,jumlah,...(varianId!==null?{varian_id:String(varianId)}:{})};
    const ada = data.keranjang.find((item) => kunciItem(item)===kunciItem(baru));
    if (!ada && data.keranjang.length >= BATAS.keranjang) return { error: "Keranjang maksimal 20 pilihan produk/varian." };
    if (ada && ada.jumlah + jumlah > 99) return { error: "Jumlah per produk maksimal 99." };
    return { data: { ...data, keranjang: ada ? data.keranjang.map((item) => kunciItem(item)===kunciItem(baru) ? { ...item, jumlah: item.jumlah + jumlah } : item) : [...data.keranjang, baru] }, pesan: "Produk ditambahkan ke keranjang." };
  }
  if (tipe === "riwayat") return { data: { ...data, riwayat: [id, ...data.riwayat.filter((v) => v !== id)].slice(0, 6) } };
  if (data[tipe].includes(id)) return { data: { ...data, [tipe]: data[tipe].filter((v) => v !== id) }, pesan: "Produk dihapus dari pilihan." };
  if (data[tipe].length >= BATAS[tipe]) return { error: tipe === "banding" ? "Maksimal 2 produk untuk dibandingkan. Hapus salah satu pilihan dahulu." : "Favorit maksimal 50 produk." };
  return { data: { ...data, [tipe]: [...data[tipe], id] }, pesan: "Produk disimpan." };
}
export function hitungKeranjang(items, produk) {
  const baris = items.map((item) => {
    const p = produk.find((p) => String(p.id) === item.id);
    const pilihan=p?hargaPesanan(p,item.varian_id):null;
    const jumlahProduk=items.filter((r)=>r.id===item.id).reduce((n,r)=>n+r.jumlah,0);
    const valid = Boolean(p && p.aktif && pilihan && Number.isInteger(item.jumlah) && item.jumlah > 0 && jumlahProduk <= batasJumlah(p));
    return { ...item, produk: p, valid, harga:pilihan?.harga, namaVarian:pilihan?.namaVarian, subtotal: valid ? pilihan.harga * item.jumlah : 0 };
  });
  return { baris, total: baris.reduce((n, row) => n + row.subtotal, 0), bolehPesan: baris.length > 0 && baris.every((r) => r.valid) };
}
export function pesanKeranjang(hasil) {
  if (!hasil.bolehPesan) return null;
  return `Halo, saya ingin memesan:\n${hasil.baris.map((row) => `${row.produk.nama}${row.namaVarian?` (${row.namaVarian})`:""} — ${row.jumlah} × ${formatRupiah(row.harga)} = ${formatRupiah(row.subtotal)}`).join("\n")}\nTotal: ${formatRupiah(hasil.total)}\nMohon konfirmasi ketersediaannya.`;
}
