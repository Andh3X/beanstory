-- Pemeriksaan BACA SAJA di Supabase SQL Editor, sesudah migrasi 002 dan 003.
-- Tidak mengubah data, kebijakan, atau pengguna. Jalankan seluruh query.

-- US-41: definisi terpasang harus berisi count(*) dari klik_whatsapp,
-- GROUP BY produk, ORDER BY jumlah menurun/ID menaik, dan LIMIT 5.
select pg_get_functiondef('public.produk_terlaris()'::regprocedure)
  as definisi_produk_terlaris;

-- Harus true, termasuk jika klik kosong. Membandingkan seluruh ID/hitungan.
with expected as (
  select p.id as produk_id, p.nama, count(*) as jumlah
  from public.klik_whatsapp k join public.produk p on p.id = k.produk_id
  group by p.id, p.nama order by count(*) desc, p.id limit 5
), actual as (
  select * from public.produk_terlaris()
)
select not exists (
  (select * from expected except select * from actual)
  union all
  (select * from actual except select * from expected)
) as terlaris_sesuai;

-- US-39: pastikan definisi yang TERPASANG memfilter ulasan terlihat dan produk aktif.
select pg_get_functiondef('public.ringkasan_ulasan(bigint)'::regprocedure)
  as definisi_ringkasan_ulasan;

-- Bandingkan hasil RPC dengan seluruh ulasan terlihat, bukan hanya halaman pertama.
-- Setiap baris harus sesuai = true; NULL rata-rata saat kosong dinormalkan menjadi 0.
select p.id as produk_id, r.jumlah, r.rata_rata,
  (r.jumlah = b.jumlah and r.rata_rata = b.rata_rata) as sesuai
from public.produk p
cross join lateral public.ringkasan_ulasan(p.id) r
cross join lateral (
  select count(*) as jumlah, coalesce(avg(u.rating), 0) as rata_rata
  from public.ulasan u
  where u.produk_id = p.id and u.terlihat and p.aktif
) b
order by p.id;

-- US-45: harus ada trigger catat_perubahan_produk, aktif = O (origin/normal)
-- atau A (always), dengan AFTER INSERT OR DELETE OR UPDATE FOR EACH ROW.
select t.tgname, t.tgenabled as aktif, pg_get_triggerdef(t.oid) as definisi
from pg_trigger t
where t.tgrelid = 'public.produk'::regclass and not t.tgisinternal
  and t.tgname = 'catat_perubahan_produk';

select pg_get_functiondef('public.log_perubahan_produk()'::regprocedure)
  as definisi_pencatatan_log;

-- Setelah CRUD produk UJI melalui akun admin di aplikasi, lihat siapa/aksi/kapan.
-- Tidak perlu menampilkan/mengirim alamat email admin ke pihak lain.
select id, admin_id, aksi, produk_id, nama_produk, created_at
from public.log_admin
order by created_at desc, id desc
limit 50;
