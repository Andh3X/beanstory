import { produkHabis } from "@/lib/produk";

export default function LabelProduk({ produk }) {
  const badge = ["Baru", "Terlaris"].includes(produk.badge) ? produk.badge : null;
  if (!badge && !produkHabis(produk)) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs font-semibold">
      {badge ? <span className="rounded bg-permukaan px-2 py-1 text-utama">{badge}</span> : null}
      {produkHabis(produk) ? <span className="rounded bg-permukaan px-2 py-1 text-bahaya">Habis</span> : null}
    </div>
  );
}
