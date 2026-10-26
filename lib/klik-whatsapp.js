// Tidak menyimpan identitas pengunjung. Kegagalan pencatatan tidak menahan navigasi.
export function catatKlik(ids) {
  try {
    const body = JSON.stringify({ ids: [...new Set(ids.map(String))] });
    try {
      if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/klik-whatsapp", new Blob([body], { type: "application/json" }))) return;
    } catch { /* Kebijakan browser dapat menolak beacon; coba fetch. */ }
    void fetch("/api/klik-whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* WhatsApp tetap terbuka. */ }
}
