import { ambilProdukTerlaris } from "@/lib/admin-data";

export default async function ProdukTerlaris({ db }) {
  let data = [], error = false;
  try { data = await ambilProdukTerlaris(db); }
  catch { error = true; }
  return (
    <section aria-label="Produk terlaris" className="flex flex-col gap-3 rounded-xl border border-garis p-4">
      <h2 className="text-lg font-bold">5 produk dengan klik WhatsApp terbanyak</h2>
      <p className="text-sm text-teks-lembut">Jumlah klik merupakan minat pemesanan, bukan jumlah transaksi selesai.</p>
      {error ? <p role="alert" className="text-bahaya">Data terlaris gagal dimuat.</p>
        : !data.length ? <p>Belum ada klik pesan WhatsApp.</p>
          : <ol className="flex flex-col gap-2">{data.slice(0, 5).map((p) => (
            <li key={p.produk_id} className="flex flex-wrap justify-between gap-2"><span>{p.nama}</span><strong>{p.jumlah} klik</strong></li>
          ))}</ol>}
    </section>
  );
}
