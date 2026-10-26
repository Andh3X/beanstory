"use client";

import { useId, useState } from "react";
import { toko } from "@/lib/toko";
import { batasJumlah, buatPesanWhatsApp } from "@/lib/pemesanan";
import Input from "@/components/Input";
import { formatRupiah } from "@/lib/format";
import { hargaBerlaku, produkHabis } from "@/lib/produk";

export default function TombolWhatsApp({ produk }) {
  const [jumlah, setJumlah] = useState("1");
  const errorId = useId();
  if (produkHabis(produk)) return <p className="rounded-lg bg-permukaan p-4 font-semibold text-bahaya">Stok habis. Produk ini belum dapat dipesan.</p>;
  const pesan = buatPesanWhatsApp(produk, jumlah);
  const kelasTombol = "inline-flex w-full items-center justify-center rounded-lg bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap sm:w-auto";

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="w-36">
        <Input label="Jumlah" name="jumlah" type="number" min="1" max={batasJumlah(produk)} step="1" value={jumlah}
          onChange={(event) => setJumlah(event.target.value)} aria-invalid={!pesan} aria-describedby={!pesan ? errorId : undefined} />
      </div>
      {pesan ? <p className="text-sm text-teks-lembut">Total: {formatRupiah(hargaBerlaku(produk) * Number(jumlah))}</p>
        : <p id={errorId} role="alert" className="text-sm text-bahaya">Jumlah harus berupa bilangan bulat antara 1 dan {batasJumlah(produk)}.</p>}
      {pesan ? <a href={`https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(pesan)}`} target="_blank" rel="noopener noreferrer" className={kelasTombol}>Pesan via WhatsApp</a>
        : <button type="button" disabled className={`${kelasTombol} cursor-not-allowed opacity-60`}>Pesan via WhatsApp</button>}
    </div>
  );
}
