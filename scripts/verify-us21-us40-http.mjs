// Verifikasi HTTP build Next.js dengan layanan Supabase pengganti dalam memori.
// Tidak menggunakan akun/kredensial atau menulis ke Supabase toko.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
const require = createRequire(import.meta.url);
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node");

const produk = [
  { id: 1, nama: "Kopi HTTP", harga: 25000, harga_diskon: 20000, stok: 5, kategori: "Minuman", deskripsi: "Kopi untuk verifikasi HTTP.", aktif: true, foto_url: "/produk/kopi.svg", foto_tambahan: [], badge: "Baru", created_at: "2026-01-01T00:00:00Z" },
  { id: 2, nama: "Teh HTTP", harga: 15000, stok: null, kategori: "Minuman", deskripsi: "Teh untuk verifikasi HTTP.", aktif: true, foto_url: "/produk/kopi.svg", foto_tambahan: [], created_at: "2026-01-02T00:00:00Z" },
  { id: 3, nama: "RAHASIA NONAKTIF", harga: 10000, kategori: "Minuman", aktif: false, created_at: "2026-01-03T00:00:00Z" },
];
const kategori = [{ nama: "Minuman" }], ulasan = [], klik = [], objects = new Map();
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "fixture@example.invalid", user_metadata: {} };
const jwt = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"), Buffer.from(JSON.stringify({ sub: user.id, aud: user.aud, role: user.role, exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url"), Buffer.from("fixture-signature").toString("base64url")].join(".");
let app, logs = "", nextId = 100;
const fixture = createServer(async (req, res) => {
  const url = new URL(req.url, "http://fixture");
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  let body; try { body = JSON.parse(buffer.toString() || "null"); } catch { body = null; }
  const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
  const fail = () => send({ message: "fixture rejected", code: "23503" }, 400);
  try {
    if (url.pathname === "/auth/v1/user") return send(user);
    if (url.pathname.startsWith("/storage/v1/object/")) {
      const nama = url.pathname.split("/").pop();
      if (req.method === "POST") { objects.set(nama, buffer); return send({ Key: `produk/${nama}` }); }
      if (req.method === "DELETE") { for (const key of body?.prefixes || []) objects.delete(key); return send([]); }
      if (objects.has(nama)) { res.writeHead(200, { "Content-Type": "image/jpeg" }); return res.end(objects.get(nama)); }
      return send({}, 404);
    }
    if (url.pathname.includes("/rpc/")) {
      const rpc = url.pathname.split("/").pop();
      if (rpc === "statistik_produk") {
        const counts = new Map(); for (const p of produk) counts.set(p.kategori ?? null, (counts.get(p.kategori ?? null) || 0)+1);
        return send([...counts].map(([kategori,jumlah]) => ({ kategori,jumlah })));
      }
      if (rpc === "ringkasan_ulasan") {
        const rows = ulasan.filter((u) => String(u.produk_id) === String(body.p_produk_id) && u.terlihat);
        return send([{ jumlah: rows.length, rata_rata: rows.length ? rows.reduce((n,u) => n+u.rating,0)/rows.length : 0 }]);
      }
      if (rpc === "kirim_ulasan") {
        if (!produk.some((p) => String(p.id) === body.p_produk_id && p.aktif)) return fail();
        const id = nextId++; ulasan.push({ id, produk_id: Number(body.p_produk_id), nama: body.p_nama, rating: body.p_rating, komentar: body.p_komentar, terlihat: true, created_at: new Date().toISOString() }); return send(id);
      }
      if (rpc === "catat_klik_whatsapp") {
        for (const id of new Set(body.p_ids)) if (produk.some((p) => String(p.id) === id && p.aktif)) klik.push({ produk_id: Number(id), created_at: new Date().toISOString() });
        return send(null);
      }
      return fail();
    }
    const table = url.pathname.split("/").pop();
    const rows = { produk, kategori, ulasan }[table]; if (!rows) return send({}, 404);
    let selected = rows.filter((row) => [...url.searchParams].every(([key, value]) => {
      if (["select", "order", "offset", "limit"].includes(key)) return true;
      if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
      if (value.startsWith("neq.")) return String(row[key]) !== value.slice(4);
      if (value.startsWith("in.(")) return value.slice(4,-1).split(",").includes(String(row[key]));
      if (value.startsWith("ilike.")) return String(row[key]).toLowerCase().includes(value.slice(6).replaceAll("%", "").toLowerCase());
      return true;
    }));
    if (req.method === "POST") {
      if (table === "kategori" && kategori.some((k) => k.nama === body.nama)) return fail();
      const row = table === "produk" ? { id: nextId++, aktif: true, foto_tambahan: [], created_at: new Date().toISOString(), ...body } : { ...body };
      rows.push(row); selected = [row];
    }
    if (req.method === "PATCH") {
      if (table === "kategori") for (const row of selected) for (const p of produk) if (p.kategori === row.nama) p.kategori = body.nama;
      for (const row of selected) Object.assign(row, body);
    }
    if (req.method === "DELETE") {
      if (table === "kategori" && selected.some((k) => produk.some((p) => p.kategori === k.nama))) return fail();
      for (const row of selected) rows.splice(rows.indexOf(row), 1);
    }
    const total = selected.length;
    const range = req.headers.range?.split("-").map(Number);
    const offset = range?.[0] ?? Number(url.searchParams.get("offset") || 0);
    const limit = range ? range[1] - range[0] + 1 : Number(url.searchParams.get("limit") || total);
    selected = selected.slice(offset, offset + limit);
    if (url.searchParams.get("select")?.includes("produk(nama)")) selected = selected.map((u) => ({ ...u, produk: { nama: produk.find((p) => p.id === u.produk_id)?.nama } }));
    res.setHeader("Content-Range", `0-${Math.max(0,selected.length-1)}/${total}`);
    if (req.method === "HEAD") { res.writeHead(200); return res.end(); }
    return send(req.headers.accept?.includes("vnd.pgrst.object") ? selected[0] ?? null : selected);
  } catch { return send({ message: "fixture failure" }, 500); }
});

