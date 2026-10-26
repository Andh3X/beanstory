import { fotoUrlValid } from "@/lib/produk";
export const teksForm = (form, key) => typeof form?.get?.(key) === "string" ? form.get(key).trim() : "";
export function linkAman(value) {
  return fotoUrlValid(value);
}
export function validasiToko(form) {
  const data = { nama: teksForm(form,"nama"), tagline: teksForm(form,"tagline"), nomor_whatsapp: teksForm(form,"nomor_whatsapp").replace(/[\s()+-]/g,""), alamat: teksForm(form,"alamat"), jam_buka: teksForm(form,"jam_buka") };
  const fieldErrors = {};
  for (const [key, max] of [["nama",100],["alamat",500],["jam_buka",200]]) if (!data[key] || data[key].length > max) fieldErrors[key] = `Wajib diisi, maksimal ${max} karakter.`;
  if (data.tagline.length > 300) fieldErrors.tagline = "Tagline maksimal 300 karakter.";
  if (!/^[1-9]\d{7,14}$/.test(data.nomor_whatsapp)) fieldErrors.nomor_whatsapp = "Gunakan nomor internasional 8–15 digit, misalnya 628…, tanpa awalan 0.";
  return Object.keys(fieldErrors).length ? { error: "Periksa pengaturan toko.", fieldErrors } : { data: { id: 1, ...data } };
}
export function validasiBanner(form) {
  const data = { id: 1, judul: teksForm(form,"judul"), teks: teksForm(form,"teks"), gambar: teksForm(form,"gambar") || null, tautan: teksForm(form,"tautan") || null, aktif: teksForm(form,"aktif") === "true" };
  const fieldErrors = {};
  if (!data.judul || data.judul.length > 150) fieldErrors.judul = "Judul wajib diisi, maksimal 150 karakter.";
  if (data.teks.length > 1000) fieldErrors.teks = "Teks maksimal 1.000 karakter.";
  for (const key of ["gambar","tautan"]) if (data[key] && (!linkAman(data[key]) || data[key].length > 2048)) fieldErrors[key] = "Gunakan link HTTP(S) atau path aplikasi yang valid.";
  return Object.keys(fieldErrors).length ? { error: "Periksa banner promo.", fieldErrors } : { data };
}
