"use client";

import { useActionState, useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { buatDeskripsiAI } from "@/app/admin/ai-actions";

export default function FormProduk({ action, produk = {}, labelTombol, fiturLanjutan = false }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [membuatAI, setMembuatAI] = useState(false);
  const [pesanAI, setPesanAI] = useState(null);
  const [nilai, setNilai] = useState({
    nama: produk.nama ?? "",
    harga: String(produk.harga ?? ""),
    kategori: produk.kategori ?? "",
    foto_url: produk.foto_url ?? "",
    deskripsi: produk.deskripsi ?? "",
    foto_tambahan: Array.isArray(produk.foto_tambahan) ? produk.foto_tambahan.join("\n") : "",
    stok: String(produk.stok ?? ""),
    harga_diskon: String(produk.harga_diskon ?? ""),
    badge: produk.badge ?? "",
  });

  function gantiNilai(event) {
    const { name, value } = event.target;
    setNilai((sebelumnya) => ({ ...sebelumnya, [name]: value }));
  }

  async function buatDeskripsi() {
    setMembuatAI(true);
    setPesanAI(null);
    try {
      const hasil = await buatDeskripsiAI({ nama: nilai.nama, kategori: nilai.kategori });
      if (hasil.error) setPesanAI({ error: true, teks: hasil.error });
      else {
        setNilai((sebelumnya) => ({ ...sebelumnya, deskripsi: hasil.deskripsi }));
        setPesanAI({ teks: "Draf deskripsi sudah diisi. Periksa dan sesuaikan sebelum menyimpan produk." });
      }
    } catch {
      setPesanAI({ error: true, teks: "Deskripsi AI gagal dibuat. Periksa sesi login dan koneksi, lalu coba lagi." });
    } finally {
      setMembuatAI(false);
    }
  }

  return (
    <form action={formAction} aria-busy={pending || membuatAI} className="flex max-w-xl flex-col gap-4">
      {state.error ? <p role="alert" className="text-sm text-bahaya">{state.error}</p> : null}
      <fieldset disabled={pending || membuatAI} className="flex min-w-0 flex-col gap-4">
        <Input label="Nama produk" name="nama" value={nilai.nama} onChange={gantiNilai} required />
        <Input
          label="Harga (Rp)"
          name="harga"
          type="number"
          min="0"
          max="2147483647"
          step="1"
          value={nilai.harga}
          onChange={gantiNilai}
          required
        />
        <Input label="Kategori" name="kategori" value={nilai.kategori} onChange={gantiNilai} />
        <Input
          label="Link foto"
          name="foto_url"
          placeholder="https://... atau /produk/nama-file.svg"
          value={nilai.foto_url}
          onChange={gantiNilai}
        />
        <Input label="Deskripsi" name="deskripsi" textarea value={nilai.deskripsi} onChange={gantiNilai} />
        <div className="flex flex-col items-start gap-2">
          <Tombol type="button" varian="garis" onClick={buatDeskripsi} disabled={pending || membuatAI || !nilai.nama.trim() || !nilai.kategori.trim()} className="disabled:cursor-not-allowed disabled:opacity-60">
            {membuatAI ? "Membuat deskripsi..." : "Buat deskripsi dengan AI"}
          </Tombol>
          <p className="text-xs font-normal text-teks-lembut">Isi nama dan kategori terlebih dahulu. Hasil AI dapat diedit sebelum disimpan.</p>
          {pesanAI ? <p role={pesanAI.error ? "alert" : "status"} className={`text-sm ${pesanAI.error ? "text-bahaya" : "text-utama"}`}>{pesanAI.teks}</p> : null}
        </div>
        {fiturLanjutan ? (
          <fieldset className="flex min-w-0 flex-col gap-4 rounded-xl border border-garis p-4">
            <legend className="px-2 font-semibold">Galeri, stok, dan promo</legend>
            <Input label="Link foto tambahan (satu per baris, maksimal 9)" name="foto_tambahan" textarea value={nilai.foto_tambahan} onChange={gantiNilai} />
            <Input label="Stok (kosongkan jika tidak dibatasi)" name="stok" type="number" min="0" max="2147483647" step="1" value={nilai.stok} onChange={gantiNilai} />
            <p className="text-xs text-teks-lembut">Isi 0 untuk menandai produk habis dan menonaktifkan pemesanan.</p>
            <Input label="Harga diskon (Rp, boleh kosong)" name="harga_diskon" type="number" min="0" max="2147483647" step="1" value={nilai.harga_diskon} onChange={gantiNilai} />
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Label produk
              <select name="badge" value={nilai.badge} onChange={gantiNilai} className="rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks">
                <option value="">Tanpa label</option><option value="Baru">Baru</option><option value="Terlaris">Terlaris</option>
              </select>
            </label>
          </fieldset>
        ) : null}
        <div className="flex gap-3">
          <Tombol type="submit" disabled={pending} className="disabled:cursor-wait disabled:opacity-60">
            {pending ? "Menyimpan..." : labelTombol}
          </Tombol>
          <Tombol href="/admin" varian="garis">
            Batal
          </Tombol>
        </div>
      </fieldset>
    </form>
  );
}
