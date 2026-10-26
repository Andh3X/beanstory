import { requireAdmin } from "@/lib/supabase/admin";
import { simpanBanner } from "@/app/admin/toko-actions";
import FormPengaturan from "@/components/FormPengaturan";
import NavAdmin from "@/components/NavAdmin";
export default async function Banner() {
  const db=await requireAdmin(); const {data,error}=await db.from("banner").select("*").eq("id",1).maybeSingle();
  return <div className="flex flex-col gap-6 py-8"><NavAdmin /><h1 className="text-2xl font-extrabold">Banner promo</h1>{error ? <p role="alert" className="text-bahaya">Banner gagal dimuat. Periksa migrasi dan koneksi.</p> : <FormPengaturan action={simpanBanner} awal={{judul:data?.judul||"",teks:data?.teks||"",gambar:data?.gambar||"",tautan:data?.tautan||"",aktif:String(data?.aktif??false)}} kolom={[{name:"judul",label:"Judul promo",maxLength:150,required:true},{name:"teks",label:"Teks promo",textarea:true,maxLength:1000},{name:"gambar",label:"Link gambar (opsional)",maxLength:2048},{name:"tautan",label:"Link tujuan (opsional)",maxLength:2048},{name:"aktif",label:"Status"}]} />}</div>;
}
