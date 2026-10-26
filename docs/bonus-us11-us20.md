# Bonus US-11 sampai US-20

Potensi nilai total: 80 poin. Skor ditentukan penilai setelah perubahan diterapkan di Production.

| US | Fitur | Implementasi |
| --- | --- | --- |
| 11 | Filter dan pencarian | Form GET di katalog; pencarian nama dan kategori diproses dalam query server. |
| 12 | Jumlah pesanan | Pilihan 1–99, dibatasi stok jika diisi; pesan WhatsApp berisi jumlah, harga satuan, dan total. |
| 13 | PWA | Manifest, ikon PNG 192/512 dan maskable, ikon Apple, service worker, petunjuk/tombol pemasangan. |
| 14 | Deskripsi AI | Tombol pada form admin memanggil Gemini melalui Server Action setelah verifikasi login. Draf bisa diedit sebelum disimpan. Perlu kunci API. |
| 15 | Urutan produk | Termurah, termahal, terbaru melalui query database, dengan ID sebagai urutan tambahan agar stabil. Urutan harga memakai kolom harga normal. |
| 16 | Paginasi | 12 produk per halaman, hitungan exact dan range database. Filter/urutan tetap ada pada tautan navigasi. |
| 17 | Produk terkait | Maksimal tiga produk dari kategori sama, mengecualikan produk yang sedang dibuka. |
| 18 | Galeri foto | Foto utama + maksimal sembilan link tambahan; pilihan thumbnail pada detail. Perlu migrasi database. |
| 19 | Stok | Stok kosong berarti tidak dibatasi, 0 berarti Habis. Produk habis tidak mempunyai link pesan. Perlu migrasi database. |
| 20 | Harga coret dan badge | Harga diskon lebih rendah dari harga normal; label Baru/Terlaris dipilih di admin. Perlu migrasi database. |

## Aktivasi database US-18–US-20

1. Buka dashboard **Supabase**, pilih proyek yang dipakai aplikasi.
2. Pilih **SQL Editor → New query**.
3. Salin seluruh isi `docs/migrations/001-us18-us20.sql`, lalu klik **Run**.
4. Buka ulang form tambah atau ubah produk di admin. Bagian **Galeri, stok, dan promo** akan muncul ketika keempat kolom tersedia.

Migrasi hanya menambah kolom dan batas validasi. Produk lama tidak dihapus; kolom lama, RLS, serta kebijakan autentikasi tidak diubah. Aman dijalankan ulang. `docs/schema.sql` asli tidak diubah.

Sebelum migrasi, katalog dan CRUD dasar tetap bekerja. Form admin hanya mengirim kolom lama. Fitur galeri/stok/promo tidak dapat dianggap selesai di database sebelum migrasi dijalankan.

## Aktivasi AI US-14

