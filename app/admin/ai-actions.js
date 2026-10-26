"use server";

import { requireAdmin } from "@/lib/supabase/admin";
import { buatDrafDeskripsi } from "@/lib/gemini";

export async function buatDeskripsiAI(input) {
  await requireAdmin();
  return buatDrafDeskripsi(input?.nama, input?.kategori);
}
