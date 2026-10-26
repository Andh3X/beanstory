import { createServerClient } from "@/lib/supabase/server";
import { absolut } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function GET(_request, { params }) {
  const { nama } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(jpg|png|webp)$/.test(nama)) return new Response(null, { status: 404 });
  try {
    const supabase = createServerClient();
    const path = `/media/produk/${nama}`;
    const { data, error } = await supabase.from("produk").select("id").eq("aktif", true).in("foto_url", [path, absolut(path)]).limit(1);
    if (error) return new Response(null, { status: 503 });
    if (!data?.length) return new Response(null, { status: 404 });
    const foto = await supabase.storage.from("produk").download(nama);
    if (foto.error || !foto.data) return new Response(null, { status: 404 });
    const type = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[nama.split(".").pop()];
    return new Response(foto.data, { headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 503 }); }
}
