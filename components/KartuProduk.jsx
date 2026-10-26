import Link from "next/link";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import { fotoProduk } from "@/lib/produk";

export default function KartuProduk({ produk }) {
  return (
    <Link
      href={`/produk/${produk.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-garis bg-latar"
    >
      {fotoProduk(produk)[0] ? <img
        src={fotoProduk(produk)[0]}
        alt={produk.nama}
        className="aspect-square w-full bg-permukaan object-cover"
      /> : <div className="flex aspect-square items-center justify-center bg-permukaan p-3 text-center text-sm text-teks-lembut">Foto belum tersedia</div>}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-xs text-teks-lembut">{produk.kategori}</p>
        <LabelProduk produk={produk} />
        <h3 className="font-semibold leading-snug group-hover:text-utama">{produk.nama}</h3>
        <HargaProduk produk={produk} />
      </div>
    </Link>
  );
}
