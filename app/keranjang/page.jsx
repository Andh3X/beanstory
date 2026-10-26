import DaftarPilihan from "@/components/DaftarPilihan";
export const metadata = { title: "Keranjang", robots: { index: false } };
export default function Keranjang() { return <div className="py-8"><h1 className="text-2xl font-extrabold">Keranjang</h1><DaftarPilihan tipe="keranjang" /></div>; }
