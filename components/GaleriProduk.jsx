"use client";

import { useState } from "react";

export default function GaleriProduk({ foto, nama }) {
  const [pilihan, setPilihan] = useState(0);
  if (!foto.length) return <div className="flex aspect-square items-center justify-center rounded-2xl border border-garis bg-permukaan text-teks-lembut">Foto belum tersedia</div>;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <img src={foto[pilihan] || foto[0]} alt={`${nama}, foto ${pilihan + 1}`} className="aspect-square w-full rounded-2xl border border-garis bg-permukaan object-cover" />
      {foto.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-1" aria-label="Pilihan foto produk">
          {foto.map((url, index) => (
            <button key={url} type="button" aria-label={`Tampilkan foto ${index + 1} ${nama}`} aria-pressed={pilihan === index}
              onClick={() => setPilihan(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${pilihan === index ? "border-utama" : "border-garis"}`}>
              <img src={url} alt="" className="h-full w-full bg-permukaan object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
