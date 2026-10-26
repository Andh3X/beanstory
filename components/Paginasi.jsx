import Link from "next/link";
export default function Paginasi({ halaman, jumlahHalaman, path, params = {} }) {
  const href = (nomor) => `${path}?${new URLSearchParams({ ...params, halaman: String(nomor) })}`;
  return <nav aria-label="Halaman daftar" className="flex flex-wrap items-center gap-4 text-sm">
    {halaman > 1 ? <Link href={href(halaman - 1)} className="text-utama underline">Sebelumnya</Link> : null}
    <span>Halaman {halaman} dari {jumlahHalaman}</span>
    {halaman < jumlahHalaman ? <Link href={href(halaman + 1)} className="text-utama underline">Berikutnya</Link> : null}
  </nav>;
}
