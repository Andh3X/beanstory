import {bacaFormProduk} from "@/lib/produk";

export function parseCsv(teks){
  const records=[];let values=[],value="",quoted=false,closed=false,line=1,start=1;
  teks=teks.replace(/^\uFEFF/,"");
  function field(){values.push(value);value="";closed=false;}
  function row(){field();if(values.some((v)=>v.trim()))records.push({baris:start,values});values=[];start=line+1;}
  for(let i=0;i<teks.length;i++){
    const c=teks[i];
    if(quoted){if(c==='"'){if(teks[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else{value+=c;if(c==='\n')line++;}continue;}
    if(c==='"'){if(value||closed)throw new Error(`Kutip tidak valid pada baris ${line}.`);quoted=true;}
    else if(c===',')field();
    else if(c==='\n'||c==='\r'){if(c==='\r'&&teks[i+1]==='\n')i++;row();line++;}
    else{if(closed)throw new Error(`Teks setelah kutip penutup pada baris ${line}.`);value+=c;}
  }
  if(quoted)throw new Error(`Kutip belum ditutup pada baris ${start}.`);
  if(value||values.length||closed)row();
  if(!records.length)throw new Error("CSV kosong.");
  const headers=records.shift().values.map((v)=>v.trim());
  if(new Set(headers).size!==headers.length||headers.some((v)=>!v)||!["nama","harga"].every((v)=>headers.includes(v)))throw new Error("Header CSV wajib memuat nama dan harga, tanpa nama kolom kosong/duplikat.");
  if(records.length>500)throw new Error("Maksimal 500 baris produk per impor.");
  return {headers,records};
}

export function validasiImpor(teks,kategori){
  const {headers,records}=parseCsv(teks);const valid=[],gagal=[];
  const kolom=["nama","harga","kategori","foto_url","deskripsi","foto_tambahan","stok","harga_diskon","badge","aktif"];
  for(const record of records){
    if(record.values.length!==headers.length){gagal.push({baris:record.baris,pesan:"Jumlah kolom berbeda dari header."});continue;}
    const form=new FormData();for(const key of kolom){const i=headers.indexOf(key);if(i>=0)form.set(key,record.values[i]);}
    const hasil=bacaFormProduk(form);
    if(hasil.error)gagal.push({baris:record.baris,pesan:hasil.error});
    else if(hasil.data.kategori&&!kategori.includes(hasil.data.kategori))gagal.push({baris:record.baris,pesan:"Kategori belum tersedia. Buat kategori terlebih dahulu."});
    else valid.push({baris:record.baris,data:hasil.data});
  }
  return {valid,gagal};
}
