import "server-only";
import { cache } from "react";
import { toko } from "@/lib/toko";
import { createServerClient } from "@/lib/supabase/server";

export const ambilToko = cache(async () => {
  try {
    const { data, error } = await createServerClient().from("pengaturan_toko").select("*").eq("id", 1).abortSignal(AbortSignal.timeout(4000)).maybeSingle();
    if (!error && data) return { nama: data.nama, tagline: data.tagline, nomorWhatsApp: data.nomor_whatsapp, alamat: data.alamat, jamBuka: data.jam_buka };
  } catch { /* Identitas statis menjadi cadangan saat layanan belum tersedia. */ }
  return toko;
});
export async function ambilBanner() {
  try {
    const { data, error } = await createServerClient().from("banner").select("*").eq("id", 1).eq("aktif", true).abortSignal(AbortSignal.timeout(4000)).maybeSingle();
    return error ? null : data;
  } catch { return null; }
}
