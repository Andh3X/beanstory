"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { idProdukValid } from "@/lib/produk";

function segarkan() {
  revalidatePath("/", "layout");
}
function namaKategori(formData) {
  const isi = formData.get("nama");
  return typeof isi === "string" ? isi.trim() : "";
}
export async function tambahKategori(_state, formData) {
  const supabase = await requireAdmin();
  const nama = namaKategori(formData);
  if (!nama || nama.length > 100) return { error: "Nama kategori wajib diisi, maksimal 100 karakter." };
  try {
    const { data, error } = await supabase.from("kategori").insert({ nama }).select("nama").maybeSingle();
    if (error || !data) return { error: "Kategori gagal ditambahkan. Nama harus unik." };
  } catch { return { error: "Kategori gagal ditambahkan. Coba lagi." }; }
  segarkan(); return { success: "Kategori ditambahkan." };
}
export async function ubahKategori(lama, _state, formData) {
  const supabase = await requireAdmin();
  const nama = namaKategori(formData);
  if (typeof lama !== "string" || !lama || !nama || nama.length > 100) return { error: "Nama kategori wajib diisi, maksimal 100 karakter." };
  try {
    const { data, error } = await supabase.from("kategori").update({ nama }).eq("nama", lama).select("nama").maybeSingle();
    if (error || !data) return { error: "Kategori gagal diubah. Periksa nama unik dan keberadaan kategori." };
  } catch { return { error: "Kategori gagal diubah. Coba lagi." }; }
  segarkan(); return { success: "Kategori dan seluruh produk terkait diperbarui." };
}
export async function hapusKategori(nama, _state, _formData) {
  const supabase = await requireAdmin();
  if (typeof nama !== "string" || !nama) return { error: "Kategori tidak valid." };
  try {
    const { data, error } = await supabase.from("kategori").delete().eq("nama", nama).select("nama").maybeSingle();
    if (error || !data) return { error: "Kategori gagal dihapus. Kategori yang dipakai produk tidak boleh dihapus." };
  } catch { return { error: "Kategori gagal dihapus. Coba lagi." }; }
  segarkan(); return { success: "Kategori dihapus." };
}
export async function ubahStatusProduk(id, aktif, _state, _formData) {
  const supabase = await requireAdmin();
  if (!idProdukValid(id) || typeof aktif !== "boolean") return { error: "Status atau ID tidak valid." };
  try {
    const { data, error } = await supabase.from("produk").update({ aktif }).eq("id", id).select("id").maybeSingle();
    if (error || !data) return { error: "Status produk gagal diperbarui." };
  } catch { return { error: "Status produk gagal diperbarui." }; }
  segarkan(); return { success: aktif ? "Produk diaktifkan." : "Produk dinonaktifkan." };
}
export async function moderasiUlasan(id, operasi, _state, _formData) {
  const supabase = await requireAdmin();
  if (!idProdukValid(id) || !["hapus", "tampilkan", "sembunyikan"].includes(operasi)) return { error: "Aksi ulasan tidak valid." };
  try {
    const tabel = supabase.from("ulasan");
    const query = operasi === "hapus" ? tabel.delete() : tabel.update({ terlihat: operasi === "tampilkan" });
    const { data, error } = await query.eq("id", id).select("id").maybeSingle();
    if (error || !data) return { error: "Ulasan tidak ditemukan atau gagal diperbarui." };
  } catch { return { error: "Ulasan gagal diperbarui." }; }
  segarkan(); return { success: "Ulasan diperbarui." };
}
