"use client";

import { useActionState, useRef, useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { buatDeskripsiAI } from "@/app/admin/ai-actions";

export default function FormProduk({ action, produk = {}, kategori = [], labelTombol, fiturLanjutan = false }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [state, formAction, pending] = useActionState(async (sebelumnya, data) => {
    if (file) {
      // Cegah payload besar mencapai batas framework; server memeriksa ulang.
      if (file.size > 3 * 1024 * 1024 || file.size === 0 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        const error = "Pilih JPEG, PNG, atau WebP berukuran maksimal 3 MB.";
        return { error, fieldErrors: { foto_file: error } };
      }
      data.set("foto_file", file);
    }
    return action(sebelumnya, data);
  }, { error: null });
  const errors = state.fieldErrors || {};
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
    aktif: produk.aktif === false ? "false" : "true",
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
        <Input error={errors.nama} label="Nama produk" name="nama" value={nilai.nama} onChange={gantiNilai} required />
        <Input
          label="Harga (Rp)"
          name="harga"
          error={errors.harga}
          type="number"
          min="1"
          max="2147483647"
          step="1"
          value={nilai.harga}
          onChange={gantiNilai}
          required
        />
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Kategori
          <select name="kategori" value={nilai.kategori} onChange={gantiNilai} aria-invalid={Boolean(errors.kategori)} aria-describedby={errors.kategori ? "kategori-error" : undefined} className="rounded-lg border border-garis bg-latar p-3 text-teks">
            <option value="">Tanpa kategori</option>{kategori.map((nama) => <option key={nama}>{nama}</option>)}
          </select>
          {errors.kategori ? <span id="kategori-error" className="text-bahaya">{errors.kategori}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Status
          <select name="aktif" value={nilai.aktif} onChange={gantiNilai} aria-invalid={Boolean(errors.aktif)} aria-describedby={errors.aktif ? "aktif-error" : undefined} className="rounded-lg border border-garis bg-latar p-3 text-teks"><option value="true">Aktif</option><option value="false">Nonaktif</option></select>
          {errors.aktif ? <span id="aktif-error" className="text-bahaya">{errors.aktif}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Upload foto utama (JPEG, PNG, WebP; maksimal 3 MB)
          <input ref={fileRef} name="foto_file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} aria-invalid={Boolean(errors.foto_file)} aria-describedby="foto_file-info" className="max-w-full rounded-lg border border-garis p-3" />
          <span id="foto_file-info" className={errors.foto_file ? "text-bahaya" : "font-normal text-teks-lembut"}>{errors.foto_file || (file ? `Dipilih: ${file.name}. File ini menggantikan link foto saat disimpan.` : "Upload menggantikan link foto utama jika keduanya diisi.")}</span>
          {file ? <button type="button" className="self-start text-utama underline" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>Batalkan file</button> : null}
        </label>
        <Input
          label="Link foto"
          name="foto_url"
          error={errors.foto_url}
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
            <Input error={errors.foto_tambahan} label="Link foto tambahan (satu per baris, maksimal 9)" name="foto_tambahan" textarea value={nilai.foto_tambahan} onChange={gantiNilai} />
            <Input error={errors.stok} label="Stok (kosongkan jika tidak dibatasi)" name="stok" type="number" min="0" max="2147483647" step="1" value={nilai.stok} onChange={gantiNilai} />
            <p className="text-xs text-teks-lembut">Isi 0 untuk menandai produk habis dan menonaktifkan pemesanan.</p>
            <Input error={errors.harga_diskon} label="Harga diskon (Rp, boleh kosong)" name="harga_diskon" type="number" min="0" max="2147483647" step="1" value={nilai.harga_diskon} onChange={gantiNilai} />
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Label produk
              <select name="badge" value={nilai.badge} onChange={gantiNilai} aria-invalid={Boolean(errors.badge)} aria-describedby={errors.badge ? "badge-error" : undefined} className="rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks">
                <option value="">Tanpa label</option><option value="Baru">Baru</option><option value="Terlaris">Terlaris</option>
              </select>
              {errors.badge ? <span id="badge-error" className="text-bahaya">{errors.badge}</span> : null}
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
