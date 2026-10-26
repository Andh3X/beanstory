"use server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { validasiUlasan } from "@/lib/ulasan";
export async function kirimUlasan(id, _state, formData) {
  const hasil = validasiUlasan(id, formData);
  if (hasil.error) return hasil;
  try {
    // Pengecualian penulisan publik: RPC sempit yang hanya dapat dieksekusi service_role.
    const { data, error } = await createServerClient().rpc("kirim_ulasan", hasil.data);
    if (error || !data) return { error: "Ulasan gagal dikirim. Produk mungkin tidak tersedia. Silakan coba lagi." };
  } catch { return { error: "Ulasan gagal dikirim. Periksa koneksi lalu coba lagi." }; }
  revalidatePath(`/produk/${id}`);
  revalidatePath("/admin/ulasan");
  return { success: "Terima kasih. Ulasan Anda sudah ditampilkan." };
}
