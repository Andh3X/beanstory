"use client";

import { useActionState, useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";

export default function FormProduk({ action, produk = {}, labelTombol }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [nilai, setNilai] = useState({
    nama: produk.nama ?? "",
    harga: String(produk.harga ?? ""),
    kategori: produk.kategori ?? "",
    foto_url: produk.foto_url ?? "",
    deskripsi: produk.deskripsi ?? "",
  });

  function gantiNilai(event) {
    const { name, value } = event.target;
    setNilai((sebelumnya) => ({ ...sebelumnya, [name]: value }));
  }

  return (
    <form action={formAction} aria-busy={pending} className="flex max-w-xl flex-col gap-4">
      {state.error ? <p role="alert" className="text-sm text-bahaya">{state.error}</p> : null}
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
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
