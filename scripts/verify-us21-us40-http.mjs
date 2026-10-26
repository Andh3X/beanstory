// Verifikasi HTTP build Next.js dengan layanan Supabase pengganti dalam memori.
// Tidak menggunakan akun/kredensial atau menulis ke Supabase toko.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import {randomUUID} from "node:crypto";
const require = createRequire(import.meta.url);
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node");

const produk = [
  { id: 1, nama: "Kopi HTTP", harga: 25000, harga_diskon: 20000, stok: 5, kategori: "Minuman", deskripsi: "Kopi untuk verifikasi HTTP.", aktif: true, foto_url: "/produk/kopi.svg", foto_tambahan: [], badge: "Baru", created_at: "2026-01-01T00:00:00Z" },
  { id: 2, nama: "Teh HTTP", harga: 15000, stok: null, kategori: "Minuman", deskripsi: "Teh untuk verifikasi HTTP.", aktif: true, foto_url: "/produk/kopi.svg", foto_tambahan: [], created_at: "2026-01-02T00:00:00Z" },
  { id: 3, nama: "RAHASIA NONAKTIF", harga: 10000, kategori: "Minuman", aktif: false, created_at: "2026-01-03T00:00:00Z" },
];
for(const p of produk)p.urutan=p.id;
const kategori = [{ nama: "Minuman",slug:"minuman" }], ulasan = [], klik = [], objects = new Map();
const pengaturan_toko=[],banner=[],varian=[],log_admin=[],batas_ai=new Map();
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "fixture@example.invalid", user_metadata: {} };
const authUsers=[user],admin_toko=[{id:user.id,aktif:true}];
const jwt = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"), Buffer.from(JSON.stringify({ sub: user.id, aud: user.aud, role: user.role, exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url"), Buffer.from("fixture-signature").toString("base64url")].join(".");
let app, logs = "", nextId = 100;
const fixture = createServer(async (req, res) => {
  const url = new URL(req.url, "http://fixture");
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  let body; try { body = JSON.parse(buffer.toString() || "null"); } catch { body = null; }
  const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
  const fail = () => send({ message: "fixture rejected", code: "23503" }, 400);
  let actor;try{const token=req.headers.authorization?.slice(7);const claims=JSON.parse(Buffer.from(token.split(".")[1],"base64url"));actor=authUsers.find((u)=>u.id===claims.sub);}catch{}
  const aktif=()=>admin_toko.some((a)=>a.id===actor?.id&&a.aktif);
  const catat=(aksi,row)=>log_admin.push({id:nextId++,admin_id:actor?.id,pelaku:actor?.email||"Sistem",aksi,produk_id:row.id,nama_produk:row.nama,created_at:new Date().toISOString()});
  try {
    if (url.pathname === "/auth/v1/user") return actor?send(actor):send({},401);
    if(url.pathname==="/auth/v1/admin/users"){
      if(req.method==="GET")return send({users:authUsers,aud:"authenticated"});
      if(req.method==="POST"){const baru={...user,id:randomUUID(),email:body.email};authUsers.push(baru);return send(baru);}
    }
    if(url.pathname.startsWith("/auth/v1/admin/users/")){
      const id=url.pathname.split("/").pop(),target=authUsers.find((u)=>u.id===id);if(!target)return fail();
      if(req.method==="DELETE"){authUsers.splice(authUsers.indexOf(target),1);const i=admin_toko.findIndex((u)=>u.id===id);if(i>=0)admin_toko.splice(i,1);return send(target);}
      if(req.method==="PUT"){target.banned_until=body.ban_duration==="none"?null:"2099-01-01T00:00:00Z";return send(target);}
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      const nama = url.pathname.split("/").pop();
      if (req.method === "POST") { objects.set(nama, buffer); return send({ Key: `produk/${nama}` }); }
      if (req.method === "DELETE") { for (const key of body?.prefixes || []) objects.delete(key); return send([]); }
      if (objects.has(nama)) { res.writeHead(200, { "Content-Type": "image/jpeg" }); return res.end(objects.get(nama)); }
      return send({}, 404);
    }
    if (url.pathname.includes("/rpc/")) {
      const rpc = url.pathname.split("/").pop();
      if(rpc==="admin_aktif")return send(aktif());
      if(rpc==="status_admin"){if(!aktif()||body.p_id===actor.id)return fail();const target=admin_toko.find((a)=>a.id===body.p_id);if(!target)return send(false);target.aktif=body.p_aktif;return send(true);}
      if(rpc==="produk_terlaris"){const counts=new Map();for(const k of klik)counts.set(k.produk_id,(counts.get(k.produk_id)||0)+1);return send([...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,5).map(([id,jumlah])=>({produk_id:id,nama:produk.find((p)=>p.id===id)?.nama,jumlah})));}
      if(rpc==="ambil_kuota_ai"){const count=(batas_ai.get(body.p_token)||0)+1;batas_ai.set(body.p_token,count);return send(count<=5);}
      if(rpc==="geser_produk"){const sorted=[...produk].sort((a,b)=>a.urutan-b.urutan||a.id-b.id);const index=sorted.findIndex((p)=>String(p.id)===body.p_id),other=index+body.p_arah;if(index<0)return fail();if(other<0||other>=sorted.length)return send(false);[sorted[index],sorted[other]]=[sorted[other],sorted[index]];sorted.forEach((p,i)=>p.urutan=i+1);return send(true);}
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
    const rows = { produk, kategori, ulasan,pengaturan_toko,banner,varian,log_admin,admin_toko }[table]; if (!rows) return send({}, 404);
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
      selected=[];
      for(const input of Array.isArray(body)?body:[body]){
        if(["pengaturan_toko","banner"].includes(table)&&rows.length){Object.assign(rows[0],input);selected.push(rows[0]);continue;}
        const row = table === "produk" ? { id: nextId++, urutan:2147483647, aktif: true, foto_tambahan: [], created_at: new Date().toISOString(), ...input } : table==="varian"?{id:nextId++,...input,produk_id:Number(input.produk_id)} : table==="kategori"?{...input,slug:input.nama.toLowerCase().replaceAll(" ","-")}: { ...input };
        rows.push(row);selected.push(row);if(table==="produk")catat("tambah",row);
      }
    }
    if (req.method === "PATCH") {
      if (table === "kategori") for (const row of selected) for (const p of produk) if (p.kategori === row.nama) p.kategori = body.nama;
      for (const row of selected) Object.assign(row, body);
      if(table==="produk")for(const row of selected)catat("ubah",row);
    }
    if (req.method === "DELETE") {
      if (table === "kategori" && selected.some((k) => produk.some((p) => p.kategori === k.nama))) return fail();
      for (const row of selected) rows.splice(rows.indexOf(row), 1);
      if(table==="produk")for(const row of selected)catat("hapus",row);
    }
    const order=url.searchParams.get("order");
    if(order)selected.sort((a,b)=>{for(const expr of order.split(",")){const[col,dir]=expr.split(".");const x=a[col],y=b[col];const cmp=x<y?-1:x>y?1:0;if(cmp)return dir==="desc"?-cmp:cmp;}return 0;});
    const total = selected.length;
    const range = req.headers.range?.split("-").map(Number);
    const offset = range?.[0] ?? Number(url.searchParams.get("offset") || 0);
    const limit = range ? range[1] - range[0] + 1 : Number(url.searchParams.get("limit") || total);
    selected = selected.slice(offset, offset + limit);
    if (url.searchParams.get("select")?.includes("produk(nama)")) selected = selected.map((u) => ({ ...u, produk: { nama: produk.find((p) => p.id === u.produk_id)?.nama } }));
    if(url.searchParams.get("select")?.includes("varian("))selected=selected.map((p)=>({...p,varian:varian.filter((v)=>v.produk_id===p.id)}));
    res.setHeader("Content-Range", `0-${Math.max(0,selected.length-1)}/${total}`);
    if (req.method === "HEAD") { res.writeHead(200); return res.end(); }
    return send(req.headers.accept?.includes("vnd.pgrst.object") ? selected[0] ?? null : selected);
  } catch { return send({ message: "fixture failure" }, 500); }
});

