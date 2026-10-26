import DaftarPilihan from "@/components/DaftarPilihan";
export const metadata = { title: "Favorit", robots: { index: false } };
export default function Favorit() { return <div className="py-8"><h1 className="text-2xl font-extrabold">Favorit</h1><DaftarPilihan tipe="favorit" /></div>; }
