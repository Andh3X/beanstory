import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { idProdukValid } from "@/lib/produk";

export const ambilProdukPublik = cache(async (id) => {
  if (!idProdukValid(id)) return null;
  const { data, error } = await createServerClient().from("produk").select("*,varian(id,nama,harga)").eq("id", id).eq("aktif", true).maybeSingle();
  if (error) throw new Error("Produk belum dapat dimuat. Silakan coba lagi.");
  return data;
});

export async function semuaProduk(supabase, kolom = "*", aktif = false) {
  const hasil = [];
  for (let awal = 0; ; awal += 1000) {
    let query = supabase.from("produk").select(kolom).order("id");
    if (aktif) query = query.eq("aktif", true);
    const { data, error } = await query.range(awal, awal + 999);
    if (error) throw new Error("Data produk gagal dimuat.");
    hasil.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return hasil;
}
