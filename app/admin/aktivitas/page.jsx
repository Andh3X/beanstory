import {requireAdmin} from "@/lib/supabase/admin";
import NavAdmin from "@/components/NavAdmin";
export default async function Aktivitas(){
  const db=await requireAdmin();const{data,error}=await db.from("log_admin").select("id,admin_id,pelaku,aksi,produk_id,nama_produk,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(50);
  return <div className="flex flex-col gap-6 py-8"><NavAdmin/><h1 className="text-2xl font-extrabold">50 aktivitas produk terakhir</h1>{error?<p role="alert" className="text-bahaya">Log aktivitas gagal dimuat.</p>:!data?.length?<p>Belum ada aktivitas produk.</p>:<ol aria-label="Log aktivitas" className="flex flex-col gap-3">{data.map((log)=><li key={log.id} className="rounded-xl border border-garis p-4 break-words"><p><strong>{log.pelaku}</strong> · {log.aksi} · {log.nama_produk} (#{log.produk_id})</p><time dateTime={log.created_at} className="text-sm text-teks-lembut">{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(log.created_at))}</time></li>)}</ol>}</div>;
}
