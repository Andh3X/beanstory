import "server-only";

import { redirect } from "next/navigation";
import { createSessionClient } from "./session";

export async function requireAdmin() {
  let supabase;
  let hasilSesi;

  try {
    supabase = await createSessionClient();
    hasilSesi = await supabase.auth.getUser();
  } catch {
    redirect("/admin/login?error=service");
  }

  if (hasilSesi.error || !hasilSesi.data?.user) {
    redirect("/admin/login");
  }

  return supabase;
}
