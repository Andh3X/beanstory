"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "@/lib/supabase/admin";
import { bacaFormProduk, idProdukValid } from "@/lib/produk";
import { unggahFoto, bersihkanUpload } from "@/lib/upload";

/**
 * US-45: definisi trigger dari docs/migrations/003-us41-us50.sql disertakan
 * bersama pemanggil CRUD. SQL ini diterapkan saat migrasi, bukan per request.
 * Log dan perubahan produk berada dalam transaksi database yang sama.
 * Awal SQL US-45 tabel
create table if not exists public.log_admin (
  id bigint generated always as identity primary key,
  admin_id uuid,
  pelaku text not null,
  aksi text not null check(aksi in ('tambah','ubah','hapus')),
  produk_id bigint not null,
  nama_produk text not null,
  created_at timestamptz not null default now()
);
 * Akhir SQL US-45 tabel
 * Awal SQL US-45 trigger
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
 * Akhir SQL US-45 trigger
 */

export async function masukAdmin(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect("/admin/login?error=credentials");
  }

  let error;

  try {
    const supabase = await createSessionClient();
    ({ error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    }));
  } catch {
    redirect("/admin/login?error=service");
  }

  if (error) {
    redirect("/admin/login?error=credentials");
  }

  redirect("/admin");
}

export async function keluarAdmin() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function ubahPasswordAdmin(formData) {
  const supabase = await requireAdmin();

  const password = formData.get("password_baru");
  const konfirmasiPassword = formData.get("konfirmasi_password");

  if (typeof password !== "string" || password.length < 8) {
    redirect("/admin/password?status=too-short");
  }

  if (typeof konfirmasiPassword !== "string" || password !== konfirmasiPassword) {
    redirect("/admin/password?status=mismatch");
  }

  let error;

  try {
    ({ error } = await supabase.auth.updateUser({ password }));
  } catch {
    redirect("/admin/password?status=update-error");
  }

  if (error) {
    redirect("/admin/password?status=update-error");
  }

  redirect("/admin/password?status=success");
}

function perbaruiHalamanProduk(id) {
  revalidatePath("/admin");
  revalidatePath("/admin/aktivitas");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);
  revalidatePath(`/admin/produk/${id}/ubah`);
  revalidatePath("/sitemap.xml");
}

async function simpanProduk(id, formData, mengubah) {
  // Pemeriksaan ini tetap berjalan jika Server Action dipanggil langsung.
  const supabase = await requireAdmin();
  if (mengubah && !idProdukValid(id)) {
    return { error: "ID produk tidak valid. Kembali ke daftar produk lalu coba lagi." };
  }

  if (!formData || typeof formData.get !== "function") return { error: "Formulir produk tidak valid. Muat ulang halaman lalu coba lagi." };
  const file = formData.get("foto_file");
  if (file && typeof file !== "string" && file.size > 0) formData.set("foto_url", "");
  const hasil = bacaFormProduk(formData);
  if (hasil.error) {
    return hasil;
  }

  let produk;
  let upload = {};
  try {
    if (hasil.data.kategori) {
      const kategori = await supabase.from("kategori").select("nama").eq("nama", hasil.data.kategori).maybeSingle();
      if (kategori.error) return { error: "Kategori gagal diperiksa. Coba lagi." };
      if (!kategori.data) return { error: "Kategori tidak tersedia.", fieldErrors: { kategori: "Pilih kategori yang tersedia atau tanpa kategori." } };
    }
    upload = await unggahFoto(supabase, file);
    if (upload.error) return { error: upload.error, fieldErrors: { foto_file: upload.error } };
    if (upload.url) hasil.data.foto_url = upload.url;
    // US-45: trigger AFTER INSERT/UPDATE/DELETE catat_perubahan_produk menulis
    // log_admin (pelaku auth.uid()/email JWT, aksi, waktu) dalam transaksi ini.
    // Definisi: docs/migrations/003-us41-us50.sql -> log_perubahan_produk().
    const query = mengubah
      ? supabase.from("produk").update(hasil.data).eq("id", id)
      : supabase.from("produk").insert(hasil.data);
    const { data, error } = await query.select("id").maybeSingle();

    if (error) {
      await bersihkanUpload(supabase, upload.nama);
      return { error: "Produk gagal disimpan. Periksa koneksi dan izin akun, lalu coba lagi." };
    }
    produk = data;
  } catch {
    await bersihkanUpload(supabase, upload.nama);
    return { error: "Produk gagal disimpan. Periksa koneksi lalu coba lagi." };
  }

  if (!produk) {
    await bersihkanUpload(supabase, upload.nama);
    return { error: "Produk tidak ditemukan atau tidak dapat disimpan. Muat ulang daftar produk." };
  }

  perbaruiHalamanProduk(produk.id);
  redirect(`/admin?status=${mengubah ? "updated" : "created"}`);
}

export async function tambahProduk(_state, formData) {
  return simpanProduk(null, formData, false);
}

export async function ubahProduk(id, _state, formData) {
  return simpanProduk(id, formData, true);
}

export async function hapusProduk(id, _state, _formData) {
  const supabase = await requireAdmin();

  if (!idProdukValid(id)) {
    return { error: "ID produk tidak valid. Muat ulang daftar produk." };
  }

  let produk;
  try {
    // Trigger log_perubahan_produk mencatat OLD.id/nama saat DELETE,
    // sehingga log tetap tersedia sesudah produk dihapus; tidak ada insert ganda.
    const { data, error } = await supabase
      .from("produk")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: "Produk gagal dihapus. Periksa koneksi dan izin akun, lalu coba lagi." };
    }
    produk = data;
  } catch {
    return { error: "Produk gagal dihapus. Periksa koneksi lalu coba lagi." };
  }

  if (!produk) {
    return { error: "Produk tidak ditemukan atau tidak dapat dihapus. Muat ulang daftar produk." };
  }

  perbaruiHalamanProduk(produk.id);
  redirect("/admin?status=deleted");
}
