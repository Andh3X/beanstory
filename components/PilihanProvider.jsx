"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { bacaPilihan, kosong, KUNCI_PILIHAN, tambahPilihan, muatPilihan, simpanPilihan, kunciItem } from "@/lib/pilihan";
import { toko as tokoCadangan } from "@/lib/toko";

const Context = createContext(null);
export function usePilihan() { return useContext(Context); }
export function useToko() { return useContext(Context)?.toko || tokoCadangan; }
export default function PilihanProvider({ children, toko = tokoCadangan }) {
  const [data, setData] = useState(kosong);
  const [siap, setSiap] = useState(false);
  const [pesan, setPesan] = useState("");
  const [penyimpanan, setPenyimpanan] = useState("");
  const current = useRef(data);
  useEffect(() => {
    const awal = muatPilihan(); current.current = awal.data; setData(awal.data);
    if (!awal.tersedia) setPenyimpanan("Penyimpanan browser tidak tersedia. Pilihan hanya bertahan selama halaman ini terbuka.");
    setSiap(true);
    function sinkron(event) {
      if (event.key === KUNCI_PILIHAN || event.key === null) {
        const baru = bacaPilihan(event.newValue); current.current = baru; setData(baru);
      }
    }
    window.addEventListener("storage", sinkron);
    return () => window.removeEventListener("storage", sinkron);
  }, []);
  function simpan(baru) {
    current.current = baru; setData(baru);
    if (!simpanPilihan(baru)) setPenyimpanan("Pilihan belum tersimpan di browser. Jangan tutup halaman jika masih diperlukan.");
  }
  function tambah(tipe, id, jumlah, varianId = null) {
    if (!siap) return;
    const hasil = tambahPilihan(current.current, tipe, id, jumlah, varianId);
    if (hasil.data) simpan(hasil.data);
    if (hasil.error || hasil.pesan) setPesan(hasil.error || hasil.pesan);
  }
  function hapus(tipe, id, varianId = null) {
    if (!siap) return;
    simpan({ ...current.current, [tipe]: current.current[tipe].filter((item) => tipe === "keranjang" ? kunciItem(item)!==kunciItem({id,varian_id:varianId}) : String(item)!==String(id)) });
  }
  function jumlah(id, value, varianId = null) {
    const n = Number(value);
    if (!/^\d+$/.test(String(value)) || !Number.isInteger(n) || n < 1 || n > 99) { setPesan("Jumlah harus bilangan bulat antara 1 dan 99."); return; }
    simpan({ ...current.current, keranjang: current.current.keranjang.map((item) => kunciItem(item)===kunciItem({id,varian_id:varianId}) ? { ...item, jumlah: n } : item) });
  }
  return <Context.Provider value={{ data, siap, tambah, hapus, jumlah, toko }}>
    {children}
    {penyimpanan || pesan ? <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-garis bg-permukaan p-4 text-sm shadow-lg" aria-live="polite"><p>{penyimpanan} {pesan}</p><button type="button" onClick={() => { setPesan(""); setPenyimpanan(""); }} className="mt-2 text-utama underline">Tutup pemberitahuan</button></aside> : null}
  </Context.Provider>;
}