1. Buat kunci Gemini di [Google AI Studio](https://aistudio.google.com/apikey).
2. Tambahkan `GEMINI_API_KEY` beserta nilainya ke `.env.local` untuk pengujian lokal.
3. Pada **Vercel → proyek beanstory → Environment Variables**, tambahkan nama yang sama untuk **Production**. Kunci hanya dibaca server; jangan memakai awalan `NEXT_PUBLIC_` atau memasukkannya ke kode/GitHub.
4. Jika perlu, isi `GEMINI_MODEL` dengan model yang tersedia untuk akun Anda. Default: `gemini-3.5-flash-lite`.
5. Restart server lokal setelah memperbarui `.env.local`; buat deployment baru di Vercel setelah menambah konfigurasi Production.
6. Login sebagai admin, isi nama dan kategori, lalu klik **Buat deskripsi dengan AI**. Periksa draf sebelum menyimpan.

Pemanggilan memakai [Gemini generateContent REST API](https://ai.google.dev/api/generate-content) tanpa paket npm tambahan. Permintaan dibatasi panjang input, timeout 15 detik, dan panjang hasil. Kegagalan layanan/kuota tidak menghalangi pengisian manual. Pemakaian API mengikuti kuota dan pengaturan akun Gemini Anda.

## Pengujian

- Jalankan `npm test` dan `npm run build`.
- Cari nama produk, gabungkan dengan kategori, lalu coba hasil kosong. Pilihan tersimpan di URL.
- Coba termurah/termahal/terbaru. Gunakan lebih dari 12 produk untuk mencoba navigasi beberapa halaman. Periksa bahwa filter tetap aktif saat pindah halaman.
- Buka detail: pastikan produk terkait berkategori sama dan tidak memuat produk saat ini.
- Pilih jumlah 2–3, buka WhatsApp, periksa nama, jumlah, harga satuan, dan total. Jumlah kosong, negatif, pecahan, atau melebihi stok tidak menghasilkan link pesan.
- Setelah migrasi: tambahkan dua foto, coba seluruh thumbnail, kemudian coba produk dengan satu/tanpa foto.
- Isi stok 0: kartu/detail menampilkan Habis dan pemesanan tidak tersedia. Ubah stok menjadi positif lalu coba lagi.
- Isi harga normal, harga diskon yang lebih rendah, dan badge. Periksa kartu, detail, dan pesan WhatsApp memakai harga diskon. Harga diskon yang sama/lebih tinggi ditolak.
- Uji AI setelah login dan setelah kunci disetel. Tanpa kunci/kuota/koneksi, error harus jelas dan isian form tetap ada.
- Pada Chrome HP dengan HTTPS, gunakan **Pasang aplikasi** jika muncul atau menu browser. Pada Safari iPhone, gunakan **Bagikan → Tambahkan ke Layar Utama**. Tutup/buka dari ikon layar utama.
- Setelah pernah membuka aplikasi online, putuskan internet dan buka katalog: tampil halaman koneksi, bukan harga/stok lama. Halaman admin dan Server Action tidak dicache.
- Periksa lebar sekitar 390 px. Ulangi pada domain Vercel setelah deployment selesai, lalu kirim ulang karya.

## Hasil verifikasi agent

- 29 pengujian otomatis lulus, termasuk regresi US-07–US-10, metadata galeri/stok/promo, query filter/urutan/range, pesan WhatsApp, autentikasi AI, error layanan AI, manifest/ikon, serta pengecualian cache admin/RSC/POST.
- Build Production berhasil. Peringatan lockfile folder induk sudah ada sebelumnya dan tidak menghalangi build.
- HTTP lokal dengan Supabase sebenarnya: hasil pencarian/kategori/urutan cocok dengan data pembanding, halaman berlebih diarahkan secara tampilan ke halaman terakhir, detail serta produk terkait benar, ID invalid/tidak ditemukan 404. Manifest, ikon, service worker, dan offline HTML merespons 200; header service worker melarang cache. POST ke form admin tanpa sesi dialihkan ke login (307).
- Saat diperiksa, kolom galeri/stok/promo belum tersedia (kode database 42703), kunci Gemini belum disetel, dan tidak ada browser/sesi admin terhubung. SQL live, generasi Gemini live, interaksi thumbnail/jumlah, pemasangan PWA, serta tampilan HP belum diverifikasi. Pengujian database lanjutan dan AI memakai pengganti layanan, bukan klaim keberhasilan live.

## File yang diubah atau ditambahkan

- Katalog/detail: `app/page.jsx`, `app/produk/[id]/page.jsx`, `lib/katalog.js`, `lib/pemesanan.js`, `lib/produk.js`.
- Tampilan produk: `components/KartuProduk.jsx`, `HargaProduk.jsx`, `LabelProduk.jsx`, `GaleriProduk.jsx`, `TombolWhatsApp.jsx`.
- Admin dan AI: `components/FormProduk.jsx`, `app/admin/produk/baru/page.jsx`, `app/admin/produk/[id]/ubah/page.jsx`, `app/admin/ai-actions.js`, `lib/gemini.js`, `.env.example`.
- PWA: `app/manifest.js`, `app/layout.jsx`, `components/PasangAplikasi.jsx`, `public/sw.js`, `public/offline.html`, `public/icons/*`, `scripts/generate-icons.ps1`, `next.config.mjs`.
- Database/dokumentasi: `docs/migrations/001-us18-us20.sql`, `docs/skema-database.md`, dokumen ini, `PROMPTS.md`, `README.md`.
- Pengujian: `tests/produk.test.mjs`, `tests/helpers.mjs`, `tests/katalog.test.mjs`, `tests/pemesanan.test.mjs`, `tests/gemini.test.mjs`, `tests/pwa.test.mjs`, `package.json`.
