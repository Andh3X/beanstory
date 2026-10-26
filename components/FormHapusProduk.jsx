"use client";

import { useActionState, useId, useState } from "react";
import { hapusProduk } from "@/app/admin/actions";
import Tombol from "@/components/Tombol";

function KonfirmasiHapus({ id, nama, onBatal }) {
  const [state, formAction, pending] = useActionState(hapusProduk.bind(null, id), { error: null });
  const judulId = useId();

  return (
    <form action={formAction} aria-busy={pending} aria-labelledby={judulId} className="max-w-xs rounded-lg border border-garis bg-permukaan p-3">
      <p id={judulId} className="mb-3 break-words text-sm">Hapus produk "{nama}"? Produk yang dihapus tidak dapat dikembalikan.</p>
      {state.error ? <p role="alert" className="mb-3 text-sm text-bahaya">{state.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Tombol type="button" varian="garis" onClick={onBatal} disabled={pending} autoFocus>Batal</Tombol>
        <Tombol type="submit" varian="bahaya" disabled={pending} className="disabled:cursor-wait disabled:opacity-60">
          {pending ? "Menghapus..." : "Ya, hapus"}
        </Tombol>
      </div>
    </form>
  );
}

export default function FormHapusProduk({ id, nama }) {
  const [konfirmasi, setKonfirmasi] = useState(false);

  return konfirmasi ? (
    <KonfirmasiHapus id={id} nama={nama} onBatal={() => setKonfirmasi(false)} />
  ) : (
    <Tombol type="button" varian="bahaya" aria-label={`Hapus ${nama}`} onClick={() => setKonfirmasi(true)}>
      Hapus
    </Tombol>
  );
}
