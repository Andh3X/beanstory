import { createServerClient } from "@/lib/supabase/server";
import { halamanValid } from "@/lib/admin-data";
import FormUlasan from "@/components/FormUlasan";
import Link from "next/link";
export default async function UlasanProduk({ id, halaman: permintaan }) {
  let daftar = [], jumlah = 0, rata = 0, halaman = 1, jumlahHalaman = 1, gagal = false;
  try {
    const supabase = createServerClient();
    // US-39: SQL ringkasan_ulasan (docs/migrations/002-us21-us40.sql)
    // memakai WHERE p.aktif AND u.terlihat, sehingga count/avg tidak menghitung
    // ulasan tersembunyi. Daftar di bawah memakai filter terlihat yang sama.
    const ringkasan = await supabase.rpc("ringkasan_ulasan", { p_produk_id: String(id) });
    if (ringkasan.error || !ringkasan.data?.[0]) throw new Error();
    jumlah = Number(ringkasan.data[0].jumlah); rata = Number(ringkasan.data[0].rata_rata);
    jumlahHalaman = Math.max(1, Math.ceil(jumlah / 20)); halaman = Math.min(halamanValid(permintaan), jumlahHalaman);
    const { data, error } = await supabase.from("ulasan").select("id,nama,rating,komentar,created_at").eq("produk_id", id).eq("terlihat", true).order("created_at", { ascending: false }).order("id", { ascending: false }).range((halaman - 1) * 20, halaman * 20 - 1);
    if (error) throw new Error();
    daftar = data || [];
  } catch { gagal = true; }
  return <section className="flex flex-col gap-5 border-t border-garis py-8" id="ulasan"><h2 className="text-xl font-bold">Ulasan produk</h2>
    {gagal ? <p role="alert" className="text-bahaya">Ulasan belum dapat dimuat.</p> : <><p>{jumlah ? `${rata.toFixed(1)} / 5 dari ${jumlah} ulasan` : "Belum ada ulasan."}</p>{daftar.map((u) => <article key={u.id} className="rounded-xl border border-garis p-4 [overflow-wrap:anywhere]"><h3 className="font-semibold">{u.nama} · {u.rating}/5</h3><p className="mt-2 whitespace-pre-wrap">{u.komentar}</p><time className="mt-2 block text-xs text-teks-lembut" dateTime={u.created_at}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(u.created_at))}</time></article>)}<nav aria-label="Halaman ulasan" className="flex gap-4 text-sm">{halaman > 1 ? <Link href={`?ulasan=${halaman - 1}#ulasan`} className="text-utama underline">Sebelumnya</Link> : null}<span>{halaman} / {jumlahHalaman}</span>{halaman < jumlahHalaman ? <Link href={`?ulasan=${halaman + 1}#ulasan`} className="text-utama underline">Berikutnya</Link> : null}</nav></>}
    <FormUlasan id={String(id)} />
  </section>;
}
