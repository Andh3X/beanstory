// Batas mengikuti kolom bigint dan integer pada docs/schema.sql.
export function idProdukValid(id) {
  if (typeof id !== "string" && (typeof id !== "number" || !Number.isSafeInteger(id))) {
    return false;
  }
  const nilai = String(id);
  return /^[1-9]\d{0,18}$/.test(nilai) && BigInt(nilai) <= 9223372036854775807n;
}

export function bacaFormProduk(formData) {
  if (!formData || typeof formData.get !== "function") {
    return { error: "Formulir produk tidak valid. Muat ulang halaman lalu coba lagi." };
  }
  const kolom = ["nama", "harga", "kategori", "foto_url", "deskripsi"];
  const nilai = {};

  for (const nama of kolom) {
    const isi = formData.get(nama);
    if (isi !== null && typeof isi !== "string") {
      return { error: "Isian produk tidak valid. Periksa kembali formulir." };
    }
    nilai[nama] = (isi || "").trim();
  }

  if (!nilai.nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = Number(nilai.harga);
  if (!/^\d+$/.test(nilai.harga) || !Number.isInteger(harga) || harga > 2147483647) {
    return { error: "Harga harus berupa rupiah bulat antara 0 dan 2.147.483.647." };
  }

  if (nilai.foto_url) {
    const lokal = nilai.foto_url.startsWith("/") && !nilai.foto_url.startsWith("//");
    let web = false;
    try {
      web = ["http:", "https:"].includes(new URL(nilai.foto_url).protocol);
    } catch {
      // Link lokal tetap diperbolehkan tanpa harus berupa URL lengkap.
    }
    if (!lokal && !web) {
      return { error: "Link foto harus memakai http://, https://, atau path lokal seperti /produk/kopi.svg." };
    }
  }

  return {
    data: {
      nama: nilai.nama,
      harga,
      kategori: nilai.kategori || null,
      foto_url: nilai.foto_url || null,
      deskripsi: nilai.deskripsi || null,
    },
  };
}
