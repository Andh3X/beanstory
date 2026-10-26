"use server";
import{idProdukValid}from"@/lib/produk";
import{ambilProdukPublik}from"@/lib/produk-server";
import{ambilKuotaAI,jawabPertanyaan}from"@/lib/asisten-server";
export async function tanyaProduk(id,_state,formData){
 const raw=formData?.get?.("pertanyaan"),pertanyaan=typeof raw==="string"?raw.trim():"";
 if(!idProdukValid(id)||pertanyaan.length<3||pertanyaan.length>500||formData?.get?.("website"))return{error:"Isi pertanyaan tentang produk sepanjang 3–500 karakter."};
 try{
  const produk=await ambilProdukPublik(String(id));if(!produk)return{error:"Produk tidak tersedia."};
  if(!process.env.GEMINI_API_KEY)return{error:"Asisten AI belum dikonfigurasi. Hubungi toko melalui WhatsApp."};
  if(!await ambilKuotaAI())return{error:"Batas kiriman AI tercapai. Tunggu satu menit sebelum mencoba lagi."};
  return await jawabPertanyaan(produk,pertanyaan);
 }catch{return{error:"Asisten AI belum dapat dihubungi. Coba lagi atau hubungi toko."};}
}
