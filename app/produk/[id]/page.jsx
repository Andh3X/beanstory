import Link from "next/link";
import { notFound } from "next/navigation";
import TombolWhatsApp from "@/components/TombolWhatsApp";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import GaleriProduk from "@/components/GaleriProduk";
import KartuProduk from "@/components/KartuProduk";
import { fotoProduk, idProdukValid } from "@/lib/produk";
import { ambilProdukTerkait } from "@/lib/katalog";
import { createServerClient } from "@/lib/supabase/server";
import { ambilProdukPublik } from "@/lib/produk-server";
import { absolut } from "@/lib/site";
import { ambilToko } from "@/lib/toko-server";
import AksiPengunjung from "@/components/AksiPengunjung";
import UlasanProduk from "@/components/UlasanProduk";
import { linkKategori } from "@/lib/kategori-server";
import AsistenProduk from "@/components/AsistenProduk";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const toko=await ambilToko();
  const { id } = await params;
  const produk = await ambilProdukPublik(id);
  if (!produk) notFound();
  const description = (produk.deskripsi || `${produk.nama} tersedia di ${toko.nama}.`).slice(0, 160);
  const url = absolut(`/produk/${produk.id}`);
  return { title: `${produk.nama} | ${toko.nama}`, description, alternates: { canonical: url }, openGraph: { title: produk.nama, description, url, type: "website", images: produk.foto_url ? [{ url: absolut(produk.foto_url), alt: produk.nama }] : [] } };
}

export default async function HalamanDetailProduk({ params, searchParams }) {
  const { id } = await params;
  if (!idProdukValid(id)) notFound();
  const supabase = createServerClient();
  const produk = await ambilProdukPublik(id);
  const pencarian = (await searchParams) || {};
  const kategoriHref=produk ? await linkKategori(produk.kategori) : null;

  if (!produk) {
    notFound();
  }

  let produkTerkait = [];
  let gagalTerkait = false;
  try {
    produkTerkait = await ambilProdukTerkait(supabase, produk);
  } catch {
    gagalTerkait = true;
  }

  return (
    <>
    <article className="grid items-start gap-8 py-8 md:grid-cols-2 md:py-12">
      <GaleriProduk key={produk.id} foto={fotoProduk(produk)} nama={produk.nama} />
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama">
          Kembali ke katalog
        </Link>
        {kategoriHref ? <Link href={kategoriHref} className="text-sm text-utama underline">{produk.kategori}</Link> : null}
        <LabelProduk produk={produk} />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{produk.nama}</h1>
        {produk.varian?.length ? <p className="text-sm text-teks-lembut">Harga dasar · pilih ukuran untuk melihat harga varian</p> : null}
        <HargaProduk produk={produk} besar />
        {Number.isInteger(produk.stok) && produk.stok > 0 ? <p className="text-sm text-teks-lembut">Stok tersedia: {produk.stok}</p> : null}
        <p className="max-w-prose leading-relaxed text-teks-lembut">{produk.deskripsi}</p>
        <TombolWhatsApp key={produk.id} produk={produk} />
        <AksiPengunjung key={`aksi-${produk.id}`} id={String(produk.id)} nama={produk.nama} />
      </div>
    </article>
    {produkTerkait.length || gagalTerkait ? (
      <section aria-labelledby="judul-terkait" className="flex flex-col gap-4 pb-8">
        <h2 id="judul-terkait" className="text-xl font-bold">Produk terkait</h2>
        {gagalTerkait ? <p className="text-sm text-teks-lembut">Produk terkait belum dapat dimuat.</p> : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{produkTerkait.map((item) => <KartuProduk key={item.id} produk={item} />)}</div>
        )}
      </section>
    ) : null}
    <UlasanProduk id={produk.id} halaman={pencarian.ulasan} />
    <AsistenProduk key={`asisten-${produk.id}`} id={String(produk.id)} />
    </>
  );
}
