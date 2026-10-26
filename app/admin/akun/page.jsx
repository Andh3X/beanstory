import {requireAdmin} from "@/lib/supabase/admin";
import {createServerClient} from "@/lib/supabase/server";
import {kelolaAdmin} from "@/app/admin/akun-actions";
import NavAdmin from "@/components/NavAdmin";
import FormAksi from "@/components/FormAksi";
import FormAdminBaru from "@/components/FormAdminBaru";
export default async function Akun(){
  const db=await requireAdmin();const sesi=await db.auth.getUser();let daftar=[],gagal=false;
  try{
    const registry=[];
    for(let awal=0;;awal+=1000){const{data,error}=await db.from("admin_toko").select("id,aktif").order("id").range(awal,awal+999);if(error)throw new Error();registry.push(...(data||[]));if(!data||data.length<1000)break;}
    const server=createServerClient();
    for(let page=1;;page++){const{data,error}=await server.auth.admin.listUsers({page,perPage:100});if(error)throw new Error();for(const user of data.users){const status=registry.find((r)=>r.id===user.id);if(status)daftar.push({id:user.id,email:user.email,aktif:status.aktif});}if(data.users.length<100)break;}
  }catch{gagal=true;}
  return <div className="flex flex-col gap-6 py-8"><NavAdmin/><h1 className="text-2xl font-extrabold">Akun admin</h1><FormAdminBaru/>{gagal?<p role="alert" className="text-bahaya">Daftar admin gagal dimuat. Periksa migrasi dan izin layanan Auth.</p>:daftar.map((u)=><article key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-garis p-4"><div className="min-w-0 flex-1 break-words"><h2 className="font-bold">{u.email}</h2><p className="text-sm text-teks-lembut">{u.aktif?"Aktif":"Nonaktif"}{u.id===sesi.data?.user?.id?" · Akun Anda":""}</p></div>{u.id!==sesi.data?.user?.id?<><FormAksi action={kelolaAdmin.bind(null,u.id,u.aktif?"nonaktifkan":"aktifkan")} label={u.aktif?"Nonaktifkan":"Aktifkan"}/><FormAksi action={kelolaAdmin.bind(null,u.id,"hapus")} label="Hapus akun" konfirmasi={`Hapus akun admin ${u.email}?`} bahaya/></>:null}</article>)}</div>;
}
