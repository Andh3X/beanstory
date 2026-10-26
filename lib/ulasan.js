import { idProdukValid } from "@/lib/produk";
export function validasiUlasan(id, formData) {
  const teks = (key) => typeof formData?.get?.(key) === "string" ? formData.get(key).trim() : "";
  const nama = teks("nama"), komentar = teks("komentar"), rating = teks("rating");
  const fieldErrors = {};
  if (!idProdukValid(id)) return { error: "Produk tidak valid." };
  if (teks("website")) return { error: "Ulasan ditolak. Kosongkan kolom tambahan." };
  if (nama.length < 2 || nama.length > 80) fieldErrors.nama = "Nama harus 2–80 karakter.";
  if (!/^[1-5]$/.test(rating)) fieldErrors.rating = "Pilih rating 1–5.";
  if (komentar.length < 5 || komentar.length > 1000) fieldErrors.komentar = "Komentar harus 5–1.000 karakter.";
  if (Object.keys(fieldErrors).length) return { error: "Periksa isian ulasan.", fieldErrors };
  return { data: { p_produk_id: String(id), p_nama: nama, p_rating: Number(rating), p_komentar: komentar } };
}
