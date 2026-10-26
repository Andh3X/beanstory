import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { requireAdmin } from "@/lib/supabase/admin";

const pesanStatus = {
  created: "Produk berhasil ditambahkan.",
  updated: "Produk berhasil diperbarui.",
  deleted: "Produk berhasil dihapus.",
};

export default async function HalamanAdmin({ searchParams }) {
  const supabase = await requireAdmin();
  const { status } = (await searchParams) || {};
  const pesanSukses = Object.hasOwn(pesanStatus, status) ? pesanStatus[status] : null;
  let daftarProduk = [];
  let gagalMemuat = false;

  try {
    const { data, error } = await supabase.from("produk").select("*").order("id", { ascending: true });
    gagalMemuat = Boolean(error);
    daftarProduk = data || [];
  } catch {
    gagalMemuat = true;
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>
      {pesanSukses && !gagalMemuat ? <p role="status" className="text-sm text-utama">{pesanSukses}</p> : null}
      {gagalMemuat ? (
        <p role="alert" className="rounded-xl border border-garis p-4 text-sm text-bahaya">
          Daftar produk gagal dimuat. Periksa koneksi dan izin akun, lalu muat ulang halaman.
        </p>
      ) : daftarProduk.length === 0 ? (
        <p className="rounded-xl border border-garis p-6 text-center text-teks-lembut">
          Belum ada produk. Pilih "Tambah produk" untuk mengisi katalog.
        </p>
      ) : (
        <TabelProduk daftarProduk={daftarProduk} />
      )}
    </div>
  );
}
