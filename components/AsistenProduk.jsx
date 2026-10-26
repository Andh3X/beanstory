"use client";
import{useActionState,useId,useState}from"react";
import{tanyaProduk}from"@/app/produk/asisten-actions";
import Input from"@/components/Input";
import Tombol from"@/components/Tombol";
export default function AsistenProduk({id}){
 const[state,action,pending]=useActionState(tanyaProduk.bind(null,id),{});const[pertanyaan,setPertanyaan]=useState("");const prefix=useId();
 return <section className="flex flex-col gap-4 border-t border-garis py-8"><h2 className="text-xl font-bold">Tanya tentang produk</h2><p className="text-sm text-teks-lembut">Asisten AI memilih informasi dari data katalog produk ini. Untuk informasi yang belum tercantum, hubungi toko. Maksimal 5 pertanyaan per menit per browser.</p><form action={action} className="flex max-w-xl flex-col gap-3"><fieldset disabled={pending} className="flex flex-col gap-3"><Input id={`${prefix}-pertanyaan`} label="Pertanyaan" name="pertanyaan" textarea minLength={3} maxLength={500} value={pertanyaan} onChange={(e)=>setPertanyaan(e.target.value)} required/><div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" aria-label="Biarkan kosong"/></div><Tombol type="submit" disabled={pending}>{pending?"Mencari jawaban...":"Tanyakan ke asisten"}</Tombol></fieldset></form>{state.error?<p role="alert" className="text-bahaya">{state.error}</p>:null}{state.jawaban?<p role="status" className="max-w-prose whitespace-pre-wrap rounded-xl bg-permukaan p-4 [overflow-wrap:anywhere]">{state.jawaban}</p>:null}</section>;
}
