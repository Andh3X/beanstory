import { notFound } from "next/navigation";
import { daftarId } from "@/lib/pilihan";
import { ambilProdukPublik } from "@/lib/produk-server";
import DaftarPilihan from "@/components/DaftarPilihan";
import HargaProduk from "@/components/HargaProduk";
import Tombol from "@/components/Tombol";
export const dynamic = "force-dynamic";
export const metadata = { title: "Bandingkan produk", robots: { index: false } };
export default async function Bandingkan({ searchParams }) {
  const { ids } = await searchParams;
  if (ids === undefined) return <div className="py-8"><h1 className="text-2xl font-extrabold">Bandingkan produk</h1><p className="mt-4">Pilih dua produk dari halaman detail.</p><DaftarPilihan tipe="banding" /></div>;
  const valid = daftarId(typeof ids === "string" ? ids.split(",") : null, 2);
  if (!valid || valid.length !== 2) notFound();
  const produk = await Promise.all(valid.map(ambilProdukPublik));
  if (produk.some((p) => !p)) notFound();
  return <div className="flex flex-col gap-6 py-8"><h1 className="text-2xl font-extrabold">Perbandingan produk</h1><div className="grid grid-cols-2 gap-3">{produk.map((p) => <article key={p.id} className="min-w-0 rounded-xl border border-garis p-3 [overflow-wrap:anywhere]">{p.foto_url ? <img src={p.foto_url} alt={p.nama} className="mb-3 aspect-square w-full rounded-lg object-cover" /> : null}<h2 className="font-bold">{p.nama}</h2><div className="my-3"><HargaProduk produk={p} /></div><p className="text-sm">Kategori: {p.kategori || "Tanpa kategori"}</p><p className="my-3 text-sm">{p.deskripsi || "Belum ada deskripsi."}</p><p className="mb-3 text-sm">Stok: {p.stok ?? "Hubungi toko"}</p><Tombol href={`/produk/${p.id}`} varian="garis">Lihat produk</Tombol></article>)}</div><DaftarPilihan tipe="banding" /></div>;
}