try {
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
  const dbUrl = `http://127.0.0.1:${fixture.address().port}`;
  // Hanya port lokal sementara; child tidak mewarisi nilai kredensial Supabase toko.
  app = spawn(process.execPath, ["--import","./scripts/fixtures/gemini-fetch.mjs","node_modules/next/dist/bin/next", "start", "-p", "3004", "-H", "127.0.0.1"], { cwd: process.cwd(), windowsHide: true, env: { ...process.env, SUPABASE_URL: dbUrl, SUPABASE_SECRET_KEY: "fixture-service", SUPABASE_PUBLISHABLE_KEY: "fixture-publishable",GEMINI_API_KEY:"fixture-key",GEMINI_MODEL:"fixture-model" }, stdio: ["ignore", "pipe", "pipe"] });
  app.stdout.on("data", (chunk) => { logs += chunk; }); app.stderr.on("data", (chunk) => { logs += chunk; });
  const base = "http://127.0.0.1:3004";
  let ready = false;
  for (let i=0; i<100; i++) { try { const res = await fetch(`${base}/tentang`); if (res.ok) { ready = true; break; } } catch {} await delay(100); }
  assert.ok(ready, "Next.js tidak siap");
  const session = { access_token: jwt, refresh_token: "fixture-refresh", expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: "bearer", user };
  const cookie = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  let visitorCookie="";
  async function action(nama, args, path = "/admin", login = true) {
    const entry = Object.entries(manifest.node).find(([, value]) => value.exportedName === nama);
    assert.ok(entry, `Server Action ${nama} tidak ditemukan`);
    const body = await encodeReply(args);
    const headers = { "Next-Action": entry[0], Origin: base }; headers.Cookie=[login?cookie:"",visitorCookie].filter(Boolean).join("; ");
    if (typeof body === "string") headers["Content-Type"] = "text/plain;charset=UTF-8";
    const res = await fetch(base+path, { method: "POST", headers, body, redirect: "manual" });
    const ai=res.headers.getSetCookie().find((c)=>c.startsWith("beanstory-ai="));if(ai)visitorCookie=ai.split(";")[0];
    return { res, text: await res.text() };
  }
  const fd = (values) => { const form = new FormData(); for (const [k,v] of Object.entries(values)) form.set(k,v); return form; };
  // Header nyata dari build Production, termasuk nonce yang dipakai tag HTML.
  let previousNonce;
  for (const path of ["/", "/produk/1", "/admin/login", "/halaman-tidak-ada", "/admin"]) {
    const response = await fetch(base+path, { redirect: "manual", headers: { "x-nonce": "nonce-palsu" } });
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
    assert.equal(response.headers.get("x-frame-options"), "DENY", path);
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", path);
    const csp = response.headers.get("content-security-policy");
    assert.match(csp, /frame-ancestors 'none'/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce && nonce !== "nonce-palsu" && nonce !== previousNonce, path);
    previousNonce = nonce;
    const document = await response.text();
    if (response.status !== 307) {
      const scripts = [...document.matchAll(/<script\b([^>]*)>/g)];
      assert.ok(scripts.length, path);
      for (const [, attributes] of scripts) assert.ok(attributes.includes(`nonce="${nonce}"`), `${path}: skrip tanpa nonce`);
    }
  }
  for (const path of ["/offline.html", "/offline.css", "/sw.js"]) {
    const response = await fetch(base+path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("content-security-policy"));
  }
  for (const path of ["/admin", "/admin/kategori", "/admin/ulasan", "/admin/produk/ekspor"]) assert.equal((await fetch(base+path, { redirect: "manual" })).status, 307);
  let html = await (await fetch(base+"/")).text(); assert.ok(html.includes("Kopi HTTP")); assert.ok(!html.includes("RAHASIA NONAKTIF"));
  let res = await fetch(base+"/produk/1"); html = await res.text(); assert.equal(res.status,200); assert.match(html, /property="og:title" content="Kopi HTTP"/); assert.match(html, /rel="canonical" href="https:\/\/beanstory.vercel.app\/produk\/1"/);
  for (const path of ["/produk/3", "/produk/999", "/bandingkan?ids=1,3", "/bandingkan?ids=1,1"]) assert.equal((await fetch(base+path)).status,404,path);
  html = await (await fetch(base+"/bandingkan?ids=1,2")).text(); assert.ok(html.includes("Kopi HTTP") && html.includes("Teh HTTP"));
  html = await (await fetch(base+"/sitemap.xml")).text(); assert.ok(html.includes("/produk/1")); assert.ok(!html.includes("/produk/3"));
  res = await fetch(base+"/api/produk/seleksi", { method:"POST", body:JSON.stringify({ids:["1","3"]}) }); assert.deepEqual((await res.json()).produk.map((p)=>p.id),[1]);
  html = await (await fetch(base+"/admin", {headers:{Cookie:cookie}})).text(); assert.ok(html.includes("RAHASIA NONAKTIF")); assert.match(html,/Seluruh produk:/); assert.ok(html.includes("Ekspor CSV")); assert.ok(html.includes("Belum ada klik pesan WhatsApp."));
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
  await action("kirimUlasan", ["1",{},fd({nama:"Pembeli kedua",rating:"2",komentar:"Ulasan kedua HTTP",website:""})],"/produk/1",false);
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("3.0 / 5 dari 2 ulasan"));
  await action("moderasiUlasan", [String(ulasan[0].id),"sembunyikan",{},fd({})],"/admin/ulasan"); assert.equal(ulasan[0].terlihat,false);
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("2.0 / 5 dari 1 ulasan")); assert.ok(!html.includes("Ulasan HTTP bagus"));
  await action("moderasiUlasan", [String(ulasan[0].id),"tampilkan",{},fd({})],"/admin/ulasan"); assert.equal(ulasan[0].terlihat,true);
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("3.0 / 5 dari 2 ulasan"));
  await action("moderasiUlasan", [String(ulasan[1].id),"hapus",{},fd({})],"/admin/ulasan");
  html=await (await fetch(base+"/produk/1")).text(); assert.ok(html.includes("4.0 / 5 dari 1 ulasan")); assert.ok(!html.includes("Ulasan kedua HTTP"));
  res=await fetch(base+"/api/klik-whatsapp",{method:"POST",headers:{Origin:base},body:JSON.stringify({ids:["1","1","2"]})}); assert.equal(res.status,204); assert.equal(klik.length,2); assert.deepEqual(Object.keys(klik[0]),["produk_id","created_at"]);
  await action("ubahStatusProduk", [String(baru.id),false,{},fd({})]); assert.equal(baru.aktif,false); assert.equal((await fetch(base+`/produk/${baru.id}`)).status,404);
  res=await fetch(base+"/admin/produk/ekspor",{headers:{Cookie:cookie}}); assert.equal(res.status,200); const bytes=new Uint8Array(await res.arrayBuffer()); assert.deepEqual(Array.from(bytes.slice(0,3)),[239,187,191]); assert.ok(new TextDecoder().decode(bytes).includes("RAHASIA NONAKTIF"));
  await action("hapusProduk", [String(baru.id),null,fd({})]); assert.ok(!produk.includes(baru)); assert.equal((await fetch(base+`/produk/${baru.id}`)).status,404);
  for (const aksi of ["tambah", "ubah", "hapus"]) {
    const events = log_admin.filter((log) => log.produk_id === baru.id && log.aksi === aksi);
    assert.ok(events.length, `Log ${aksi} harus tersedia setelah CRUD`);
    assert.ok(events.every((log) => log.admin_id === user.id && log.pelaku === user.email && Number.isFinite(Date.parse(log.created_at))));
  }
  // US-41–US-50: alur baru melalui Server Action, SSR, dan API sebenarnya.
  for(const path of["/admin/banner","/admin/pengaturan","/admin/akun","/admin/aktivitas","/admin/produk/impor","/admin/produk/1/varian"])assert.equal((await fetch(base+path,{redirect:"manual"})).status,307,path);
  html=await(await fetch(base+"/admin",{headers:{Cookie:cookie}})).text();assert.ok(html.replace(/<!--[\s\S]*?-->/g,"").includes("1 klik"));
  result=await action("simpanToko",[{},fd({nama:"Toko HTTP Baru",tagline:"Tagline HTTP",nomor_whatsapp:"628999000111",alamat:"Alamat HTTP",jam_buka:"09.00–18.00"})],"/admin/pengaturan");assert.ok(result.text.includes("berhasil disimpan"));
  html=await(await fetch(base+"/tentang")).text();assert.ok(html.includes("Toko HTTP Baru"));assert.ok(html.includes("Alamat HTTP"));
  html=await(await fetch(base+"/produk/1")).text();assert.ok(html.includes("https://wa.me/628999000111"));
  result=await action("simpanBanner",[{},fd({judul:"Promo HTTP Aktif",teks:"Promo uji",gambar:"/produk/kopi.svg",tautan:"/produk/1",aktif:"true"})],"/admin/banner");assert.ok(result.text.includes("berhasil disimpan"));
  html=await(await fetch(base+"/")).text();assert.ok(html.includes("Promo HTTP Aktif"));
  await action("simpanBanner",[{},fd({judul:"Promo HTTP Aktif",aktif:"false"})],"/admin/banner");html=await(await fetch(base+"/")).text();assert.ok(!html.includes("Promo HTTP Aktif"));
  result=await action("tambahAdmin",[{},fd({email:"peer-fixture@example.invalid",password:"fixture-password-123"})],"/admin/akun");assert.ok(result.text.includes("Admin berhasil ditambahkan"));const akun=authUsers.find((u)=>u.id!==user.id);assert.ok(akun);assert.ok(admin_toko.some((a)=>a.id===akun.id&&a.aktif));
  result=await action("kelolaAdmin",[user.id,"hapus",{},fd({})],"/admin/akun");assert.ok(result.text.includes("akun sendiri"));assert.ok(authUsers.includes(user));
  await action("kelolaAdmin",[akun.id,"nonaktifkan",{},fd({})],"/admin/akun");assert.equal(admin_toko.find((a)=>a.id===akun.id).aktif,false);
  const peerJwt=[jwt.split(".")[0],Buffer.from(JSON.stringify({sub:akun.id,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600})).toString("base64url"),jwt.split(".")[2]].join(".");
  const peerCookie=`sb-127-auth-token=base64-${Buffer.from(JSON.stringify({...session,access_token:peerJwt,user:akun})).toString("base64url")}`;
  res=await fetch(base+"/admin",{headers:{Cookie:peerCookie},redirect:"manual"});assert.equal(res.status,307);assert.match(res.headers.get("location"),/inactive/);
  await action("kelolaAdmin",[akun.id,"aktifkan",{},fd({})],"/admin/akun");assert.equal(admin_toko.find((a)=>a.id===akun.id).aktif,true);
  await action("kelolaAdmin",[akun.id,"hapus",{},fd({})],"/admin/akun");assert.ok(!authUsers.includes(akun));
  const csv=fd({});csv.set("csv",new Blob(['nama,harga,kategori\n"Impor, HTTP",12000,Minuman baru\nTidak valid,0,\nImpor kedua,13000,']),"uji.csv");
  result=await action("imporProduk",[{},csv],"/admin/produk/impor");assert.ok(result.text.includes("2 produk berhasil diimpor"));assert.ok(produk.some((p)=>p.nama==="Impor, HTTP"));
  await action("geserProduk",["2",-1,{},fd({})]);assert.equal(produk.find((p)=>p.id===2).urutan,1);
  html=await(await fetch(base+"/")).text();assert.ok(html.indexOf('href="/produk/2"')<html.indexOf('href="/produk/1"'));
  html=await(await fetch(base+"/admin/aktivitas",{headers:{Cookie:cookie}})).text();assert.ok(html.includes("fixture@example.invalid"));assert.ok(html.includes("Impor, HTTP"));
  result=await action("simpanVarian",["1",null,{},fd({nama:"250 g HTTP",harga:"32000"})],"/admin/produk/1/varian");assert.ok(result.text.includes("Varian berhasil disimpan"));const ukuran=varian[0];assert.ok(ukuran);
  html=await(await fetch(base+"/produk/1")).text();assert.ok(html.includes("250 g HTTP"));
  res=await fetch(base+"/api/produk/seleksi",{method:"POST",body:JSON.stringify({ids:["1"]})});let payload=await res.json();assert.equal(payload.produk[0].varian[0].harga,32000);assert.equal(payload.toko.nomorWhatsApp,"628999000111");
  await action("simpanVarian",["1",String(ukuran.id),{},fd({nama:"250 g HTTP",harga:"34000"})],"/admin/produk/1/varian");assert.equal(varian[0].harga,34000);
  await action("hapusVarian",["1",String(ukuran.id),{},fd({})],"/admin/produk/1/varian");assert.equal(varian.length,0);
  res=await fetch(base+"/kategori/minuman");assert.equal(res.status,200);html=await res.text();assert.ok(html.includes("Minuman baru"));assert.ok(!html.includes("RAHASIA NONAKTIF"));assert.equal((await fetch(base+"/kategori/tidak-ada")).status,404);
  html=await(await fetch(base+"/sitemap.xml")).text();assert.ok(html.includes("/kategori/minuman"));
  result=await action("tanyaProduk",["1",{},fd({pertanyaan:"Berapa harga?"})],"/produk/1",false);assert.ok(result.text.includes("Harga dasar yang berlaku"));assert.ok(visitorCookie);
  for(let i=0;i<4;i++)await action("tanyaProduk",["1",{},fd({pertanyaan:"Berapa harga?"})],"/produk/1",false);
  result=await action("tanyaProduk",["1",{},fd({pertanyaan:"Berapa harga?"})],"/produk/1",false);assert.ok(result.text.includes("Batas kiriman AI tercapai"));
  // US-41: >5 kandidat, klik berulang, serta nilai seri dengan pemutus ID.
  const rankingClicks = [3,8,8,7,6,5,4];
  for (let i=0; i<rankingClicks.length; i++) {
    const p = { ...produk[0], id: 800+i, nama: `Ranking HTTP ${i}` };
    produk.push(p);
    for (let j=0; j<rankingClicks[i]; j++) klik.push({ produk_id: p.id, created_at: new Date().toISOString() });
  }
  html=await(await fetch(base+"/admin",{headers:{Cookie:cookie}})).text();
  const top = html.match(/<section aria-label="Produk terlaris"[\s\S]*?<\/section>/)?.[0].replace(/<!--[\s\S]*?-->/g, "");
  assert.ok(top);
  assert.equal([...top.matchAll(/<li\b/g)].length, 5);
  assert.deepEqual([...top.matchAll(/<span>(Ranking HTTP \d)<\/span>/g)].map((m)=>m[1]), [1,2,3,4,5].map((i)=>`Ranking HTTP ${i}`));
  assert.deepEqual([...top.matchAll(/<strong>(\d+) klik<\/strong>/g)].map((m)=>Number(m[1])), [8,8,7,6,5]);
  // US-45: >50 log, urutan waktu/ID stabil, pelaku/aksi/waktu ditampilkan.
  for (let i=0; i<55; i++) log_admin.push({ id: 90000+i, admin_id: user.id, pelaku: user.email, aksi: "ubah", produk_id: 1, nama_produk: `Log batas ${i}`, created_at: "2030-01-01T01:00:00Z" });
  html=await(await fetch(base+"/admin/aktivitas",{headers:{Cookie:cookie}})).text();
  const activity = html.match(/<ol aria-label="Log aktivitas"[\s\S]*?<\/ol>/)?.[0].replace(/<!--[\s\S]*?-->/g, "");
  assert.ok(activity);
  assert.equal([...activity.matchAll(/<li\b/g)].length, 50);
  assert.deepEqual([...activity.matchAll(/Log batas (\d+) /g)].map((m)=>Number(m[1])), Array.from({length:50},(_,i)=>54-i));
  assert.ok(activity.includes(user.email)); assert.match(activity, /datetime="2030-01-01T01:00:00Z"/i);
  console.log("HTTP OK US-21–US-50: regresi, ranking tepat 5 dari 7 kandidat, klik/nilai seri, log CRUD dan batas 50 dari 55, banner, pengaturan/WhatsApp, akun, impor, urutan, varian, kategori, AI/kuota. Supabase/Auth/Gemini pengganti; SQL/RLS asli dan UI browser belum diuji.");
} catch (error) {
  console.error(error); console.error(logs.slice(-6000)); process.exitCode=1;
} finally {
  app?.kill(); fixture.closeAllConnections(); await new Promise((resolve)=>fixture.close(resolve));
}
