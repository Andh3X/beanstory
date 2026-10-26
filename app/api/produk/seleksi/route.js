import { createServerClient } from "@/lib/supabase/server";
import { daftarId } from "@/lib/pilihan";
export const dynamic = "force-dynamic";
export async function POST(request) {
  try {
    const teks = await request.text();
    if (teks.length > 4096) return Response.json({ error: "Permintaan terlalu besar." }, { status: 413 });
    let body;
    try { body = JSON.parse(teks); } catch { return Response.json({ error: "JSON tidak valid." }, { status: 400 }); }
    const ids = daftarId(body?.ids);
    if (!ids) return Response.json({ error: "Isi maksimal 50 ID produk yang valid." }, { status: 400 });
    if (!ids.length) return Response.json({ produk: [] }, { headers: { "Cache-Control": "no-store" } });
    const { data, error } = await createServerClient().from("produk").select("id,nama,harga,harga_diskon,kategori,foto_url,deskripsi,stok,aktif,badge").eq("aktif", true).in("id", ids);
    if (error) throw new Error();
    return Response.json({ produk: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Data produk terbaru belum dapat dimuat." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
