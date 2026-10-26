"use client";
import { useActionState, useState } from "react";
import Tombol from "@/components/Tombol";
export default function FormAksi({ action, label, konfirmasi, children, bahaya = false }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [terbuka, setTerbuka] = useState(false);
  return <div className="flex flex-col gap-2">
    {konfirmasi && !terbuka ? <Tombol type="button" varian={bahaya ? "bahaya" : "garis"} onClick={() => setTerbuka(true)}>{label}</Tombol> :
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        {konfirmasi ? <p className="w-full text-sm">{konfirmasi}</p> : null}
        <fieldset disabled={pending} className="flex min-w-0 flex-wrap items-end gap-2">{children}<Tombol type="submit" varian={bahaya ? "bahaya" : "garis"}>{pending ? "Memproses..." : konfirmasi ? "Ya, hapus" : label}</Tombol>
          {konfirmasi ? <Tombol type="button" varian="garis" onClick={() => setTerbuka(false)}>Batal</Tombol> : null}
        </fieldset>
      </form>}
    {state.error ? <p role="alert" className="text-sm text-bahaya">{state.error}</p> : null}
    {state.success ? <p role="status" className="text-sm text-utama">{state.success}</p> : null}
  </div>;
}
