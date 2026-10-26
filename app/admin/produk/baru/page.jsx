import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProduk } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/supabase/admin";
import { ambilKategori } from "@/lib/katalog";

export default async function HalamanTambahProduk() {
  const supabase = await requireAdmin();
  const kategori = await ambilKategori(supabase);
  let fiturLanjutan = false;
  try {
    const { error } = await supabase.from("produk").select("foto_tambahan,stok,harga_diskon,badge").limit(1);
    fiturLanjutan = !error;
  } catch {
    // Form dasar tetap tersedia jika kolom bonus belum diaktifkan.
  }
  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>
      <FormProduk action={tambahProduk} kategori={kategori} labelTombol="Simpan produk" fiturLanjutan={fiturLanjutan} />
    </div>
  );
}
