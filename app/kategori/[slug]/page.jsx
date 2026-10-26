import{notFound}from"next/navigation";
import{ambilKategoriSlug}from"@/lib/kategori-server";
import{absolut}from"@/lib/site";
import Katalog from"@/components/Katalog";
export async function generateMetadata({params}){const{slug}=await params;const kategori=await ambilKategoriSlug(slug);if(!kategori)notFound();return{title:`Kategori ${kategori.nama}`,alternates:{canonical:absolut(`/kategori/${slug}`)},description:`Lihat produk kategori ${kategori.nama}.`};}
export default async function Kategori({params,searchParams}){const{slug}=await params;const kategori=await ambilKategoriSlug(slug);if(!kategori)notFound();return <Katalog searchParams={searchParams} kategoriTetap={kategori.nama} judul={`Kategori ${kategori.nama}`} path={`/kategori/${slug}`}/>;}
