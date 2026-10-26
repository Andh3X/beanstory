import test from"node:test";
import assert from"node:assert/strict";
import{createHash,createHmac,randomUUID}from"node:crypto";
import{loadSource}from"./helpers.mjs";
const form=(values={})=>{const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f;};
const owner="00000000-0000-4000-8000-000000000001",peer="00000000-0000-4000-8000-000000000002";
const setting={nama:"Toko uji",tagline:"Katalog",nomor_whatsapp:"6281234567890",alamat:"Solo",jam_buka:"08.00–17.00"};

test("pengaturan toko memvalidasi nomor internasional dan banner menolak URL berbahaya",async()=>{
 const mod=await loadSource("lib/pengaturan.js");
 assert.equal(mod.validasiToko(form({...setting,nomor_whatsapp:"+62 812-3456-7890",evil:"x"})).data.nomor_whatsapp,setting.nomor_whatsapp);
 assert.equal(mod.validasiToko(form({...setting,evil:"x"})).data.evil,undefined);
 for(const nomor of["081234567890","123","628123456789012345","62abc"])assert.ok(mod.validasiToko(form({...setting,nomor_whatsapp:nomor})).fieldErrors.nomor_whatsapp);
 for(const tautan of["javascript:alert(1)","//evil.test/x","https://user:password@host.test"]){assert.ok(mod.validasiBanner(form({judul:"Promo",tautan})).fieldErrors.tautan);}
 assert.equal(mod.validasiBanner(form({judul:"Promo",tautan:"/produk/1",aktif:"false"})).data.aktif,false);
});
test("pembacaan pengaturan memakai database atau cadangan saat kosong/error",async()=>{
 for(const mode of["kosong","gagal","valid"]){const mod=await loadSource("lib/toko-server.js",{mocks:{react:{cache:(f)=>f},"@/lib/toko":{toko:{nama:"Cadangan"}},"@/lib/supabase/server":{createServerClient:()=>({from:()=>({select(){return this;},eq(){return this;},abortSignal(){return this;},maybeSingle:async()=>mode==="valid"?{data:setting}:mode==="gagal"?{error:new Error("rahasia")}: {data:null}})})}}});const toko=await mod.ambilToko();assert.equal(toko.nama,mode==="valid"?setting.nama:"Cadangan");if(mode==="valid")assert.equal(toko.nomorWhatsApp,setting.nomor_whatsapp);}
});
test("aksi pengaturan/banner hanya mengumumkan sukses setelah upsert berhasil",async()=>{
 let gagal=false;const writes=[],cache=[];
 const db={from:(table)=>({upsert(data){writes.push([table,data]);return this;},select(){return this;},maybeSingle:async()=>gagal?{error:new Error("private")}: {data:{id:1}}})};
 const mod=await loadSource("app/admin/toko-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>db},"next/cache":{revalidatePath:(p)=>cache.push(p)}}});
 assert.ok((await mod.simpanToko({},form(setting))).success);assert.equal(writes[0][0],"pengaturan_toko");
 assert.ok((await mod.simpanBanner({},form({judul:"Promo",aktif:"true"}))).success);
 const count=cache.length;gagal=true;assert.ok((await mod.simpanBanner({},form({judul:"Promo"}))).error);assert.equal(cache.length,count);
});
test("admin nonaktif dan kegagalan registry ditolak setelah getUser",async()=>{
 for(const status of[{data:false},{error:new Error("private")},{data:true}]){
  const calls=[];const db={auth:{getUser:async()=>{calls.push("getUser");return{data:{user:{id:owner}}};}},rpc:async(name)=>{calls.push(name);return status;}};
  const mod=await loadSource("lib/supabase/admin.js",{mocks:{"./session":{createSessionClient:async()=>db},"next/navigation":{redirect:(location)=>{throw Object.assign(new Error("redirect"),{location});}}}});
  if(status.data===true)assert.equal(await mod.requireAdmin(),db);else await assert.rejects(()=>mod.requireAdmin(),(e)=>e.location.includes(status.error?"service":"inactive"));
  assert.deepEqual(calls,["getUser","admin_aktif"]);
 }
});
test("seluruh aksi admin baru menolak sesi sebelum membaca file atau memakai service role",async()=>{
 const mocks={"@/lib/supabase/admin":{requireAdmin:async()=>{throw new Error("LOGIN_REQUIRED");}},"@/lib/supabase/server":{createServerClient:()=>assert.fail("Tidak boleh service role")},"next/cache":{revalidatePath:()=>assert.fail("Tidak boleh cache")}};
 for(const[file,actions]of[["app/admin/toko-actions.js",[["simpanToko",[{},form(setting)]],["simpanBanner",[{},form({})]]]],["app/admin/akun-actions.js",[["tambahAdmin",[{},form({})]],["kelolaAdmin",[peer,"hapus",{},form({})]]]],["app/admin/impor-actions.js",[["imporProduk",[{},form({})]]]],["app/admin/urutan-actions.js",[["geserProduk",["1",1,{},form({})]]]],["app/admin/varian-actions.js",[["simpanVarian",["1",null,{},form({})]],["hapusVarian",["1","2",{},form({})]]]]]){
  const mod=await loadSource(file,{mocks,globals:{FormData}});for(const[name,args]of actions)await assert.rejects(()=>mod[name](...args),/LOGIN_REQUIRED/);
 }
});
test("akun sendiri dilindungi; akses peer dinonaktifkan sebelum operasi Auth",async()=>{
 const calls=[];let gagal=false;
 const db={auth:{getUser:async()=>({data:{user:{id:owner}}})},rpc:async(name,args)=>{calls.push([name,args.p_aktif]);return{data:true};}};
 const server={auth:{admin:{deleteUser:async()=>{calls.push(["delete"]);return gagal?{error:new Error()}:{};},updateUserById:async(_id,args)=>{calls.push(["ban",args.ban_duration]);return{};}}}};
 const mod=await loadSource("app/admin/akun-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>db},"@/lib/supabase/server":{createServerClient:()=>server},"next/cache":{revalidatePath:()=>{}}}});
 assert.ok((await mod.kelolaAdmin(owner,"hapus",{},form())).error);assert.equal(calls.length,0);
 assert.ok((await mod.kelolaAdmin(peer,"nonaktifkan",{},form())).success);assert.deepEqual(calls,[["status_admin",false],["ban","876000h"]]);
 calls.length=0;gagal=true;assert.ok((await mod.kelolaAdmin(peer,"hapus",{},form())).error);assert.deepEqual(calls,[["status_admin",false],["delete"]]);
 calls.length=0;assert.ok((await mod.kelolaAdmin(peer,"aktifkan",{},form())).success);assert.deepEqual(calls,[["ban","none"],["status_admin",true]]);
});
test("pembuatan akun Auth dibatalkan jika registry gagal disimpan",async()=>{
 const calls=[];
 const server={auth:{admin:{createUser:async(args)=>{calls.push(["create",args.email_confirm]);return{data:{user:{id:peer}}};},deleteUser:async(id)=>{calls.push(["delete",id]);return{};}}},from:()=>({insert(){return this;},select(){return this;},maybeSingle:async()=>({error:new Error()})})};
 const mod=await loadSource("app/admin/akun-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>({})},"@/lib/supabase/server":{createServerClient:()=>server},"next/cache":{revalidatePath:()=>assert.fail("Tidak sukses")}}});
 assert.ok((await mod.tambahAdmin({},form({email:"fixture@example.invalid",password:"sandi-uji-acak"}))).error);assert.deepEqual(calls,[["create",true],["delete",peer]]);
 calls.length=0;assert.ok((await mod.tambahAdmin({},form({email:"salah",password:"x"}))).error);assert.equal(calls.length,0);
});
const importer=await loadSource("lib/impor-csv.js",{globals:{FormData}});
test("CSV membaca BOM, kutip/koma/baris baru serta nomor baris fisik",()=>{
 const text='\uFEFFnama,harga,deskripsi\r\n"Kopi, A",25000,"Baris satu\r\nBaris dua ""enak"""\r\nTeh,0,gagal';
 const hasil=importer.validasiImpor(text,[]);assert.equal(hasil.valid.length,1);assert.equal(hasil.valid[0].data.nama,"Kopi, A");assert.match(hasil.valid[0].data.deskripsi,/"enak"/);assert.equal(hasil.gagal[0].baris,4);
});
test("CSV menolak header/format/batas dan mengabaikan kolom identitas",()=>{
 for(const text of["",'nama,nama,harga\nx,x,1','judul,harga\nx,1','nama,harga\n"belum,1','nama,harga\nx"y,1',`nama,harga\n${Array(501).fill("x,1").join("\n")}`])assert.throws(()=>importer.parseCsv(text));
 const hasil=importer.validasiImpor("nama,harga,kategori,id,created_at\nKopi,1,Tak ada,999,palsu\nTeh,2,,555,palsu",[]);assert.equal(hasil.gagal.length,1);assert.equal(hasil.valid[0].data.id,undefined);assert.equal(hasil.valid[0].data.created_at,undefined);
});
test("impor menyimpan semua baris valid dalam satu batch dan melaporkan kegagalan database",async()=>{
 let gagal=false;const writes=[];
 const db={from:(table)=>{assert.equal(table,"produk");return{insert(rows){writes.push(rows);return this;},select:async()=>gagal?{error:new Error()}: {data:writes.at(-1).map((_,i)=>({id:i+1}))}};}};
 const mod=await loadSource("app/admin/impor-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>db},"@/lib/katalog":{ambilKategori:async()=>[]},"next/cache":{revalidatePath:()=>{}}},globals:{FormData}});
 const fd=()=>{const f=form();f.set("csv",new Blob(["nama,harga\nKopi,10\nRusak,-1\nTeh,20"]),"uji.csv");return f;};
 let hasil=await mod.imporProduk({},fd());assert.equal(hasil.berhasil,2);assert.equal(hasil.gagal.length,1);assert.equal(writes.length,1);assert.equal(writes[0].length,2);
 gagal=true;hasil=await mod.imporProduk({},fd());assert.equal(hasil.berhasil,0);assert.equal(hasil.gagal.length,3);assert.equal(hasil.success,undefined);
});
test("urutan toko menjadi default dan tautan kategori mempertahankan path/filter",async()=>{
 const mod=await loadSource("lib/katalog.js");const calls=[];
 const db={from:()=>({select(_c,opts){this.head=opts?.head;return this;},eq(){return this;},order(key){calls.push(key);return this;},range(){return this;},then(resolve){return Promise.resolve({count:2,data:this.head?null:[]}).then(resolve);}})};
 const opsi=mod.opsiKatalog();assert.equal(opsi.urutan,"pilihan");await mod.ambilHalamanKatalog(db,opsi);assert.deepEqual(calls,["urutan","id"]);assert.match(mod.linkKatalog(opsi,2,"/kategori/kopi"),/^\/kategori\/kopi\?/);
});
test("aksi urutan memeriksa arah/ID dan kegagalan RPC tidak merevalidasi",async()=>{
 const calls=[];let gagal=false;const mod=await loadSource("app/admin/urutan-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>({rpc:async(name,args)=>{calls.push([name,args]);return gagal?{error:new Error()}:{data:true};}})},"next/cache":{revalidatePath:()=>calls.push("cache")}}});
 assert.ok((await mod.geserProduk("1",9,{},form())).error);assert.equal(calls.length,0);assert.ok((await mod.geserProduk("1",-1,{},form())).success);assert.equal(calls[0][0],"geser_produk");calls.length=0;gagal=true;assert.ok((await mod.geserProduk("1",1,{},form())).error);assert.equal(calls.length,1);
});
test("varian memakai harga tersendiri, pesan/keranjang menyebut ukuran, stok dibagi",async()=>{
 const p=await loadSource("lib/pilihan.js"),pesan=await loadSource("lib/pemesanan.js");
 const produk={id:1,nama:"Kopi",harga:100,harga_diskon:50,aktif:true,stok:5,varian:[{id:10,nama:"250 g",harga:80},{id:11,nama:"500 g",harga:140}]};
 let data=p.tambahPilihan(p.kosong(),"keranjang","1",2,"10").data;data=p.tambahPilihan(data,"keranjang","1",1,"11").data;assert.equal(data.keranjang.length,2);
 let hasil=p.hitungKeranjang(data.keranjang,[produk]);assert.equal(hasil.total,300);assert.equal(hasil.bolehPesan,true);assert.match(p.pesanKeranjang(hasil),/500 g/);assert.match(pesan.buatPesanWhatsApp(produk,"2","10"),/250 g/);assert.match(pesan.buatPesanWhatsApp(produk,"2","10"),/160/);
 assert.equal(pesan.buatPesanWhatsApp(produk,"1"),null);assert.equal(pesan.buatPesanWhatsApp(produk,"1","999"),null);
 hasil=p.hitungKeranjang([{id:"1",varian_id:"10",jumlah:3},{id:"1",varian_id:"11",jumlah:3}],[produk]);assert.equal(hasil.bolehPesan,false);
 assert.equal(p.hitungKeranjang([{id:"1",jumlah:1}],[produk]).bolehPesan,false);
 assert.equal(p.bacaPilihan(JSON.stringify(data)).keranjang[0].varian_id,"10");
 const lama=JSON.stringify({...p.kosong(),keranjang:[{id:"1",jumlah:2}]});assert.equal(p.muatPilihan(()=>({getItem:(key)=>key===p.KUNCI_LAMA?lama:null})).data.keranjang.length,1);
});
test("aksi ubah/hapus varian membatasi produk dan ID tujuan",async()=>{
 const calls=[];const db={from:(table)=>({select(){return this;},eq(k,v){calls.push([table,k,v]);return this;},update(data){assert.deepEqual(Object.keys(data).sort(),["harga","nama"]);return this;},delete(){return this;},maybeSingle:async()=>({data:{id:10}})})};
 const mod=await loadSource("app/admin/varian-actions.js",{mocks:{"@/lib/supabase/admin":{requireAdmin:async()=>db},"next/cache":{revalidatePath:()=>{}}}});
 assert.ok((await mod.simpanVarian("1","10",{},form({nama:"250 g",harga:"1000",produk_id:"999"}))).success);assert.ok(calls.some((r)=>r[0]==="varian"&&r[1]==="produk_id"&&r[2]==="1"));
 calls.length=0;assert.ok((await mod.hapusVarian("1","10",{},form())).success);assert.deepEqual(calls,[["varian","produk_id","1"],["varian","id","10"]]);
 assert.ok((await mod.simpanVarian("1",null,{},form({nama:"",harga:"0"}))).fieldErrors.harga);
});
test("slug kategori invalid tidak query; kategori tak ditemukan kembali null",async()=>{
 const calls=[];const db={from:()=>({select(){return this;},eq(k,v){calls.push([k,v]);return this;},maybeSingle:async()=>({data:null})})};
 const mod=await loadSource("lib/kategori-server.js",{mocks:{react:{cache:(f)=>f},"@/lib/supabase/server":{createServerClient:()=>db}}});
 assert.equal(await mod.ambilKategoriSlug("../rahasia"),null);assert.equal(calls.length,0);assert.equal(await mod.ambilKategoriSlug("minuman"),null);assert.deepEqual(calls,[["slug","minuman"]]);
});
test("AI tidak dapat menyisipkan klaim baru ke jawaban yang dirangkai server",async()=>{
 const mod=await loadSource("lib/asisten.js");const fakta=mod.faktaProduk({nama:"Kopi",harga:25000,stok:null,deskripsi:"Biji kopi sangrai"});
 const jawaban=mod.susunJawaban(JSON.stringify({fakta:["harga"],tidak_tersedia:false,jawaban:"Gratis dan menyembuhkan penyakit"}),fakta);assert.match(jawaban,/25.000/);assert.doesNotMatch(jawaban,/Gratis|penyakit/);
 assert.match(mod.susunJawaban('{"fakta":[],"tidak_tersedia":true}',fakta),/belum tersedia/);
 assert.throws(()=>mod.susunJawaban('{"fakta":["sertifikasi"],"tidak_tersedia":false}',fakta));
});
test("AI server memakai header kunci, timeout, dan menolak hasil/error provider",async()=>{
 let mode="valid",calls=0;const cookies={get:()=>null,set:()=>{}};
 const mod=await loadSource("lib/asisten-server.js",{mocks:{"node:crypto":{createHmac,createHash,randomUUID},"next/headers":{cookies:async()=>cookies},"@/lib/supabase/server":{createServerClient:()=>({rpc:async()=>({data:true})})}},globals:{process:{env:{GEMINI_API_KEY:"fixture-key",GEMINI_MODEL:"fixture-model",SUPABASE_SECRET_KEY:"fixture-secret"}},fetch:async(url,opts)=>{calls++;assert.ok(!url.includes("fixture-key"));assert.equal(opts.headers["x-goog-api-key"],"fixture-key");assert.ok(opts.signal);if(mode==="throw")throw new Error("private");if(mode==="429")return{ok:false,status:429};return{ok:true,json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text:mode==="valid"?'{"fakta":["harga"],"tidak_tersedia":false}':'{"fakta":["palsu"],"tidak_tersedia":false}'}]}}]})};}}});
 assert.match((await mod.jawabPertanyaan({nama:"Kopi",harga:100,stok:1},"Berapa harga?")).jawaban,/100/);
 for(mode of["throw","429","invalid"])assert.ok((await mod.jawabPertanyaan({nama:"Kopi",harga:100},"Berapa harga?")).error);assert.equal(calls,4);
});
test("kuota AI memakai cookie HttpOnly bertanda tangan dan token hash tanpa IP",async()=>{
 const saved=[],rpc=[];
 const mod=await loadSource("lib/asisten-server.js",{mocks:{"node:crypto":{createHmac,createHash,randomUUID},"next/headers":{cookies:async()=>({get:()=>({value:"palsu.tidak-valid"}),set:(...args)=>saved.push(args)})},"@/lib/supabase/server":{createServerClient:()=>({rpc:async(name,args)=>{rpc.push([name,args]);return{data:false};}})}},globals:{process:{env:{SUPABASE_SECRET_KEY:"fixture-secret",NODE_ENV:"production"}}}});
 assert.equal(await mod.ambilKuotaAI(),false);assert.equal(saved[0][2].httpOnly,true);assert.equal(saved[0][2].secure,true);assert.match(rpc[0][1].p_token,/^[a-f0-9]{64}$/);assert.deepEqual(Object.keys(rpc[0][1]),["p_token"]);
});
test("aksi AI menolak input, produk nonaktif/hilang, dan kuota sebelum provider",async()=>{
 let tersedia=true,kuota=false,provider=0;
 const mod=await loadSource("app/produk/asisten-actions.js",{mocks:{"@/lib/produk-server":{ambilProdukPublik:async()=>tersedia?{id:1}:null},"@/lib/asisten-server":{ambilKuotaAI:async()=>kuota,jawabPertanyaan:async()=>{provider++;return{jawaban:"Uji"};}}},globals:{process:{env:{GEMINI_API_KEY:"fixture-key"}}}});
 for(const q of["a","x".repeat(501)])assert.ok((await mod.tanyaProduk("1",{},form({pertanyaan:q}))).error);
 assert.ok((await mod.tanyaProduk("1",{},form({pertanyaan:"Berapa harga?"}))).error);assert.equal(provider,0);kuota=true;tersedia=false;assert.ok((await mod.tanyaProduk("1",{},form({pertanyaan:"Berapa harga?"}))).error);assert.equal(provider,0);tersedia=true;assert.ok((await mod.tanyaProduk("1",{},form({pertanyaan:"Berapa harga?"}))).jawaban);assert.equal(provider,1);
});
