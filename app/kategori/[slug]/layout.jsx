import{notFound}from"next/navigation";
import{ambilKategoriSlug}from"@/lib/kategori-server";
export default async function LayoutKategori({params,children}){const{slug}=await params;if(!await ambilKategoriSlug(slug))notFound();return children;}
