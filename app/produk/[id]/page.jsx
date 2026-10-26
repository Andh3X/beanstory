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

export default async function HalamanDetailProduk({ params }) {
  const { id } = await params;
  if (!idProdukValid(id)) notFound();
  const supabase = createServerClient();
  const { data: produk, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Produk belum dapat dimuat. Silakan coba lagi.");
  }

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
        <p className="text-sm text-teks-lembut">{produk.kategori}</p>
        <LabelProduk produk={produk} />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{produk.nama}</h1>
        <HargaProduk produk={produk} besar />
        {Number.isInteger(produk.stok) && produk.stok > 0 ? <p className="text-sm text-teks-lembut">Stok tersedia: {produk.stok}</p> : null}
        <p className="max-w-prose leading-relaxed text-teks-lembut">{produk.deskripsi}</p>
        <TombolWhatsApp key={produk.id} produk={produk} />
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
    </>
  );
}
