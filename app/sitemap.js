import { createServerClient } from "@/lib/supabase/server";
import { semuaProduk } from "@/lib/produk-server";
import { absolut } from "@/lib/site";
import { daftarKategoriPublik } from "@/lib/kategori-server";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const produk = await semuaProduk(createServerClient(), "id,created_at", true);
  const kategori=await daftarKategoriPublik();
  return [{ url: absolut("/") }, { url: absolut("/tentang") }, ...kategori.filter((k)=>k.slug).map((k)=>({url:absolut(`/kategori/${k.slug}`)})), ...produk.map((p) => ({ url: absolut(`/produk/${p.id}`), lastModified: p.created_at }))];
}
