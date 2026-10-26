import { formatRupiah } from "@/lib/format";
import { hargaBerlaku } from "@/lib/produk";

export default function HargaProduk({ produk, besar = false }) {
  const harga = hargaBerlaku(produk);
  return (
    <div className="mt-auto flex flex-wrap items-center gap-2">
      {harga < produk.harga ? <del className="text-sm text-teks-lembut"><span className="sr-only">Harga normal </span>{formatRupiah(produk.harga)}</del> : null}
      <span className={`rounded-md bg-harga-latar px-2 py-1 font-bold text-harga ${besar ? "text-xl" : "text-sm"}`}>
        {harga < produk.harga ? <span className="sr-only">Harga diskon </span> : null}{formatRupiah(harga)}
      </span>
    </div>
  );
}
