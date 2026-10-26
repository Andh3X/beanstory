import "server-only";
import { randomUUID } from "node:crypto";

export const BATAS_FOTO = 3 * 1024 * 1024;
export function signatureFoto(bytes, type) {
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/png") return [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}
export async function unggahFoto(supabase, file) {
  if (!file || (file.size === 0 && !file.name)) return {};
  if (typeof file.arrayBuffer !== "function" || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > BATAS_FOTO) {
    return { error: "Pilih JPEG, PNG, atau WebP berukuran maksimal 3 MB." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size || !signatureFoto(bytes, file.type)) return { error: "Isi file tidak sesuai tipe foto. Pilih file gambar asli." };
  const ekstensi = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const nama = `${randomUUID()}.${ekstensi}`;
  const { error } = await supabase.storage.from("produk").upload(nama, bytes, { contentType: file.type, upsert: false });
  if (error) return { error: "Foto gagal diunggah. Periksa bucket dan izin Storage, lalu coba lagi." };
  return { nama, url: `/media/produk/${nama}` };
}
export async function bersihkanUpload(supabase, nama) {
  if (!nama) return;
  try {
    const { error } = await supabase.storage.from("produk").remove([nama]);
    if (error) console.error("Pembersihan upload produk gagal; periksa objek Storage yang tidak terpakai.");
  } catch { console.error("Pembersihan upload produk gagal; periksa Storage."); }
}
