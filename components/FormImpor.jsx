"use client";
import{useActionState,useState}from"react";
import{imporProduk}from"@/app/admin/impor-actions";
import Tombol from"@/components/Tombol";
export default function FormImpor(){
 const[file,setFile]=useState(null);const[state,action,pending]=useActionState(async(lama,data)=>{if(file?.size>1024*1024)return{error:"File maksimal 1 MB."};if(file)data.set("csv",file);const hasil=await imporProduk(lama,data);if(hasil.berhasil)setFile(null);return hasil;},{});
 return <form action={action} className="flex max-w-2xl flex-col gap-4"><label className="flex flex-col gap-2 font-semibold">File CSV UTF-8<input name="csv" type="file" accept=".csv,text/csv" onChange={(e)=>setFile(e.target.files?.[0]||null)} disabled={pending} required={!file} className="max-w-full rounded border border-garis p-3"/></label>{file?<p className="text-sm">Dipilih: {file.name}</p>:null}<Tombol type="submit" disabled={pending||!file}>{pending?"Mengimpor...":"Impor produk"}</Tombol>{state.error?<p role="alert" className="text-bahaya">{state.error}</p>:null}{state.success?<p role="status" className="text-utama">{state.success}</p>:null}{state.gagal?<><p>{state.berhasil||0} berhasil · {state.gagal.length} gagal</p><ul className="flex flex-col gap-2 text-sm text-bahaya">{state.gagal.map((r)=><li key={r.baris}>Baris {r.baris}: {r.pesan}</li>)}</ul></>:null}</form>;
}
