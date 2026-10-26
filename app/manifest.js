import { ambilToko } from "@/lib/toko-server";
export const dynamic="force-dynamic";

export default async function manifest() {
  const toko=await ambilToko();
  return {
    id: "/",
    name: toko.nama,
    short_name: toko.nama.slice(0, 20),
    description: toko.tagline,
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f6b4f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
