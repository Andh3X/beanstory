"use client";
import {useActionState,useState} from "react";
import {tambahAdmin} from "@/app/admin/akun-actions";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
export default function FormAdminBaru(){
  const[email,setEmail]=useState(""),[password,setPassword]=useState("");
  const[state,action,pending]=useActionState(async(lama,form)=>{const hasil=await tambahAdmin(lama,form);if(hasil.success)setPassword("");return hasil;},{});
  return <form action={action} className="flex max-w-xl flex-col gap-3"><h2 className="text-lg font-bold">Tambah admin</h2>{state.error?<p role="alert" className="text-bahaya">{state.error}</p>:null}{state.success?<p role="status" className="text-utama">{state.success}</p>:null}<fieldset disabled={pending} className="flex flex-col gap-3"><Input label="Email admin baru" name="email" type="email" maxLength={254} value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="off"/><Input label="Password awal (minimal 8 karakter)" name="password" type="password" minLength={8} maxLength={128} value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="new-password"/><Tombol type="submit" disabled={pending}>{pending?"Membuat akun...":"Tambah admin"}</Tombol></fieldset></form>;
}
