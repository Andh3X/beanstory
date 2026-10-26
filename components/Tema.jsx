"use client";
import { useEffect, useState } from "react";
export default function Tema() {
  const [tema, setTema] = useState("sistem");
  const [pesan, setPesan] = useState("");
  const [gelap, setGelap] = useState(false);
  useEffect(() => {
    setGelap(document.documentElement.dataset.theme === "gelap");
    try { const tersimpan = localStorage.getItem("beanstory:tema:v1"); if (["gelap", "terang"].includes(tersimpan)) setTema(tersimpan); } catch {}
    const media = matchMedia("(prefers-color-scheme: dark)");
    const ikuti = () => { let t; try { t = localStorage.getItem("beanstory:tema:v1"); } catch {} if (!["gelap", "terang"].includes(t)) { document.documentElement.dataset.theme = media.matches ? "gelap" : "terang"; setGelap(media.matches); } };
    media.addEventListener("change", ikuti); return () => media.removeEventListener("change", ikuti);
  }, []);
  function ganti(value) {
    setTema(value); document.documentElement.dataset.theme = value === "sistem" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "gelap" : "terang") : value;
    setGelap(document.documentElement.dataset.theme === "gelap");
    try { localStorage.setItem("beanstory:tema:v1", value); setPesan(""); } catch { setPesan("Tema hanya diterapkan untuk halaman ini."); }
  }
  return <div className="flex flex-wrap items-center gap-2 text-xs"><button type="button" aria-pressed={gelap} onClick={() => ganti(gelap ? "terang" : "gelap")} className="rounded border border-garis p-2">Mode gelap</button><label className="sr-only" htmlFor="tema">Tema tampilan</label><select id="tema" value={tema} onChange={(event) => ganti(event.target.value)} className="max-w-28 rounded border border-garis bg-latar p-2 text-teks"><option value="sistem">Sistem</option><option value="terang">Terang</option><option value="gelap">Gelap</option></select>{pesan ? <span role="status">{pesan}</span> : null}</div>;
}
