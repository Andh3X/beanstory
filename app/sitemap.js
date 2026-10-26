import { createServerClient } from "@/lib/supabase/server";
import { semuaProduk } from "@/lib/produk-server";
import { absolut } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const produk = await semuaProduk(createServerClient(), "id,created_at", true);
  return [{ url: absolut("/") }, { url: absolut("/tentang") }, ...produk.map((p) => ({ url: absolut(`/produk/${p.id}`), lastModified: p.created_at }))];
}
