import "server-only";

/**
 * SQL RPC terpasang melalui docs/migrations/003-us41-us50.sql.
 * Definisi disertakan di modul pemanggil agar asal hitungan dan LIMIT terlihat.
 * Ini dokumentasi SQL, bukan SQL yang dijalankan pada setiap request.
 * Awal SQL US-41
create or replace function public.produk_terlaris()
returns table(produk_id bigint, nama text, jumlah bigint) language sql stable security invoker set search_path = '' as $$
  select p.id, p.nama, count(*) from public.klik_whatsapp k join public.produk p on p.id=k.produk_id
  group by p.id,p.nama order by count(*) desc,p.id limit 5;
$$;
revoke all on function public.produk_terlaris() from public, anon;

grant execute on function public.produk_terlaris() to authenticated;
 * Akhir SQL US-41
 */
export async function ambilProdukTerlaris(supabase) {
  // Agregasi/count dan urutan dilakukan database, bukan dari satu halaman klik.
  const { data, error } = await supabase.rpc("produk_terlaris").limit(5);
  if (error) throw new Error("Data terlaris gagal dimuat.");
  // Batasi juga hasil pengganti/versi RPC lama yang mungkin mengirim >5 baris.
  return (data || []).slice(0, 5);
}

export function halamanValid(value) { return /^[1-9]\d{0,5}$/.test(String(value)) ? Number(value) : 1; }
export async function halamanAdmin(supabase, params = {}) {
  const cari = typeof params.cari === "string" ? params.cari.trim().slice(0, 100) : "";
  function query(kolom, opsi) {
    let q = supabase.from("produk").select(kolom, opsi);
    if (cari) q = q.ilike("nama", `%${cari.replace(/[\\%_]/g, "\\$&")}%`);
    return q;
  }
  const hitung = await query("id", { count: "exact", head: true });
  if (hitung.error) throw new Error("Daftar produk gagal dimuat.");
  const total = hitung.count || 0;
  const jumlahHalaman = Math.max(1, Math.ceil(total / 12));
  const halaman = Math.min(halamanValid(params.halaman), jumlahHalaman);
  const { data, error } = await query("*").order("urutan").order("id").range((halaman - 1) * 12, halaman * 12 - 1);
  if (error) throw new Error("Daftar produk gagal dimuat.");
  return { daftarProduk: data || [], total, halaman, jumlahHalaman, cari };
}
