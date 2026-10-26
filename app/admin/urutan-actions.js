"use server";
import{requireAdmin}from"@/lib/supabase/admin";
import{idProdukValid}from"@/lib/produk";
import{revalidatePath}from"next/cache";
export async function geserProduk(id,arah,_state,_formData){
 const db=await requireAdmin();if(!idProdukValid(id)||![1,-1].includes(arah))return{error:"Arah atau ID produk tidak valid."};
 try{const{data,error}=await db.rpc("geser_produk",{p_id:String(id),p_arah:arah});if(error)return{error:"Urutan gagal diperbarui. Periksa keberadaan produk dan izin akun."};if(data!==true)return{success:"Produk sudah berada di batas urutan."};}catch{return{error:"Urutan gagal diperbarui. Coba lagi."};}
 revalidatePath("/","layout");return{success:"Urutan tampil diperbarui."};
}
