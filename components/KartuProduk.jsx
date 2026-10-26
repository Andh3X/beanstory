import Link from "next/link";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import { fotoProduk } from "@/lib/produk";
import { linkKategori } from "@/lib/kategori-server";

export default async function KartuProduk({ produk }) {
  const kategoriHref=await linkKategori(produk.kategori);
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-garis bg-latar"
    >
      <Link href={`/produk/${produk.id}`} aria-label={`Lihat ${produk.nama}`}>{fotoProduk(produk)[0] ? <img
        src={fotoProduk(produk)[0]}
        alt={produk.nama}
        className="aspect-square w-full bg-permukaan object-cover"
      /> : <div className="flex aspect-square items-center justify-center bg-permukaan p-3 text-center text-sm text-teks-lembut">Foto belum tersedia</div>}</Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {kategoriHref ? <Link href={kategoriHref} className="text-xs text-utama underline">{produk.kategori}</Link> : null}
        <LabelProduk produk={produk} />
        <h3 className="font-semibold leading-snug group-hover:text-utama"><Link href={`/produk/${produk.id}`}>{produk.nama}</Link></h3>
        <HargaProduk produk={produk} />
      </div>
    </article>
  );
}
