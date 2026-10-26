// Batas mengikuti kolom bigint dan integer pada docs/schema.sql.
export function idProdukValid(id) {
  if (typeof id !== "string" && (typeof id !== "number" || !Number.isSafeInteger(id))) {
    return false;
  }
  const nilai = String(id);
  return /^[1-9]\d{0,18}$/.test(nilai) && BigInt(nilai) <= 9223372036854775807n;
}

export function fotoUrlValid(value) {
  if (typeof value !== "string" || !value || /[\s\\]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function hargaBerlaku(produk) {
  const diskon = produk.harga_diskon;
  return Number.isInteger(diskon) && diskon >= 0 && diskon < produk.harga ? diskon : produk.harga;
}

export function produkHabis(produk) {
  return produk.stok === 0;
}

export function fotoProduk(produk) {
  const tambahan = Array.isArray(produk.foto_tambahan) ? produk.foto_tambahan : [];
  return [...new Set([produk.foto_url, ...tambahan].filter(fotoUrlValid))];
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

  if (nilai.foto_url && !fotoUrlValid(nilai.foto_url)) {
    return { error: "Link foto harus memakai http://, https://, atau path lokal seperti /produk/kopi.svg." };
  }

  const data = {
    nama: nilai.nama,
    harga,
    kategori: nilai.kategori || null,
    foto_url: nilai.foto_url || null,
    deskripsi: nilai.deskripsi || null,
  };

  // Form lama tetap bekerja sebelum migrasi bonus dijalankan.
  for (const nama of ["foto_tambahan", "stok", "harga_diskon", "badge"]) {
    if (!formData.has?.(nama)) continue;
    const isi = formData.get(nama);
    if (typeof isi !== "string") return { error: "Isian galeri, stok, atau promo tidak valid." };
    const teks = isi.trim();
    if (nama === "foto_tambahan") {
      const foto = [...new Set(teks.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
      if (foto.length > 9 || foto.some((url) => !fotoUrlValid(url))) {
        return { error: "Isi maksimal 9 link foto tambahan yang valid, satu link per baris." };
      }
      data.foto_tambahan = foto;
    } else if (nama === "badge") {
      if (teks && !["Baru", "Terlaris"].includes(teks)) return { error: "Label produk tidak valid." };
      data.badge = teks || null;
    } else {
      const angka = teks === "" ? null : Number(teks);
      if (angka !== null && (!/^\d+$/.test(teks) || !Number.isInteger(angka) || angka > 2147483647)) {
        return { error: `${nama === "stok" ? "Stok" : "Harga diskon"} harus berupa bilangan bulat nonnegatif.` };
      }
      if (nama === "harga_diskon" && angka !== null && angka >= harga) {
        return { error: "Harga diskon harus lebih rendah dari harga normal." };
      }
      data[nama] = angka;
    }
  }
  return { data };
}
