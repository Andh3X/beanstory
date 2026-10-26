import "server-only";
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
