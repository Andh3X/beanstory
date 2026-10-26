import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import FormHapusProduk from "@/components/FormHapusProduk";
import FormAksi from "@/components/FormAksi";
import { ubahStatusProduk } from "@/app/admin/kelola-actions";

export default function TabelProduk({ daftarProduk }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-garis">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-permukaan text-teks-lembut">
          <tr>
            <th className="px-4 py-3 font-semibold">Produk</th>
            <th className="px-4 py-3 font-semibold">Kategori</th>
            <th className="px-4 py-3 font-semibold">Harga</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {daftarProduk.map((produk) => (
            <tr key={produk.id} className="border-t border-garis">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {produk.foto_url ? <img src={produk.foto_url} alt="" className="h-10 w-10 rounded-md object-cover" /> : null}
                  <span className="font-semibold">{produk.nama}</span>
                  <span className="text-xs text-teks-lembut">{produk.aktif ? "Aktif" : "Nonaktif"}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-teks-lembut">{produk.kategori}</td>
              <td className="px-4 py-3">{formatRupiah(produk.harga)}</td>
              <td className="px-4 py-3">
                <div className="flex items-start justify-end gap-2">
                  <Tombol href={`/admin/produk/${produk.id}/ubah`} varian="garis">
                    Ubah
                  </Tombol>
                  <FormHapusProduk id={produk.id} nama={produk.nama} />
                  <FormAksi action={ubahStatusProduk.bind(null, produk.id, !produk.aktif)} label={produk.aktif ? "Nonaktifkan" : "Aktifkan"} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
