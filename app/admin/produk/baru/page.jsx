import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProduk } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/supabase/admin";

export default async function HalamanTambahProduk() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>
      <FormProduk action={tambahProduk} labelTombol="Simpan produk" />
    </div>
  );
}
