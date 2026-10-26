import{hargaBerlaku}from"@/lib/produk";
import{formatRupiah}from"@/lib/format";
export function faktaProduk(produk){
 const fakta={nama:`Nama produk: ${String(produk.nama).slice(0,200)}.`,harga:`Harga dasar yang berlaku: ${formatRupiah(hargaBerlaku(produk))}.`,stok:produk.stok===0?"Stok produk habis.":Number.isInteger(produk.stok)?`Stok tersedia: ${produk.stok}.`:"Jumlah stok belum dicantumkan. Hubungi toko untuk memastikan ketersediaan."};
 if(produk.kategori)fakta.kategori=`Kategori: ${String(produk.kategori).slice(0,100)}.`;
 if(produk.deskripsi?.trim())fakta.deskripsi=`Deskripsi produk: ${produk.deskripsi.trim().slice(0,2000)}`;
 if(produk.varian?.length)fakta.varian=`Pilihan varian: ${produk.varian.slice(0,30).map((v)=>`${String(v.nama).slice(0,100)} (${formatRupiah(v.harga)})`).join(", ")}. Harga varian menggantikan harga dasar.`;
 return fakta;
}
export function susunJawaban(teks,fakta){
 const hasil=JSON.parse(teks);
 if(typeof hasil?.tidak_tersedia!=="boolean"||!Array.isArray(hasil.fakta)||hasil.fakta.length>4||hasil.fakta.some((key)=>typeof key!=="string"||!Object.hasOwn(fakta,key)))throw new Error("Jawaban AI tidak valid");
 if(hasil.tidak_tersedia||!hasil.fakta.length)return"Informasi tersebut belum tersedia pada data produk. Hubungi toko melalui WhatsApp untuk memastikan.";
 // Hanya isi database yang dirangkai; teks/fakta baru dari model tidak diteruskan.
 return [...new Set(hasil.fakta)].map((key)=>fakta[key]).join("\n\n").slice(0,3500);
}
