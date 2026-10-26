// Hanya dimuat oleh proses uji HTTP. Tidak dipakai aplikasi/deployment.
const asli=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 if((input?.url||String(input)).startsWith("https://generativelanguage.googleapis.com/")){
  const body=JSON.parse(options?.body||await input.clone().text());const request=JSON.parse(body.contents[0].parts[0].text);
  const fakta=request.pertanyaan?.toLowerCase().includes("harga")?["harga"]:[];
  return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify({fakta,tidak_tersedia:!fakta.length})}]}}]});
 }
 return asli(input,options);
};
