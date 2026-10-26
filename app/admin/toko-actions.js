"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { validasiToko, validasiBanner } from "@/lib/pengaturan";

async function simpan(tabel, hasil, supabase) {
  if (hasil.error) return hasil;
  try {
    const { data, error } = await supabase.from(tabel).upsert(hasil.data).select("id").maybeSingle();
    if (error || !data) return { error: "Perubahan gagal disimpan. Periksa koneksi dan izin akun." };
  } catch { return { error: "Perubahan gagal disimpan. Coba lagi." }; }
  revalidatePath("/", "layout");
  revalidatePath("/manifest.webmanifest");
  return { success: "Perubahan berhasil disimpan." };
}
export async function simpanToko(_state, formData) {
  const db = await requireAdmin();
  return simpan("pengaturan_toko", validasiToko(formData), db);
}
export async function simpanBanner(_state, formData) {
  const db = await requireAdmin();
  return simpan("banner", validasiBanner(formData), db);
}
