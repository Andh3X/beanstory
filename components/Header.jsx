import Link from "next/link";
import Tema from "@/components/Tema";

export default function Header({toko}) {
  return (
    <header className="border-b border-garis bg-latar">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-utama">
          {toko.nama}
        </Link>
        <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
          <Link href="/keranjang" className="hover:text-utama">Keranjang</Link><Link href="/favorit" className="hover:text-utama">Favorit</Link><Link href="/bandingkan" className="hover:text-utama">Bandingkan</Link><Link href="/tentang" className="hover:text-utama">Tentang</Link><Tema />
        </nav>
      </div>
    </header>
  );
}
