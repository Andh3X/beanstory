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