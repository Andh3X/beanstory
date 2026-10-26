import { requireAdmin } from "@/lib/supabase/admin";
import { halamanValid } from "@/lib/admin-data";
import { moderasiUlasan } from "@/app/admin/kelola-actions";
import NavAdmin from "@/components/NavAdmin";
import FormAksi from "@/components/FormAksi";
import Paginasi from "@/components/Paginasi";
export default async function Ulasan({ searchParams }) {
  const supabase = await requireAdmin();
  const params = await searchParams;
  const hitung = await supabase.from("ulasan").select("id", { count: "exact", head: true });
  if (hitung.error) throw new Error("Daftar ulasan gagal dimuat.");
  const jumlahHalaman = Math.max(1, Math.ceil((hitung.count || 0) / 20));
  const halaman = Math.min(halamanValid(params.halaman), jumlahHalaman);
  const { data, error } = await supabase.from("ulasan").select("*,produk(nama)").order("created_at", { ascending: false }).order("id", { ascending: false }).range((halaman - 1) * 20, halaman * 20 - 1);
  if (error) throw new Error("Daftar ulasan gagal dimuat.");
  return <div className="flex flex-col gap-6 py-8"><NavAdmin /><h1 className="text-2xl font-extrabold">Moderasi ulasan</h1>{!data?.length ? <p>Belum ada ulasan.</p> : data.map((u) => <article key={u.id} className="flex flex-col gap-3 rounded-xl border border-garis p-4 [overflow-wrap:anywhere]"><h2 className="font-bold">{u.produk?.nama || `Produk #${u.produk_id}`} · {u.rating}/5</h2><p>{u.nama} · {u.terlihat ? "Ditampilkan" : "Disembunyikan"}</p><p className="whitespace-pre-wrap">{u.komentar}</p><div className="flex flex-wrap gap-3"><FormAksi action={moderasiUlasan.bind(null, u.id, u.terlihat ? "sembunyikan" : "tampilkan")} label={u.terlihat ? "Sembunyikan" : "Tampilkan kembali"} /><FormAksi action={moderasiUlasan.bind(null, u.id, "hapus")} label="Hapus" bahaya konfirmasi={`Hapus ulasan dari “${u.nama}” untuk “${u.produk?.nama || u.produk_id}”?`} /></div></article>)}<Paginasi path="/admin/ulasan" halaman={halaman} jumlahHalaman={jumlahHalaman} /></div>;
}
