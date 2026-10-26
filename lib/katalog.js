export const UKURAN_HALAMAN = 12;

export function opsiKatalog(params = {}) {
  const teks = (key) => typeof params[key] === "string" ? params[key].trim().slice(0, 100) : "";
  const page = teks("halaman");
  return {
    cari: teks("cari"), kategori: teks("kategori"),
    urutan: ["termurah", "termahal", "terbaru"].includes(teks("urutan")) ? teks("urutan") : "terbaru",
    halaman: /^[1-9]\d{0,5}$/.test(page) ? Number(page) : 1,
  };
}

export function linkKatalog(opsi, halaman) {
  const params = new URLSearchParams();
  if (opsi.cari) params.set("cari", opsi.cari);
  if (opsi.kategori) params.set("kategori", opsi.kategori);
  params.set("urutan", opsi.urutan);
  params.set("halaman", String(halaman));
  return `/?${params}`;
}

function saring(query, opsi) {
  if (opsi.cari) query = query.ilike("nama", `%${opsi.cari.replace(/[\\%_]/g, "\\$&")}%`);
  if (opsi.kategori) query = query.eq("kategori", opsi.kategori);
  return query;
}

export async function ambilHalamanKatalog(supabase, opsi) {
  const hitungan = await saring(supabase.from("produk").select("id", { count: "exact", head: true }), opsi);
  if (hitungan.error) throw new Error("Katalog belum dapat dimuat. Silakan coba lagi.");
  const total = hitungan.count || 0;
  const jumlahHalaman = Math.max(1, Math.ceil(total / UKURAN_HALAMAN));
  const halaman = Math.min(opsi.halaman, jumlahHalaman);
  if (!total) return { daftarProduk: [], total, halaman, jumlahHalaman };
  let query = saring(supabase.from("produk").select("*"), opsi);
  if (opsi.urutan === "terbaru") query = query.order("created_at", { ascending: false });
  else query = query.order("harga", { ascending: opsi.urutan === "termurah" });
  query = query.order("id", { ascending: opsi.urutan !== "terbaru" });
  const awal = (halaman - 1) * UKURAN_HALAMAN;
  const { data, error } = await query.range(awal, awal + UKURAN_HALAMAN - 1);
  if (error) throw new Error("Katalog belum dapat dimuat. Silakan coba lagi.");
  return { daftarProduk: data || [], total, halaman, jumlahHalaman };
}

export async function ambilKategori(supabase) {
  const kategori = new Set();
  for (let awal = 0; ; awal += 1000) {
    const { data, error } = await supabase.from("produk").select("kategori").order("id").range(awal, awal + 999);
    if (error) throw new Error("Kategori belum dapat dimuat.");
    for (const produk of data || []) {
      if (typeof produk.kategori === "string" && produk.kategori.trim()) kategori.add(produk.kategori);
    }
    if (!data || data.length < 1000) break;
  }
  return [...kategori].sort((a, b) => a.localeCompare(b, "id"));
}

export async function ambilProdukTerkait(supabase, produk) {
  if (!produk.kategori) return [];
  const { data, error } = await supabase.from("produk").select("*")
    .eq("kategori", produk.kategori).neq("id", produk.id)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(3);
  if (error) throw new Error("Produk terkait belum dapat dimuat.");
  return data || [];
}
