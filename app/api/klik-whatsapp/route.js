import { createServerClient } from "@/lib/supabase/server";
import { daftarId } from "@/lib/pilihan";
export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    // Next dapat memakai hostname internal pada request.url saat self-hosting.
    const host = request.headers.get("host") || new URL(request.url).host;
    if (origin && new URL(origin).host !== host) return new Response(null, { status: 403 });
    const teks = await request.text();
    if (teks.length > 2048) return new Response(null, { status: 413 });
    let body;
    try { body = JSON.parse(teks); } catch { return new Response(null, { status: 400 }); }
    const ids = daftarId(body?.ids, 20);
    if (!ids?.length) return new Response(null, { status: 400 });
    const { error } = await createServerClient().rpc("catat_klik_whatsapp", { p_ids: ids });
    return new Response(null, { status: error ? 503 : 204, headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 503 }); }
}
