import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import Tombol from "@/components/Tombol";
import { ubahProduk } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/supabase/admin";
import { idProdukValid } from "@/lib/produk";
import { ambilKategori } from "@/lib/katalog";

export default async function HalamanUbahProduk({ params }) {
  const supabase = await requireAdmin();
  const { id } = await params;
  if (!idProdukValid(id)) {
    notFound();
  }

  let produk;
  let kategori = [];
  let gagalMemuat = false;
  try {
    kategori = await ambilKategori(supabase);
    const { data, error } = await supabase.from("produk").select("*").eq("id", id).maybeSingle();
    produk = data;
    gagalMemuat = Boolean(error);
  } catch {
    gagalMemuat = true;
  }

  if (!gagalMemuat && !produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      {gagalMemuat ? (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-sm text-bahaya">
            Produk gagal dimuat. Periksa koneksi dan izin akun, lalu coba lagi.
          </p>
          <Tombol href="/admin" varian="garis">Kembali ke daftar produk</Tombol>
        </div>
      ) : (
        <FormProduk key={produk.id} action={ubahProduk.bind(null, id)} produk={produk} kategori={kategori} labelTombol="Simpan perubahan"
          fiturLanjutan={["foto_tambahan", "stok", "harga_diskon", "badge"].every((kolom) => Object.hasOwn(produk, kolom))} />
      )}
    </div>
  );
}
