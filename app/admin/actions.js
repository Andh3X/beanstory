"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";

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