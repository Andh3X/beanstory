import { requireAdmin } from "@/lib/supabase/admin";
import { semuaProduk } from "@/lib/produk-server";
import { buatCsv } from "@/lib/csv";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await requireAdmin();
  try {
    const produk = await semuaProduk(supabase);
    return new Response(buatCsv(produk), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="produk.csv"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Ekspor gagal. Silakan coba lagi.", { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
