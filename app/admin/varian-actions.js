"use server";
import{requireAdmin}from"@/lib/supabase/admin";
import{idProdukValid}from"@/lib/produk";
import{teksForm}from"@/lib/pengaturan";
import{revalidatePath}from"next/cache";
export async function simpanVarian(produkId,varianId,_state,formData){
 const db=await requireAdmin();if(!idProdukValid(produkId)||(varianId!==null&&!idProdukValid(varianId)))return{error:"ID produk atau varian tidak valid."};
 const nama=teksForm(formData,"nama"),teksHarga=teksForm(formData,"harga"),harga=Number(teksHarga),fieldErrors={};
 if(!nama||nama.length>100)fieldErrors.nama="Nama varian wajib diisi, maksimal 100 karakter.";
 if(!/^\d+$/.test(teksHarga)||!Number.isInteger(harga)||harga<1||harga>2147483647)fieldErrors.harga="Harga varian harus bulat antara 1 dan 2.147.483.647.";
 if(Object.keys(fieldErrors).length)return{error:"Periksa isian varian.",fieldErrors};
 try{
  const produk=await db.from("produk").select("id").eq("id",produkId).maybeSingle();if(produk.error||!produk.data)return{error:"Produk tidak ditemukan atau tidak dapat dibaca."};
  const tabel=db.from("varian");const query=varianId===null?tabel.insert({produk_id:produkId,nama,harga}):tabel.update({nama,harga}).eq("id",varianId).eq("produk_id",produkId);
  const{data,error}=await query.select("id").maybeSingle();if(error||!data)return{error:"Varian gagal disimpan. Nama harus unik pada produk ini dan varian harus masih tersedia."};
 }catch{return{error:"Varian gagal disimpan. Coba lagi."};}
 revalidatePath("/","layout");return{success:"Varian berhasil disimpan."};
}
export async function hapusVarian(produkId,varianId,_state,_formData){
 const db=await requireAdmin();if(!idProdukValid(produkId)||!idProdukValid(varianId))return{error:"ID varian tidak valid."};
 try{const{data,error}=await db.from("varian").delete().eq("produk_id",produkId).eq("id",varianId).select("id").maybeSingle();if(error||!data)return{error:"Varian tidak ditemukan atau gagal dihapus."};}catch{return{error:"Varian gagal dihapus."};}
 revalidatePath("/","layout");return{success:"Varian berhasil dihapus."};
}
