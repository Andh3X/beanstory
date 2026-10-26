import { absolut } from "@/lib/site";
export default function robots() {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/keranjang", "/favorit", "/bandingkan"] }, sitemap: absolut("/sitemap.xml") };
}
