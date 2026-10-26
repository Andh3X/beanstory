import { requireAdmin } from "@/lib/supabase/admin";
import { ambilToko } from "@/lib/toko-server";
import { simpanToko } from "@/app/admin/toko-actions";
import FormPengaturan from "@/components/FormPengaturan";
import NavAdmin from "@/components/NavAdmin";
export default async function Pengaturan() {
  await requireAdmin(); const toko = await ambilToko();
  return <div className="flex flex-col gap-6 py-8"><NavAdmin /><h1 className="text-2xl font-extrabold">Pengaturan toko</h1><FormPengaturan action={simpanToko} awal={{nama:toko.nama,tagline:toko.tagline,nomor_whatsapp:toko.nomorWhatsApp,alamat:toko.alamat,jam_buka:toko.jamBuka}} kolom={[{name:"nama",label:"Nama toko",maxLength:100,required:true},{name:"tagline",label:"Tagline",maxLength:300},{name:"nomor_whatsapp",label:"Nomor WhatsApp internasional (628…)",maxLength:30,required:true},{name:"alamat",label:"Alamat",maxLength:500,required:true,textarea:true},{name:"jam_buka",label:"Jam buka",maxLength:200,required:true}]} /></div>;
}
