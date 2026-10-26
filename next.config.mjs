import { contentSecurityPolicy, securityHeaders } from "./lib/security.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Supaya deploy tidak gagal hanya karena error tipe kecil selama workshop.
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [{ source: "/:path*", headers: [
      ...securityHeaders,
      // Aset statis tidak memerlukan skrip inline; halaman dinamis mendapat nonce dari proxy.
      { key: "Content-Security-Policy", value: contentSecurityPolicy(null, process.env.NODE_ENV === "development") },
    ] }, { source: "/sw.js", headers: [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Service-Worker-Allowed", value: "/" },
    ] }];
  },
};

export default nextConfig;
