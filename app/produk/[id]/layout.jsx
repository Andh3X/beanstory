import { notFound } from "next/navigation";
import { ambilProdukPublik } from "@/lib/produk-server";

// Di luar batas loading detail: pastikan 404 sebelum respons mulai streaming.
export default async function LayoutProduk({ children, params }) {
  const { id } = await params;
  if (!await ambilProdukPublik(id)) notFound();
  return children;
}
