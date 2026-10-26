"use server";
import {requireAdmin} from "@/lib/supabase/admin";
import {ambilKategori} from "@/lib/katalog";
import {validasiImpor} from "@/lib/impor-csv";
import {revalidatePath} from "next/cache";
export async function imporProduk(_state,formData){
  const db=await requireAdmin();const file=formData?.get?.("csv");
  if(!file||typeof file.text!=="function"||!/\.csv$/i.test(file.name)||file.size<1||file.size>1024*1024)return {error:"Pilih file .csv UTF-8, maksimal 1 MB dan 500 baris produk."};
  let hasil;
  try{hasil=validasiImpor(await file.text(),await ambilKategori(db));}catch(error){return {error:error?.message?.startsWith("Kategori")?"Kategori gagal dimuat. Coba lagi.":error.message||"CSV tidak dapat dibaca."};}
  let berhasil=0;
  if(hasil.valid.length){
    try{const{data,error}=await db.from("produk").insert(hasil.valid.map((r)=>r.data)).select("id");if(error||data?.length!==hasil.valid.length)throw new Error();berhasil=data.length;}
    catch{hasil.gagal.push(...hasil.valid.map((r)=>({baris:r.baris,pesan:"Batch gagal disimpan. Periksa koneksi dan izin akun; tidak ada keberhasilan yang dapat dikonfirmasi."})));}
  }
  if(berhasil)revalidatePath("/","layout");
  return {success:berhasil?`${berhasil} produk berhasil diimpor.`:undefined,error:!berhasil?"Tidak ada produk yang berhasil diimpor.":undefined,berhasil,gagal:hasil.gagal.sort((a,b)=>a.baris-b.baris)};
}
