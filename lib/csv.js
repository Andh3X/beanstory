export const KOLOM_CSV = ["id", "nama", "harga", "harga_diskon", "kategori", "stok", "aktif", "foto_url", "foto_tambahan", "deskripsi", "badge", "created_at"];
export function selCsv(value) {
  let teks = Array.isArray(value) ? value.join("\n") : String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(teks) || /^[\t\r]/.test(teks)) teks = `'${teks}`;
  return `"${teks.replace(/"/g, '""')}"`;
}
export function buatCsv(produk) {
  return "\uFEFF" + [KOLOM_CSV.map(selCsv).join(","), ...produk.map((p) => KOLOM_CSV.map((kolom) => selCsv(p[kolom])).join(","))].join("\r\n");
}
