import {ambilBanner} from "@/lib/toko-server";
import {linkAman} from "@/lib/pengaturan";
export default async function BannerPromo(){
  const banner=await ambilBanner();if(!banner)return null;
  return <section aria-label="Promo toko" className="mb-8 flex flex-col gap-4 rounded-2xl border border-garis bg-permukaan p-5 [overflow-wrap:anywhere]">{banner.gambar&&linkAman(banner.gambar)?<img src={banner.gambar} alt={banner.judul} className="max-h-64 w-full rounded-xl object-cover"/>:null}<h2 className="text-2xl font-extrabold">{banner.judul}</h2><p className="whitespace-pre-wrap">{banner.teks}</p>{banner.tautan&&linkAman(banner.tautan)?<a href={banner.tautan} className="self-start text-utama underline">Lihat promo</a>:null}</section>;
}
