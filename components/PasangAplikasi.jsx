"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Tombol from "@/components/Tombol";

export default function PasangAplikasi() {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState(null);
  const [tampil, setTampil] = useState(false);
  const [ios, setIos] = useState(false);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    if (pathname.startsWith("/admin")) { setTampil(false); return; }
    const modeAplikasi = window.matchMedia("(display-mode: standalone)");
    const perbarui = () => setTampil(!modeAplikasi.matches && !navigator.standalone);
    perbarui();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const sebelumPasang = (event) => { event.preventDefault(); setPrompt(event); };
    const terpasang = () => { setPrompt(null); setTampil(false); };
    window.addEventListener("beforeinstallprompt", sebelumPasang);
    window.addEventListener("appinstalled", terpasang);
    modeAplikasi.addEventListener("change", perbarui);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", sebelumPasang);
      window.removeEventListener("appinstalled", terpasang);
      modeAplikasi.removeEventListener("change", perbarui);
    };
  }, [pathname]);

  async function pasang() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setPesan("Buka menu browser untuk memasang aplikasi.");
    } finally {
      setPrompt(null);
    }
  }

  if (!tampil) return null;
  return (
    <aside className="mx-auto w-full max-w-5xl px-4 pb-6">
      {prompt ? <Tombol type="button" varian="garis" onClick={pasang}>Pasang aplikasi</Tombol> : (
        <details className="rounded-lg border border-garis p-3 text-sm text-teks-lembut">
          <summary className="cursor-pointer font-semibold text-utama">Pasang katalog di layar utama</summary>
          <p className="mt-2">{ios ? "Di Safari, ketuk Bagikan, lalu Tambahkan ke Layar Utama." : "Buka menu browser, lalu pilih Pasang aplikasi atau Tambahkan ke layar utama jika tersedia."}</p>
        </details>
      )}
      {pesan ? <p role="status" className="mt-2 text-sm text-teks-lembut">{pesan}</p> : null}
    </aside>
  );
}
