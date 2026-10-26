"use client";
import { useActionState, useState } from "react";
import { kirimUlasan } from "@/app/produk/ulasan-actions";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
export default function FormUlasan({ id }) {
  const [nilai, setNilai] = useState({ nama: "", rating: "5", komentar: "", website: "" });
  const [state, action, pending] = useActionState(async (lama, data) => {
    const hasil = await kirimUlasan(id, lama, data);
    if (hasil.success) setNilai({ nama: "", rating: "5", komentar: "", website: "" });
    return hasil;
  }, {});
  const ganti = (event) => setNilai((v) => ({ ...v, [event.target.name]: event.target.value }));
  return <form action={action} className="flex max-w-xl flex-col gap-3">
    <h3 className="font-bold">Tulis ulasan</h3><p className="text-sm text-teks-lembut">Ulasan valid langsung tampil. Nama dan komentar akan terlihat publik.</p>
    {state.error ? <p role="alert" className="text-bahaya">{state.error}</p> : null}{state.success ? <p role="status" className="text-utama">{state.success}</p> : null}
    <fieldset disabled={pending} className="flex flex-col gap-3">
      <Input label="Nama" name="nama" minLength={2} maxLength={80} required value={nilai.nama} onChange={ganti} error={state.fieldErrors?.nama} />
      <label className="flex flex-col gap-2 text-sm font-semibold">Rating<select name="rating" value={nilai.rating} onChange={ganti} aria-invalid={Boolean(state.fieldErrors?.rating)} aria-describedby={state.fieldErrors?.rating ? "rating-error" : undefined} className="rounded-lg border border-garis bg-latar p-3 text-teks">{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} dari 5</option>)}</select>{state.fieldErrors?.rating ? <span id="rating-error" className="text-bahaya">{state.fieldErrors.rating}</span> : null}</label>
      <Input label="Komentar" textarea name="komentar" minLength={5} maxLength={1000} required value={nilai.komentar} onChange={ganti} error={state.fieldErrors?.komentar} />
      <div className="hidden" aria-hidden="true"><label>Biarkan kosong<input name="website" tabIndex={-1} autoComplete="off" value={nilai.website} onChange={ganti} /></label></div>
      <Tombol type="submit" disabled={pending}>{pending ? "Mengirim..." : "Kirim ulasan"}</Tombol>
    </fieldset>
  </form>;
}
