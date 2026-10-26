"use client";
import { useEffect, useState } from "react";
import { usePilihan } from "@/components/PilihanProvider";
import Tombol from "@/components/Tombol";

export default function AksiPengunjung({ id, nama }) {
  const { data, siap, tambah } = usePilihan();
  const [pesan, setPesan] = useState("");
  useEffect(() => { if (siap) tambah("riwayat", id); }, [siap, id]); // Hanya saat produk dibuka.
  async function bagikan() {
    const url = `${window.location.origin}/produk/${id}`;
    setPesan("");
    if (navigator.share) {
      try { await navigator.share({ title: nama, url }); setPesan("Tautan dibagikan."); return; }
      catch (error) { if (error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); setPesan("Link tersalin"); }
    catch { setPesan("Tautan gagal disalin. Salin alamat halaman dari bilah alamat browser."); }
  }
  return <div className="flex flex-col gap-2"><div className="flex flex-wrap gap-2">
    <Tombol type="button" varian="garis" disabled={!siap} aria-pressed={data.favorit.includes(String(id))} onClick={() => tambah("favorit", id)}>{data.favorit.includes(String(id)) ? "Hapus favorit" : "Simpan favorit"}</Tombol>
    <Tombol type="button" varian="garis" disabled={!siap} aria-pressed={data.banding.includes(String(id))} onClick={() => tambah("banding", id)}>{data.banding.includes(String(id)) ? "Batal bandingkan" : "Bandingkan"}</Tombol>
    <Tombol type="button" varian="garis" onClick={bagikan}>Bagikan</Tombol>
  </div><p role="status" className="text-sm text-teks-lembut">{pesan}</p></div>;
}
