// Hanya SELECT dan RPC agregasi baca; tidak membuat ulasan, produk, log, atau akun.
// Jalankan dari root: node scripts/verify-penilaian-production.mjs
// --database-only melewati HTTP bila kode baru belum dideploy.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
let gagal = 0;
const lapor = (ok, nama, detail = "") => {
  console.log(`${ok ? "OK" : "PERIKSA"} ${nama}${detail ? `: ${detail}` : ""}`);
  if (!ok) gagal++;
};
const kode = (error) => /^[A-Z0-9_]+$/.test(error?.code || "") ? error.code : "KONEKSI";

if (!process.argv.includes("--database-only")) {
  const site = new URL(process.env.SITE_URL || "https://beanstory.vercel.app");
  if (site.protocol !== "https:") throw new Error("Pemeriksaan Production memerlukan SITE_URL HTTPS.");
  for (const path of ["/", "/admin/login", "/admin", "/halaman-uji-tidak-ada-penilaian"]) {
    try {
      const res = await fetch(new URL(path, site), { redirect: "manual", signal: AbortSignal.timeout(15000) });
      const csp = res.headers.get("content-security-policy") || "";
      const header = res.headers.get("x-content-type-options") === "nosniff"
        && res.headers.get("x-frame-options") === "DENY"
        && !!res.headers.get("referrer-policy");
      lapor(header, `header ${path}`, `HTTP ${res.status}`);
      lapor(csp.includes("'nonce-") && csp.includes("frame-ancestors 'none'") && !/unsafe-inline|unsafe-eval/.test(csp), `CSP ${path}`);
      if (path === "/admin") lapor(res.status === 307 && new URL(res.headers.get("location"), site).pathname === "/admin/login", "admin tanpa sesi");
      await res.body?.cancel();
    } catch { lapor(false, `HTTP ${path}`, "permintaan tidak selesai; cek koneksi/deployment"); }
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  lapor(false, "database", "variabel server belum tersedia; nilai kunci tidak ditampilkan");
} else {
  // Batasi waktu agar kegagalan koneksi tidak membuat pemeriksaan menggantung.
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) },
  });
  try {
    const log = await db.from("log_admin").select("id", { count: "exact", head: true });
    lapor(!log.error, "tabel log_admin", !log.error ? `${log.count} baris; keberadaan tabel belum membuktikan trigger aktif` : `${kode(log.error)}; cek migrasi/koneksi`);
    const products = await db.from("produk").select("id").eq("aktif", true).order("id").limit(3);
    lapor(!products.error, "sampel produk aktif", products.error ? kode(products.error) : `${products.data.length} produk`);
    for (const p of products.data || []) {
      const summary = await db.rpc("ringkasan_ulasan", { p_produk_id: String(p.id) });
      let ratings = [], error;
      for (let start = 0; ; start += 1000) {
        const page = await db.from("ulasan").select("id,rating").eq("produk_id", p.id).eq("terlihat", true).order("id").range(start, start + 999);
        if (page.error) { error = page.error; break; }
        ratings.push(...page.data);
        if (page.data.length < 1000) break;
      }
      const avg = ratings.length ? ratings.reduce((n, r) => n + r.rating, 0) / ratings.length : 0;
      const value = summary.data?.[0];
      lapor(!error && !summary.error && !!value && Number(value.jumlah) === ratings.length && Math.abs(Number(value.rata_rata) - avg) < 0.000001,
        `ringkasan ulasan produk ${p.id}`, "dibandingkan dengan seluruh rating terlihat; tanpa data pribadi");
    }
  } catch { lapor(false, "database", "koneksi/pemeriksaan gagal; detail kredensial tidak ditampilkan"); }
}
console.log("BACA SAJA. Trigger/RLS sebenarnya tetap diperiksa melalui docs/verifikasi-penilaian.sql dan uji sesi admin. Tidak ada mutasi Production.");
process.exitCode = gagal ? 1 : 0;
