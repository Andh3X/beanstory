import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { requireAdmin } from "@/lib/supabase/admin";
import { halamanAdmin } from "@/lib/admin-data";
import Paginasi from "@/components/Paginasi";
import ProdukTerlaris from "@/components/ProdukTerlaris";

const pesanStatus = {
  created: "Produk berhasil ditambahkan.",
  updated: "Produk berhasil diperbarui.",
  deleted: "Produk berhasil dihapus.",
};

export default async function HalamanAdmin({ searchParams }) {
  const supabase = await requireAdmin();
  const params = (await searchParams) || {};
  const { status } = params;
  const pesanSukses = Object.hasOwn(pesanStatus, status) ? pesanStatus[status] : null;
  let daftarProduk = [];
  let gagalMemuat = false;
  let hasil;
  let statistik = null;

  try {
    hasil = await halamanAdmin(supabase, params);
    daftarProduk = hasil.daftarProduk;
  } catch {
    gagalMemuat = true;
  }
  try {
    const { data, error } = await supabase.rpc("statistik_produk");
    if (!error) statistik = data || [];
  } catch { /* Statistik gagal tidak menyembunyikan daftar. */ }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <ProdukTerlaris db={supabase} />
      <section className="rounded-xl border border-garis bg-permukaan p-4" aria-label="Statistik seluruh produk">
        {statistik ? <><h2 className="font-bold">Seluruh produk: {statistik.reduce((total, item) => total + Number(item.jumlah), 0)}</h2><p className="mt-1 text-sm text-teks-lembut">Termasuk produk nonaktif, tidak mengikuti pencarian.</p><ul className="mt-3 flex flex-wrap gap-4 text-sm">{statistik.map((item) => <li key={item.kategori ?? ""}>{item.kategori || "Tanpa kategori"}: {item.jumlah}</li>)}</ul></> : <p role="alert">Statistik belum dapat dimuat.</p>}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
        <a href="/admin/produk/ekspor" className="text-sm text-utama underline">Unduh seluruh produk (CSV)</a>
      </div>
      <form action="/admin" className="flex flex-wrap gap-2"><label className="flex flex-col gap-1 text-sm">Cari nama produk<input name="cari" defaultValue={hasil?.cari || ""} maxLength={100} className="rounded-lg border border-garis bg-latar p-3" /></label><Tombol type="submit" varian="garis">Cari</Tombol></form>
      {pesanSukses && !gagalMemuat ? <p role="status" className="text-sm text-utama">{pesanSukses}</p> : null}
      {gagalMemuat ? (
        <p role="alert" className="rounded-xl border border-garis p-4 text-sm text-bahaya">
          Daftar produk gagal dimuat. Periksa koneksi dan izin akun, lalu muat ulang halaman.
        </p>
      ) : daftarProduk.length === 0 ? (
        <p className="rounded-xl border border-garis p-6 text-center text-teks-lembut">
          {hasil?.cari ? "Tidak ada produk sesuai pencarian." : 'Belum ada produk. Pilih "Tambah produk" untuk mengisi katalog.'}
        </p>
      ) : (
        <TabelProduk daftarProduk={daftarProduk} />
      )}
      {hasil ? <Paginasi {...hasil} path="/admin" params={{ cari: hasil.cari }} /> : null}
    </div>
  );
}
