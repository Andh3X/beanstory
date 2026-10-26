import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { toko } from "@/lib/toko";
import { createServerClient } from "@/lib/supabase/server";
import { ambilHalamanKatalog, ambilKategori, linkKatalog, opsiKatalog } from "@/lib/katalog";
import DaftarPilihan from "@/components/DaftarPilihan";
import { Suspense } from "react";
import Skeleton from "@/components/Skeleton";

export const dynamic = "force-dynamic";

export default function HalamanKatalog(props) {
  return <Suspense fallback={<Skeleton />}><IsiKatalog {...props} /></Suspense>;
}

async function IsiKatalog({ searchParams }) {
  const opsi = opsiKatalog(await searchParams);
  let hasil = { daftarProduk: [], total: 0, halaman: 1, jumlahHalaman: 1 };
  let kategori = [];
  let pesanError = null;

  try {
    const supabase = createServerClient();
    [hasil, kategori] = await Promise.all([ambilHalamanKatalog(supabase, opsi), ambilKategori(supabase)]);
  } catch {
    pesanError = "Katalog belum dapat dimuat. Periksa koneksi lalu coba lagi.";
  }

  const kelasSelect = "w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks";

  return (
    <>
      <section className="py-10 sm:py-14">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {toko.nama}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-teks-lembut">{toko.tagline}</p>
        <p className="mt-4 text-sm text-teks-lembut">{toko.jamBuka}</p>
      </section>

      <section aria-labelledby="judul-produk" className="flex flex-col gap-5 pb-8">
        <h2 id="judul-produk" className="text-xl font-bold">
          Produk kami
        </h2>

        <form key={JSON.stringify(opsi)} action="/" method="get" className="grid items-end gap-3 rounded-xl border border-garis bg-permukaan p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Cari produk" name="cari" defaultValue={opsi.cari} placeholder="Nama produk..." maxLength={100} />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Kategori
            <select name="kategori" defaultValue={opsi.kategori} className={kelasSelect}>
              <option value="">Semua kategori</option>
              {opsi.kategori && !kategori.includes(opsi.kategori) ? <option value={opsi.kategori}>{opsi.kategori}</option> : null}
              {kategori.map((nama) => <option key={nama} value={nama}>{nama}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Urutkan
            <select name="urutan" defaultValue={opsi.urutan} className={kelasSelect}>
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
              <option value="termahal">Termahal</option>
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Tombol type="submit">Tampilkan</Tombol>
            <Link href="/" className="text-sm underline underline-offset-4">Reset</Link>
          </div>
        </form>

        {pesanError ? (
          <div role="alert" className="rounded-xl border border-bahaya/20 bg-permukaan p-4 text-sm text-bahaya">
            <p className="font-semibold">Gagal memuat produk</p>
            <p className="mt-1 text-teks-lembut">{pesanError}</p>
          </div>
        ) : hasil.daftarProduk.length === 0 ? (
          <p className="py-8 text-center text-teks-lembut">
            {opsi.cari || opsi.kategori ? "Tidak ada produk yang sesuai. Coba kata kunci atau kategori lain." : "Belum ada produk"}
          </p>
        ) : (
          <>
            <p className="text-sm text-teks-lembut">{hasil.total} produk ditemukan</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {hasil.daftarProduk.map((produk) => <KartuProduk key={produk.id} produk={produk} />)}
            </div>
            <nav aria-label="Halaman katalog" className="flex flex-wrap items-center justify-center gap-4 pt-3">
              {hasil.halaman > 1 ? <Tombol href={linkKatalog(opsi, hasil.halaman - 1)} varian="garis">Sebelumnya</Tombol> : null}
              <span className="text-sm text-teks-lembut">Halaman {hasil.halaman} dari {hasil.jumlahHalaman}</span>
              {hasil.halaman < hasil.jumlahHalaman ? <Tombol href={linkKatalog(opsi, hasil.halaman + 1)} varian="garis">Berikutnya</Tombol> : null}
            </nav>
          </>
        )}
      </section>
      <DaftarPilihan tipe="riwayat" ringkas />
    </>
  );
}
