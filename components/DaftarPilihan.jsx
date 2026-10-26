"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePilihan, useToko } from "@/components/PilihanProvider";
import { hitungKeranjang, pesanKeranjang, kunciItem } from "@/lib/pilihan";
import { formatRupiah } from "@/lib/format";
import { hargaBerlaku } from "@/lib/produk";

import { catatKlik } from "@/lib/klik-whatsapp";
import Tombol from "@/components/Tombol";

export default function DaftarPilihan({ tipe, ringkas = false }) {
  const { data, siap, hapus, jumlah } = usePilihan();
  const tokoCadangan=useToko();
  const [tokoTerbaru,setTokoTerbaru]=useState(null);
  const toko=tokoTerbaru||tokoCadangan;
  const [hasil, setHasil] = useState({ produk: [], loading: true, error: "" });
  const [ulang, setUlang] = useState(0);
  const ids = tipe === "keranjang" ? [...new Set(data.keranjang.map((item) => item.id))] : data[tipe];
  const kunci = JSON.stringify(ids);
  useEffect(() => {
    if (!siap) return;
    let batal = false;
    const controller = new AbortController();
    if (!ids.length) { setHasil({ produk: [], loading: false, error: "" }); return; }
    setHasil({ produk: [], loading: true, error: "" });
    fetch("/api/produk/seleksi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }), cache: "no-store", signal: controller.signal })
      .then(async (res) => { if (!res.ok) throw new Error(); const body = await res.json(); if (!Array.isArray(body.produk)) throw new Error(); if(!batal&&body.toko)setTokoTerbaru(body.toko); return body.produk; })
      .then((produk) => { if (!batal) setHasil({ produk, loading: false, error: "" }); })
      .catch(() => { if (!batal) setHasil({ produk: [], loading: false, error: "Data produk terbaru gagal dimuat. Coba muat ulang." }); });
    return () => { batal = true; controller.abort(); };
  }, [siap, kunci, ulang]);
  useEffect(() => {
    const refresh = () => setUlang((v) => v + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  if (ringkas && (!siap || !ids.length)) return null;
  const keranjang = hitungKeranjang(data.keranjang, hasil.produk);
  const pesan = !hasil.loading && !hasil.error ? pesanKeranjang(keranjang) : null;
  return <section className="flex flex-col gap-4 py-6" aria-label={tipe}>
    {ringkas ? <h2 className="text-xl font-bold">Terakhir dilihat</h2> : null}
    {!siap || hasil.loading ? <p role="status">Memuat pilihan dan data produk terbaru...</p> : hasil.error ? <p role="alert" className="text-bahaya">{hasil.error}</p> : !ids.length ? <p>Belum ada produk di {tipe === "banding" ? "perbandingan" : tipe}.</p> : <>
      {(tipe==="keranjang"?data.keranjang:ids.map((id)=>({id}))).map((item) => {
        const {id,varian_id}=item;
        const p = hasil.produk.find((p) => String(p.id) === id);
        const row = tipe === "keranjang" ? keranjang.baris.find((row) => kunciItem(row)===kunciItem(item)) : null;
        return <article key={kunciItem(item)} className="flex flex-wrap items-center gap-4 rounded-xl border border-garis p-4">
          {p ? <><div className="min-w-0 flex-1"><Link href={`/produk/${id}`} className="font-bold text-utama underline">{p.nama}</Link><p>{formatRupiah(row?.harga ?? hargaBerlaku(p))}</p>{row?.namaVarian?<p className="text-sm">Varian: {row.namaVarian}</p>:null}{p.stok !== null ? <p className="text-sm text-teks-lembut">Stok: {p.stok}</p> : null}</div></> : <p className="flex-1 text-bahaya">Produk #{id} tidak tersedia atau sudah nonaktif.</p>}
          {row ? <div className="flex flex-col gap-2"><label className="text-sm">Jumlah<input aria-label={`Jumlah ${p?.nama || id}`} type="number" min="1" max="99" step="1" value={row.jumlah} onChange={(event) => jumlah(id, event.target.value,varian_id)} className="ml-2 w-20 rounded border border-garis bg-latar p-2" /></label>{!row.valid ? <p className="text-sm text-bahaya">Tidak dapat dipesan. Periksa jumlah, stok, dan varian di detail produk, atau hapus item.</p> : <p>{formatRupiah(row.subtotal)}</p>}</div> : null}
          <Tombol type="button" varian="garis" onClick={() => hapus(tipe, id,varian_id)}>Hapus</Tombol>
        </article>;
      })}
      {tipe === "keranjang" ? <><p className="text-xl font-bold">Total: {formatRupiah(keranjang.total)}</p><p className="text-sm text-teks-lembut">Harga dan stok diperiksa saat halaman dimuat. Ketersediaan akhir dikonfirmasi toko melalui WhatsApp.</p>
        {pesan ? <a href={`https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(pesan)}`} target="_blank" rel="noopener noreferrer" onClick={() => catatKlik(ids)} className="self-start rounded-lg bg-tombol px-5 py-3 font-semibold text-white hover:bg-utama-gelap">Pesan semua via WhatsApp</a> : <button disabled className="self-start rounded-lg bg-tombol px-5 py-3 text-white opacity-50">Pesan semua via WhatsApp</button>}
      </> : null}
      {tipe === "banding" && ids.length === 2 ? <Tombol href={`/bandingkan?ids=${ids.join(",")}`}>Lihat perbandingan</Tombol> : null}
    </>}
    {!ringkas ? <Tombol type="button" varian="garis" onClick={() => setUlang((v) => v + 1)}>Muat ulang data produk</Tombol> : null}
  </section>;
}
