import { requireAdmin } from "@/lib/supabase/admin";
import { ambilKategori } from "@/lib/katalog";
import { tambahKategori, ubahKategori, hapusKategori } from "@/app/admin/kelola-actions";
import NavAdmin from "@/components/NavAdmin";
import Input from "@/components/Input";
import FormAksi from "@/components/FormAksi";

export default async function Kategori() {
  const supabase = await requireAdmin();
  const daftar = await ambilKategori(supabase);
  return <div className="flex flex-col gap-6 py-8"><NavAdmin /><h1 className="text-2xl font-extrabold">Kategori</h1>
    <FormAksi action={tambahKategori} label="Tambah kategori"><Input label="Nama kategori baru" name="nama" maxLength={100} required /></FormAksi>
    {!daftar.length ? <p>Belum ada kategori.</p> : daftar.map((nama) => <section key={nama} className="flex flex-col gap-4 rounded-xl border border-garis p-4">
      <h2 className="font-bold">{nama}</h2>
      <FormAksi action={ubahKategori.bind(null, nama)} label="Simpan nama"><Input label={`Nama kategori ${nama}`} name="nama" defaultValue={nama} maxLength={100} required /></FormAksi>
      <FormAksi action={hapusKategori.bind(null, nama)} label="Hapus kategori" bahaya konfirmasi={`Hapus kategori “${nama}”? Kategori yang dipakai produk tidak dapat dihapus.`} />
    </section>)}
  </div>;
}
