"use client";
import { useActionState, useId, useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
export default function FormPengaturan({ action, awal, kolom, label = "Simpan perubahan" }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [nilai,setNilai] = useState(awal);
  const prefix=useId();
  return <form action={formAction} className="flex max-w-xl flex-col gap-4">
    {state.error ? <p role="alert" className="text-bahaya">{state.error}</p> : null}{state.success ? <p role="status" className="text-utama">{state.success}</p> : null}
    <fieldset disabled={pending} className="flex flex-col gap-4">{kolom.map(({name,label,textarea,maxLength,required,type,min,step}) => name === "aktif" ? <label key={name} className="flex flex-col gap-2 text-sm font-semibold">Status<select name="aktif" value={nilai.aktif} onChange={(e)=>setNilai({...nilai,aktif:e.target.value})} className="rounded-lg border border-garis bg-latar p-3"><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label> : <Input key={name} id={`${prefix}-${name}`} {...{name,label,textarea,maxLength,required,type,min,step}} value={nilai[name] ?? ""} onChange={(e)=>setNilai({...nilai,[name]:e.target.value})} error={state.fieldErrors?.[name]} />)}<Tombol type="submit" disabled={pending}>{pending ? "Menyimpan..." : label}</Tombol></fieldset>
  </form>;
}
