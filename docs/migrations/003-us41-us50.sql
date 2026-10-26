-- Jalankan setelah 001 dan 002, sebelum deployment kode US-41–US-50.
begin;

create table if not exists public.admin_toko (
  id uuid primary key references auth.users(id) on delete cascade,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
-- Proyek sebelumnya hanya memiliki akun pemilik/admin; pendaftaran publik tetap dimatikan.
insert into public.admin_toko(id, aktif)
select id, (banned_until is null or banned_until < now()) from auth.users where deleted_at is null
on conflict do nothing;
alter table public.admin_toko enable row level security;
create or replace function public.admin_aktif()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_toko where id = auth.uid() and aktif);
$$;
revoke all on function public.admin_aktif() from public, anon;
grant execute on function public.admin_aktif() to authenticated, service_role;
drop policy if exists admin_toko_baca on public.admin_toko;
create policy admin_toko_baca on public.admin_toko for select to authenticated using (public.admin_aktif());
revoke all on public.admin_toko from public, anon, authenticated;
grant select on public.admin_toko to authenticated;
grant all on public.admin_toko to service_role;

create or replace function public.status_admin(p_id uuid, p_aktif boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(410044);
  if not public.admin_aktif() then raise exception 'Admin tidak aktif'; end if;
  if p_id = auth.uid() then raise exception 'Tidak boleh mengubah status sendiri'; end if;
  update public.admin_toko set aktif = p_aktif where id = p_id;
  return found;
end;
$$;
revoke all on function public.status_admin(uuid,boolean) from public, anon;
grant execute on function public.status_admin(uuid,boolean) to authenticated;

-- Kebijakan restrictive menambahkan syarat admin aktif pada izin lama, tanpa mematikan RLS.
do $$ declare nama text; begin
  foreach nama in array array['produk','kategori','ulasan','klik_whatsapp'] loop
    execute format('drop policy if exists wajib_admin_aktif on public.%I', nama);
    execute format('create policy wajib_admin_aktif on public.%I as restrictive for all to authenticated using (public.admin_aktif()) with check (public.admin_aktif())', nama);
  end loop;
end $$;
drop policy if exists produk_storage_admin_aktif on storage.objects;
create policy produk_storage_admin_aktif on storage.objects as restrictive for all to authenticated
using (bucket_id <> 'produk' or public.admin_aktif()) with check (bucket_id <> 'produk' or public.admin_aktif());

create table if not exists public.pengaturan_toko (
  id integer primary key default 1 check(id = 1),
  nama text not null check(length(btrim(nama)) between 1 and 100),
  tagline text not null check(length(tagline) <= 300),
  nomor_whatsapp text not null check(nomor_whatsapp ~ '^[1-9][0-9]{7,14}$'),
  alamat text not null check(length(btrim(alamat)) between 1 and 500),
  jam_buka text not null check(length(btrim(jam_buka)) between 1 and 200)
);
create table if not exists public.banner (
  id integer primary key default 1 check(id = 1),
  judul text not null check(length(btrim(judul)) between 1 and 150),
  teks text not null default '' check(length(teks) <= 1000),
  gambar text,
  tautan text,
  aktif boolean not null default false
);
create table if not exists public.varian (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk(id) on delete cascade,
  nama text not null check(length(btrim(nama)) between 1 and 100),
  harga integer not null check(harga > 0),
  unique(produk_id, nama)
);
create index if not exists varian_produk_idx on public.varian(produk_id);
create table if not exists public.log_admin (
  id bigint generated always as identity primary key,
  admin_id uuid,
  pelaku text not null,
  aksi text not null check(aksi in ('tambah','ubah','hapus')),
  produk_id bigint not null,
  nama_produk text not null,
  created_at timestamptz not null default now()
);
create index if not exists log_admin_waktu on public.log_admin(created_at desc, id desc);
do $$ declare nama text; begin
  foreach nama in array array['pengaturan_toko','banner','varian'] loop
    execute format('alter table public.%I enable row level security', nama);
    execute format('drop policy if exists kelola_admin_aktif on public.%I', nama);
    execute format('create policy kelola_admin_aktif on public.%I for all to authenticated using (public.admin_aktif()) with check (public.admin_aktif())', nama);
    execute format('revoke all on public.%I from public, anon, authenticated', nama);
    execute format('grant select, insert, update, delete on public.%I to authenticated', nama);
    execute format('grant all on public.%I to service_role', nama);
  end loop;
end $$;
alter table public.log_admin enable row level security;
drop policy if exists log_admin_baca on public.log_admin;
create policy log_admin_baca on public.log_admin for select to authenticated using(public.admin_aktif());
revoke all on public.log_admin from public, anon, authenticated;
grant select on public.log_admin to authenticated;
grant all on public.log_admin to service_role;
revoke all on sequence public.varian_id_seq, public.log_admin_id_seq from public, anon;
grant usage, select on sequence public.varian_id_seq to authenticated, service_role;
grant usage, select on sequence public.log_admin_id_seq to service_role;

create or replace function public.log_perubahan_produk()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.log_admin(admin_id, pelaku, aksi, produk_id, nama_produk)
  values(auth.uid(), coalesce(auth.jwt()->>'email', 'Sistem'),
    case tg_op when 'INSERT' then 'tambah' when 'UPDATE' then 'ubah' else 'hapus' end,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'DELETE' then old.nama else new.nama end);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.log_perubahan_produk() from public, anon, authenticated;
drop trigger if exists catat_perubahan_produk on public.produk;
create trigger catat_perubahan_produk after insert or update or delete on public.produk
for each row execute function public.log_perubahan_produk();

alter table public.produk add column if not exists urutan integer not null default 2147483647;
-- Posisi lama disusun satu kali; rerun tidak mengubah urutan yang sudah diatur.
with posisi as (select id, row_number() over(order by urutan, id)::integer as nomor from public.produk)
update public.produk p set urutan = posisi.nomor from posisi where p.id = posisi.id and p.urutan = 2147483647;
create index if not exists produk_urutan_idx on public.produk(urutan, id);
create or replace function public.geser_produk(p_id bigint, p_arah integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare posisi integer; tetangga bigint; begin
  if not public.admin_aktif() or p_arah not in (-1,1) then raise exception 'Aksi tidak valid'; end if;
  perform pg_advisory_xact_lock(410047);
  if not exists(select 1 from public.produk where id = p_id) then raise exception 'Produk tidak ditemukan'; end if;
  with nomor as (select id, row_number() over(order by urutan,id)::integer as n from public.produk)
  update public.produk p set urutan = nomor.n from nomor where p.id = nomor.id and p.urutan <> nomor.n;
  select urutan into posisi from public.produk where id = p_id;
  select id into tetangga from public.produk where urutan = posisi + p_arah;
  if tetangga is null then return false; end if;
  update public.produk set urutan = case when id = p_id then posisi + p_arah else posisi end where id in (p_id, tetangga);
  return true;
end;
$$;
revoke all on function public.geser_produk(bigint,integer) from public, anon;
grant execute on function public.geser_produk(bigint,integer) to authenticated;

alter table public.kategori add column if not exists slug text;
create unique index if not exists kategori_slug_unik on public.kategori(slug);
create or replace function public.slug_kategori()
returns trigger language plpgsql set search_path = '' as $$
declare dasar text; kandidat text; nomor integer := 1; begin
  if new.slug is not null and new.slug <> '' then return new; end if;
  perform pg_advisory_xact_lock(410049);
  dasar := btrim(regexp_replace(lower(new.nama), '[^a-z0-9]+', '-', 'g'), '-');
  if dasar = '' then dasar := 'kategori'; end if;
  kandidat := dasar;
  while exists(select 1 from public.kategori where slug = kandidat and nama <> new.nama) loop
    nomor := nomor + 1; kandidat := dasar || '-' || nomor::text;
  end loop;
  new.slug := kandidat; return new;
end;
$$;
revoke all on function public.slug_kategori() from public, anon, authenticated;
drop trigger if exists buat_slug_kategori on public.kategori;
create trigger buat_slug_kategori before insert or update on public.kategori for each row execute function public.slug_kategori();
update public.kategori set slug = null where slug is null or slug = '';
alter table public.kategori alter column slug set not null;

create or replace function public.produk_terlaris()
returns table(produk_id bigint, nama text, jumlah bigint) language sql stable security invoker set search_path = '' as $$
  select p.id, p.nama, count(*) from public.klik_whatsapp k join public.produk p on p.id=k.produk_id
  group by p.id,p.nama order by count(*) desc,p.id limit 5;
$$;
revoke all on function public.produk_terlaris() from public, anon;
grant execute on function public.produk_terlaris() to authenticated;

-- Pembatas AI lintas instance: 30 permintaan global/menit, 5 per token browser/menit.
create table if not exists public.batas_ai (
  kunci text primary key, jumlah integer not null, berakhir timestamptz not null
);
alter table public.batas_ai enable row level security;
revoke all on public.batas_ai from public, anon, authenticated;
grant all on public.batas_ai to service_role;
create or replace function public.ambil_kuota_ai(p_token text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare total integer; token_count integer; batas timestamptz := date_trunc('minute',now()) + interval '1 minute'; begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Token tidak valid'; end if;
  delete from public.batas_ai where berakhir < now();
  insert into public.batas_ai(kunci,jumlah,berakhir) values('global',1,batas)
  on conflict(kunci) do update set jumlah = case when public.batas_ai.berakhir <= now() then 1 else public.batas_ai.jumlah + 1 end, berakhir=batas
  returning jumlah into total;
  if total > 30 then return false; end if;
  insert into public.batas_ai(kunci,jumlah,berakhir) values(p_token,1,batas)
  on conflict(kunci) do update set jumlah = case when public.batas_ai.berakhir <= now() then 1 else public.batas_ai.jumlah + 1 end, berakhir=batas
  returning jumlah into token_count;
  return token_count <= 5;
end;
$$;
revoke all on function public.ambil_kuota_ai(text) from public, anon, authenticated;
grant execute on function public.ambil_kuota_ai(text) to service_role;
notify pgrst, 'reload schema';
commit;
