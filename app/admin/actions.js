"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "@/lib/supabase/admin";
import { bacaFormProduk, idProdukValid } from "@/lib/produk";

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
  let supabase;

  try {
    supabase = await createSessionClient();
  } catch {
    redirect("/admin/password?status=session-error");
  }

  let hasilSesi;

  try {
    hasilSesi = await supabase.auth.getUser();
  } catch {
    redirect("/admin/password?status=session-error");
  }

  if (hasilSesi.error || !hasilSesi.data.user) {
    redirect("/admin/login");
  }

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
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);
  revalidatePath(`/admin/produk/${id}/ubah`);
}

async function simpanProduk(id, formData, mengubah) {
  // Pemeriksaan ini tetap berjalan jika Server Action dipanggil langsung.
  const supabase = await requireAdmin();
  if (mengubah && !idProdukValid(id)) {
    return { error: "ID produk tidak valid. Kembali ke daftar produk lalu coba lagi." };
  }

  const hasil = bacaFormProduk(formData);
  if (hasil.error) {
    return { error: hasil.error };
  }

  let produk;
  try {
    const query = mengubah
      ? supabase.from("produk").update(hasil.data).eq("id", id)
      : supabase.from("produk").insert(hasil.data);
    const { data, error } = await query.select("id").maybeSingle();

    if (error) {
      return { error: "Produk gagal disimpan. Periksa koneksi dan izin akun, lalu coba lagi." };
    }
    produk = data;
  } catch {
    return { error: "Produk gagal disimpan. Periksa koneksi lalu coba lagi." };
  }

  if (!produk) {
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
