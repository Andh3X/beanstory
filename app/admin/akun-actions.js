"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { teksForm } from "@/lib/pengaturan";
const uuidValid = (id) => typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);

export async function tambahAdmin(_state, formData) {
  await requireAdmin();
  const email=teksForm(formData,"email"), password=typeof formData?.get?.("password")==="string" ? formData.get("password") : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length<8 || password.length>128) return {error:"Isi email yang valid dan password awal 8–128 karakter."};
  let server,createdId;
  try {
    server=createServerClient();
    const {data,error}=await server.auth.admin.createUser({email,password,email_confirm:true});
    if(error || !data?.user) return {error:"Akun gagal dibuat. Periksa email yang sudah terdaftar dan ketentuan password Supabase."};
    createdId=data.user.id;
    const hasil=await server.from("admin_toko").insert({id:data.user.id,aktif:true}).select("id").maybeSingle();
    if(hasil.error || !hasil.data) {
      throw new Error("Registry gagal disimpan");
    }
  } catch {
    if(createdId){
      try{const cleanup=await server.auth.admin.deleteUser(createdId);if(!cleanup.error)return{error:"Pendaftaran admin gagal dan akun baru dibatalkan. Coba lagi."};}catch{}
      return{error:"Pendaftaran admin gagal. Akun Auth belum mendapat akses admin; periksa Authentication di Supabase sebelum mencoba lagi."};
    }
    return {error:"Akun gagal dibuat. Periksa koneksi dan konfigurasi server."};
  }
  revalidatePath("/admin/akun"); return {success:"Admin berhasil ditambahkan. Sampaikan password awal secara pribadi dan minta admin menggantinya setelah login."};
}

export async function kelolaAdmin(id, operasi, _state, _formData) {
  const db=await requireAdmin();
  if(!uuidValid(id) || !["aktifkan","nonaktifkan","hapus"].includes(operasi)) return {error:"Aksi akun tidak valid."};
  const sesi=await db.auth.getUser();
  if(sesi.error || !sesi.data?.user || sesi.data.user.id===id) return {error:"Anda tidak boleh menonaktifkan atau menghapus akun sendiri."};
  try {
    const server=createServerClient();
    if(operasi!=="aktifkan") {
      const status=await db.rpc("status_admin",{p_id:id,p_aktif:false});
      if(status.error || status.data!==true) return {error:"Status admin gagal diubah atau akun tidak ditemukan."};
      if(operasi==="hapus") {
        const hasil=await server.auth.admin.deleteUser(id);
        if(hasil.error) return {error:"Akses admin sudah dinonaktifkan, tetapi akun Auth gagal dihapus. Periksa kepemilikan file di Storage atau coba lagi."};
      } else {
        const hasil=await server.auth.admin.updateUserById(id,{ban_duration:"876000h"});
        if(hasil.error) return {error:"Akses admin sudah dinonaktifkan. Pemblokiran login Auth belum berhasil; coba nonaktifkan lagi."};
      }
    } else {
      // Kegagalan aktivasi registry tetap menolak akses, meskipun ban Auth sudah dicabut.
      const hasil=await server.auth.admin.updateUserById(id,{ban_duration:"none"});
      if(hasil.error) return {error:"Akun Auth gagal diaktifkan."};
      const status=await db.rpc("status_admin",{p_id:id,p_aktif:true});
      if(status.error || status.data!==true) return {error:"Akses admin belum dapat diaktifkan. Coba lagi."};
    }
  } catch {return {error:"Pengelolaan akun belum selesai. Muat ulang daftar untuk memeriksa status sebelum mencoba lagi."};}
  revalidatePath("/admin/akun"); return {success:"Akun admin berhasil diperbarui."};
}