try {
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
  const dbUrl = `http://127.0.0.1:${fixture.address().port}`;
  // Hanya port lokal sementara; child tidak mewarisi nilai kredensial Supabase toko.
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3004", "-H", "127.0.0.1"], { cwd: process.cwd(), windowsHide: true, env: { ...process.env, SUPABASE_URL: dbUrl, SUPABASE_SECRET_KEY: "fixture-service", SUPABASE_PUBLISHABLE_KEY: "fixture-publishable" }, stdio: ["ignore", "pipe", "pipe"] });
  app.stdout.on("data", (chunk) => { logs += chunk; }); app.stderr.on("data", (chunk) => { logs += chunk; });
  const base = "http://127.0.0.1:3004";
  let ready = false;
  for (let i=0; i<100; i++) { try { const res = await fetch(`${base}/tentang`); if (res.ok) { ready = true; break; } } catch {} await delay(100); }
  assert.ok(ready, "Next.js tidak siap");
  const session = { access_token: jwt, refresh_token: "fixture-refresh", expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: "bearer", user };
  const cookie = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  async function action(nama, args, path = "/admin", login = true) {
    const entry = Object.entries(manifest.node).find(([, value]) => value.exportedName === nama);
    assert.ok(entry, `Server Action ${nama} tidak ditemukan`);
    const body = await encodeReply(args);
    const headers = { "Next-Action": entry[0], Origin: base }; if (login) headers.Cookie = cookie;
    if (typeof body === "string") headers["Content-Type"] = "text/plain;charset=UTF-8";
    const res = await fetch(base+path, { method: "POST", headers, body, redirect: "manual" });
    return { res, text: await res.text() };
  }
  const fd = (values) => { const form = new FormData(); for (const [k,v] of Object.entries(values)) form.set(k,v); return form; };
  for (const path of ["/admin", "/admin/kategori", "/admin/ulasan", "/admin/produk/ekspor"]) assert.equal((await fetch(base+path, { redirect: "manual" })).status, 307);
  let html = await (await fetch(base+"/")).text(); assert.ok(html.includes("Kopi HTTP")); assert.ok(!html.includes("RAHASIA NONAKTIF"));
  let res = await fetch(base+"/produk/1"); html = await res.text(); assert.equal(res.status,200); assert.match(html, /property="og:title" content="Kopi HTTP"/); assert.match(html, /rel="canonical" href="https:\/\/beanstory.vercel.app\/produk\/1"/);
  for (const path of ["/produk/3", "/produk/999", "/bandingkan?ids=1,3", "/bandingkan?ids=1,1"]) assert.equal((await fetch(base+path)).status,404,path);
  html = await (await fetch(base+"/bandingkan?ids=1,2")).text(); assert.ok(html.includes("Kopi HTTP") && html.includes("Teh HTTP"));
  html = await (await fetch(base+"/sitemap.xml")).text(); assert.ok(html.includes("/produk/1")); assert.ok(!html.includes("/produk/3"));
  res = await fetch(base+"/api/produk/seleksi", { method:"POST", body:JSON.stringify({ids:["1","3"]}) }); assert.deepEqual((await res.json()).produk.map((p)=>p.id),[1]);
  html = await (await fetch(base+"/admin", {headers:{Cookie:cookie}})).text(); assert.ok(html.includes("RAHASIA NONAKTIF")); assert.match(html,/Seluruh produk:/);
  const values = { nama:"Produk CRUD HTTP", harga:"30000", kategori:"Minuman", foto_url:"/produk/kopi.svg", deskripsi:"Uji HTTP", aktif:"true", stok:"4", harga_diskon:"25000", foto_tambahan:"", badge:"" };
  let result = await action("tambahProduk", [null,fd(values)]); assert.match(result.res.headers.get("x-action-redirect") || "", /status=created/);
  const baru = produk.find((p)=>p.nama===values.nama); assert.ok(baru);
  result = await action("ubahProduk", [String(baru.id),null,fd({...values,nama:"Produk diubah HTTP"})]); assert.match(result.res.headers.get("x-action-redirect") || "", /status=updated/); assert.equal(baru.nama,"Produk diubah HTTP");
  result = await action("ubahProduk", [String(baru.id),null,fd({...values,harga:"0"})]); assert.ok(result.text.includes("Harga harus")); assert.equal(baru.harga,30000);
  const foto = fd({...values,nama:"Foto HTTP"}); foto.set("foto_file",new Blob([new Uint8Array([255,216,255,0])],{type:"image/jpeg"}),"foto.jpg");
  result = await action("tambahProduk", [null,foto]); assert.match(result.res.headers.get("x-action-redirect") || "", /status=created/);
  const denganFoto = produk.find((p)=>p.nama==="Foto HTTP"); assert.ok(denganFoto?.foto_url.startsWith("/media/produk/"));
  res = await fetch(base+new URL(denganFoto.foto_url,base).pathname); assert.equal(res.status,200); assert.equal((await res.arrayBuffer()).byteLength,4);
  await action("tambahKategori", [{},fd({nama:"Kategori HTTP"})],"/admin/kategori"); assert.ok(kategori.some((k)=>k.nama==="Kategori HTTP"));
  await action("ubahKategori", ["Minuman",{},fd({nama:"Minuman baru"})],"/admin/kategori"); assert.equal(produk[0].kategori,"Minuman baru");
  result=await action("hapusKategori", ["Minuman baru",{},fd({})],"/admin/kategori"); assert.ok(result.text.includes("dipakai produk")); assert.ok(kategori.some((k)=>k.nama==="Minuman baru"));
  await action("hapusKategori", ["Kategori HTTP",{},fd({})],"/admin/kategori"); assert.ok(!kategori.some((k)=>k.nama==="Kategori HTTP"));
  result = await action("kirimUlasan", ["1",{},fd({nama:"Pembeli HTTP",rating:"4",komentar:"Ulasan HTTP bagus",website:""})],"/produk/1",false); assert.ok(result.text.includes("sudah ditampilkan")); assert.equal(ulasan.length,1);
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("Ulasan HTTP bagus")); assert.ok(html.includes("4.0 / 5"));
  await action("moderasiUlasan", [String(ulasan[0].id),"sembunyikan",{},fd({})],"/admin/ulasan"); assert.equal(ulasan[0].terlihat,false);
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("Belum ada ulasan.")); assert.ok(!html.includes("Ulasan HTTP bagus"));
  await action("moderasiUlasan", [String(ulasan[0].id),"tampilkan",{},fd({})],"/admin/ulasan"); assert.equal(ulasan[0].terlihat,true);
  res=await fetch(base+"/api/klik-whatsapp",{method:"POST",headers:{Origin:base},body:JSON.stringify({ids:["1","1","2"]})}); assert.equal(res.status,204); assert.equal(klik.length,2); assert.deepEqual(Object.keys(klik[0]),["produk_id","created_at"]);
  await action("ubahStatusProduk", [String(baru.id),false,{},fd({})]); assert.equal(baru.aktif,false); assert.equal((await fetch(base+`/produk/${baru.id}`)).status,404);
  res=await fetch(base+"/admin/produk/ekspor",{headers:{Cookie:cookie}}); assert.equal(res.status,200); const bytes=new Uint8Array(await res.arrayBuffer()); assert.deepEqual(Array.from(bytes.slice(0,3)),[239,187,191]); assert.ok(new TextDecoder().decode(bytes).includes("RAHASIA NONAKTIF"));
  await action("hapusProduk", [String(baru.id),null,fd({})]); assert.ok(!produk.includes(baru)); assert.equal((await fetch(base+`/produk/${baru.id}`)).status,404);
  console.log("HTTP OK: katalog/detail/metadata/sitemap/404, autentikasi, CRUD/upload/media, kategori, status, ulasan/moderasi/rata-rata, klik, dan CSV. Supabase pengganti; SQL/RLS asli dan UI browser belum diuji.");
} catch (error) {
  console.error(error); console.error(logs.slice(-6000)); process.exitCode=1;
} finally {
  app?.kill(); fixture.closeAllConnections(); await new Promise((resolve)=>fixture.close(resolve));
}
