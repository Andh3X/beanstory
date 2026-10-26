import{notFound}from"next/navigation";
import{requireAdmin}from"@/lib/supabase/admin";
import{idProdukValid}from"@/lib/produk";
import{simpanVarian,hapusVarian}from"@/app/admin/varian-actions";
import NavAdmin from"@/components/NavAdmin";
import FormPengaturan from"@/components/FormPengaturan";
import FormAksi from"@/components/FormAksi";
const kolom=[{name:"nama",label:"Nama ukuran / varian",required:true,maxLength:100},{name:"harga",label:"Harga varian (Rp)",type:"number",min:1,step:1,required:true}];
export default async function Varian({params}){
 const db=await requireAdmin();const{id}=await params;if(!idProdukValid(id))notFound();
 const produk=await db.from("produk").select("id,nama").eq("id",id).maybeSingle();if(produk.error)throw new Error("Produk gagal dimuat.");if(!produk.data)notFound();
 const{data,error}=await db.from("varian").select("id,nama,harga").eq("produk_id",id).order("id");
 return <div className="flex flex-col gap-6 py-8"><NavAdmin/><h1 className="text-2xl font-extrabold">Varian: {produk.data.nama}</h1><p>Harga varian menggantikan harga dasar pada pesanan. Stok produk dipakai bersama untuk semua varian.</p><section className="rounded-xl border border-garis p-4"><h2 className="mb-4 text-lg font-bold">Tambah varian</h2><FormPengaturan action={simpanVarian.bind(null,id,null)} awal={{nama:"",harga:""}} kolom={kolom} label="Tambah varian"/></section>{error?<p role="alert" className="text-bahaya">Varian gagal dimuat.</p>:!data?.length?<p>Belum ada varian. Produk ini memakai harga dasarnya.</p>:data.map((v)=><section key={v.id} className="flex flex-col gap-4 rounded-xl border border-garis p-4"><h2 className="font-bold">{v.nama}</h2><FormPengaturan action={simpanVarian.bind(null,id,String(v.id))} awal={{nama:v.nama,harga:String(v.harga)}} kolom={kolom} label="Simpan varian"/><FormAksi action={hapusVarian.bind(null,id,String(v.id))} label="Hapus varian" konfirmasi={`Hapus varian “${v.nama}”? Pilihan ini tidak lagi dapat dipesan dari keranjang lama.`} bahaya/></section>)}</div>;
}
