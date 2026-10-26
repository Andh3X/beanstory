"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { bacaPilihan, kosong, KUNCI_PILIHAN, tambahPilihan, muatPilihan, simpanPilihan } from "@/lib/pilihan";

const Context = createContext(null);
export function usePilihan() { return useContext(Context); }
export default function PilihanProvider({ children }) {
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
  function tambah(tipe, id, jumlah) {
    if (!siap) return;
    const hasil = tambahPilihan(current.current, tipe, id, jumlah);
    if (hasil.data) simpan(hasil.data);
    if (hasil.error || hasil.pesan) setPesan(hasil.error || hasil.pesan);
  }
  function hapus(tipe, id) {
    if (!siap) return;
    simpan({ ...current.current, [tipe]: current.current[tipe].filter((item) => String(tipe === "keranjang" ? item.id : item) !== String(id)) });
  }
  function jumlah(id, value) {
    const n = Number(value);
    if (!/^\d+$/.test(String(value)) || !Number.isInteger(n) || n < 1 || n > 99) { setPesan("Jumlah harus bilangan bulat antara 1 dan 99."); return; }
    simpan({ ...current.current, keranjang: current.current.keranjang.map((item) => item.id === String(id) ? { ...item, jumlah: n } : item) });
  }
  return <Context.Provider value={{ data, siap, tambah, hapus, jumlah }}>
    {children}
    {penyimpanan || pesan ? <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-garis bg-permukaan p-4 text-sm shadow-lg" aria-live="polite"><p>{penyimpanan} {pesan}</p><button type="button" onClick={() => { setPesan(""); setPenyimpanan(""); }} className="mt-2 text-utama underline">Tutup pemberitahuan</button></aside> : null}
  </Context.Provider>;
}
