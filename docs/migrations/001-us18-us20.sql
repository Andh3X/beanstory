-- Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Menambah kolom; tidak mengganti data lama atau aturan RLS.
begin;
alter table public.produk
  add column if not exists foto_tambahan text[] not null default '{}',
  add column if not exists stok integer,
  add column if not exists harga_diskon integer,
  add column if not exists badge text;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.produk'::regclass and conname = 'produk_stok_valid') then
    alter table public.produk add constraint produk_stok_valid check (stok is null or stok >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.produk'::regclass and conname = 'produk_diskon_valid') then
    alter table public.produk add constraint produk_diskon_valid check (harga_diskon is null or (harga_diskon >= 0 and harga_diskon < harga));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.produk'::regclass and conname = 'produk_badge_valid') then
    alter table public.produk add constraint produk_badge_valid check (badge is null or badge in ('Baru', 'Terlaris'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.produk'::regclass and conname = 'produk_galeri_valid') then
    alter table public.produk add constraint produk_galeri_valid check (cardinality(foto_tambahan) <= 9);
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
