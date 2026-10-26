"use client";

import { useId, useState } from "react";
import { batasJumlah, buatPesanWhatsApp } from "@/lib/pemesanan";
import Input from "@/components/Input";
import { formatRupiah } from "@/lib/format";
import { hargaPesanan, produkHabis } from "@/lib/produk";
import { usePilihan, useToko } from "@/components/PilihanProvider";
import { catatKlik } from "@/lib/klik-whatsapp";
import Tombol from "@/components/Tombol";

export default function TombolWhatsApp({ produk }) {
  const [jumlah, setJumlah] = useState("1");
  const [varianId,setVarianId]=useState("");
  const toko=useToko();
  const errorId = useId();
  const { siap, tambah } = usePilihan();
  if (produkHabis(produk)) return <p className="rounded-lg bg-permukaan p-4 font-semibold text-bahaya">Stok habis. Produk ini belum dapat dipesan.</p>;
  const pesan = buatPesanWhatsApp(produk, jumlah, varianId || null);
  const pilihan=hargaPesanan(produk,varianId||null);
  const kelasTombol = "inline-flex w-full items-center justify-center rounded-lg bg-tombol px-5 py-3 font-semibold text-white hover:bg-utama-gelap sm:w-auto";

  return (
    <div className="flex flex-col items-start gap-3">
      {produk.varian?.length ? <label className="flex w-full flex-col gap-2 text-sm font-semibold">Ukuran / varian<select value={varianId} onChange={(e)=>setVarianId(e.target.value)} className="rounded-lg border border-garis bg-latar p-3 text-teks"><option value="">Pilih varian</option>{produk.varian.map((v)=><option key={v.id} value={v.id}>{v.nama} — {formatRupiah(v.harga)}</option>)}</select><span className="text-xs font-normal text-teks-lembut">Harga varian menjadi harga pesanan; diskon harga dasar tidak ditambahkan pada varian.</span></label> : null}
      <div className="w-36">
        <Input label="Jumlah" name="jumlah" type="number" min="1" max={batasJumlah(produk)} step="1" value={jumlah}
          onChange={(event) => setJumlah(event.target.value)} aria-invalid={!pesan} aria-describedby={!pesan ? errorId : undefined} />
      </div>
      {pesan ? <p className="text-sm text-teks-lembut">Harga pilihan: {formatRupiah(pilihan.harga)} · Total: {formatRupiah(pilihan.harga * Number(jumlah))}</p>
        : <p id={errorId} role="alert" className="text-sm text-bahaya">{!pilihan ? "Pilih varian yang tersedia." : `Jumlah harus berupa bilangan bulat antara 1 dan ${batasJumlah(produk)}.`}</p>}
      <Tombol type="button" varian="garis" disabled={!siap || !pesan} onClick={() => tambah("keranjang", produk.id, Number(jumlah), varianId||null)}>Tambah ke keranjang</Tombol>
      {pesan ? <a href={`https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(pesan)}`} target="_blank" rel="noopener noreferrer" onClick={() => catatKlik([produk.id])} className={kelasTombol}>Pesan via WhatsApp</a>
        : <button type="button" disabled className={`${kelasTombol} cursor-not-allowed opacity-60`}>Pesan via WhatsApp</button>}
    </div>
  );
}
