import"server-only";
import{cache}from"react";
import{createServerClient}from"@/lib/supabase/server";
export const daftarKategoriPublik=cache(async()=>{
 const hasil=[];for(let awal=0;;awal+=1000){const{data,error}=await createServerClient().from("kategori").select("nama,slug").order("nama").range(awal,awal+999);if(error)throw new Error("Kategori gagal dimuat.");hasil.push(...(data||[]));if(!data||data.length<1000)break;}return hasil;
});
export const ambilKategoriSlug=cache(async(slug)=>{
 if(typeof slug!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>200)return null;
 const{data,error}=await createServerClient().from("kategori").select("nama,slug").eq("slug",slug).maybeSingle();if(error)throw new Error("Kategori gagal dimuat.");return data;
});
export async function linkKategori(nama){
 if(!nama)return null;
 try{const daftar=await daftarKategoriPublik();const kategori=daftar.find((k)=>k.nama===nama);if(kategori?.slug)return `/kategori/${kategori.slug}`;}catch{}
 return `/?kategori=${encodeURIComponent(nama)}`;
}
