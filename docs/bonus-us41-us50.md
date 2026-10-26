# Bonus US-41 sampai US-50

Sepuluh user story telah diimplementasikan di kode, dengan potensi 125 poin. Skor sebenarnya tetap mengikuti hasil deployment dan penilaian ulang.

## Aktivasi: migrasi 003 sebelum deployment

1. Pastikan migrasi 001 dan 002 telah berhasil. Dari pemeriksaan pengguna, kolom `aktif`, tabel bonus, dan bucket `produk` privat sudah tersedia.
2. Buka **Supabase Dashboard → proyek The Bean Story → SQL Editor → New query**.
3. Buka [`migrations/003-us41-us50.sql`](migrations/003-us41-us50.sql) di editor lokal. Salin seluruh isi, dari `begin;` sampai `commit;`, ke SQL Editor. Klik **Run** dan pastikan berhasil.
4. Migrasi membuat registry admin aktif, pengaturan/banner, varian, log aktivitas, kolom urutan, slug kategori, agregasi terlaris, dan pembatas AI. Migrasi dapat dijalankan ulang. `docs/schema.sql` asli tetap dipertahankan; migrasi **menambah kebijakan RLS restrictive** untuk memeriksa admin aktif.
5. Akun Auth lama yang belum dihapus dimasukkan ke registry admin; akun yang sedang diblokir tetap nonaktif. Ini mempertahankan asumsi aplikasi lama bahwa akun authenticated adalah admin. Pendaftaran publik tetap dimatikan di Supabase. Setelah migrasi, akun Auth baru hanya mendapat akses admin bila didaftarkan melalui fitur admin/registry yang sah.
6. Periksa hasil dengan query baca saja berikut. Hasil pertama harus menunjukkan minimal satu admin aktif. Kolom urutan/slug dan fungsi harus ditemukan; izin RPC kuota untuk anon harus `false`.

```sql
select count(*) as admin_aktif from public.admin_toko where aktif;
select id, nama, urutan from public.produk order by urutan, id;
select nama, slug from public.kategori order by nama;
select to_regclass('public.varian') as tabel_varian,
       to_regclass('public.log_admin') as tabel_log;
select has_function_privilege('anon', 'public.ambil_kuota_ai(text)', 'execute') as anon_kuota_ai;
```

7. Pastikan `GEMINI_API_KEY` tersedia di `.env.local` dan **Vercel → beanstory → Environment Variables → Production**. US-50 memakai konfigurasi Gemini yang sama dengan US-14, termasuk `GEMINI_MODEL` bila diisi. Tidak memerlukan paket atau kunci tambahan.
8. Jalankan pengujian lokal, kemudian push dan deployment secara manual. **Jalankan migrasi sebelum deployment**, karena kode baru memerlukan `admin_aktif()` dan relasi varian/kolom urutan. Tanpa migrasi, akses admin ditolak dan katalog/detail baru belum dapat bekerja lengkap.
9. Login ulang pada Production, jalankan alur pengujian di bawah, lalu kirim ulang karya untuk penilaian.

Agent tidak menjalankan SQL administratif, membuat akun nyata, melakukan push, atau deployment.

## Fitur dan perilaku

| US | Implementasi | Tempat menguji |
| --- | --- | --- |
| 41 | Lima produk dengan klik WhatsApp terbanyak, agregasi database, urutan seri berdasarkan ID; pesan khusus jika kosong/error. Klik bukan transaksi selesai. | Dashboard `/admin` |
| 42 | Satu banner toko yang dapat dibuat/diubah, dengan judul, teks, link gambar, tujuan, serta status aktif. Hanya banner aktif tampil di beranda. | `/admin/banner` |
| 43 | Pengaturan nama, tagline, WhatsApp, alamat, jam buka dalam singleton database. Header/footer/tentang/katalog/metadata/manifest memakai pengaturan; `lib/toko.js` menjadi cadangan. Pesan langsung dan keranjang memakai nomor dari pengaturan. | `/admin/pengaturan` |
| 44 | Daftar/tambah/nonaktifkan/aktifkan kembali/hapus admin. Setiap aksi memeriksa sesi dan status aktif. Akun sendiri dilindungi pada aplikasi dan RPC status. | `/admin/akun` |
| 45 | Trigger database mencatat tambah/ubah/hapus produk secara atomik dengan perubahan, termasuk impor/status/urutan/rename kategori yang mengubah produk. Menampilkan 50 log terakhir. | `/admin/aktivitas` |
| 46 | Impor CSV UTF-8 maksimal 1 MB/500 produk, validasi per baris dengan nomor baris fisik, satu batch untuk semua baris valid, ringkasan berhasil/gagal. | `/admin/produk/impor` |
| 47 | Tombol Naik/Turun menggeser posisi global melalui RPC dengan kunci transaksi. Default katalog menjadi Pilihan toko. Urutan harga/terbaru tetap dapat dipilih. | Daftar `/admin`, katalog |
| 48 | CRUD varian per produk, nama unik pada produk yang sama, harga rupiah bulat positif. Pilihan varian mengubah harga pesanan dan masuk WhatsApp/keranjang. | `/admin/produk/[id]/varian`, detail |
| 49 | Slug kategori unik dibuat database, dipertahankan saat rename. Halaman kategori menggunakan query produk aktif, pencarian, urutan, dan paginasi. Kategori hilang 404. Tautan kategori ada di kartu/detail dan sitemap. | `/kategori/[slug]` |
| 50 | Form tanya produk memakai Gemini di server, input dibatasi, timeout/error ditangani, jawaban hanya berisi informasi katalog yang dipilih model. | Bagian Tanya tentang produk pada detail |

## Keputusan data dan keamanan

- Semua pengelolaan toko memakai sesi Supabase dan `auth.getUser()`, dilanjutkan RPC `admin_aktif()`. Proxy melakukan pemeriksaan yang sama. Kegagalan registry ditolak, tanpa fallback mengizinkan akses.
- Registry dan kebijakan RLS tambahan menolak sesi admin nonaktif meskipun JWT lama belum kedaluwarsa. Ban Auth saja tidak mencabut JWT yang sudah diterbitkan, sebagaimana dijelaskan dalam [dokumentasi Supabase](https://supabase.com/docs/guides/auth/managing-user-data). Kebijakan produk lama tetap ada dan dikombinasikan dengan syarat restrictive admin aktif. Tabel baru dan Storage produk juga memerlukan admin aktif.
- Semua admin aktif mempunyai kemampuan pengelolaan toko dan admin lain. Registry disediakan hanya melalui server; pengguna tidak dapat menambahkan dirinya sendiri melalui akses tabel authenticated. RPC status memakai lock dan memeriksa kembali pemanggil serta perlindungan akun sendiri, sehingga dua perubahan status bersamaan tidak dapat menonaktifkan kedua pemanggil secara bergantian.
- Auth Admin API memakai koneksi rahasia hanya setelah pemeriksaan sesi. Pembuatan akun menggunakan password awal yang dimasukkan admin, tidak disimpan di tabel aplikasi/log dan tidak dikembalikan dalam hasil aksi. Akun langsung dikonfirmasi, tanpa email undangan; sampaikan password secara pribadi dan ganti setelah login. Jika penyimpanan registry gagal, akun baru dibatalkan; bila pembatalan juga gagal, akun Auth tidak memperoleh akses admin dan pesan meminta pemeriksaan manual.
- Saat menonaktifkan/menghapus akun, registry dinonaktifkan terlebih dahulu. Jika Auth API gagal, akses admin tetap ditolak dan pesan menjelaskan keadaan parsial. Penghapusan Auth yang gagal karena kepemilikan file Storage tidak menghapus file otomatis. Aktivasi mencabut ban Auth terlebih dahulu, lalu mengaktifkan registry; kegagalan registry tetap menolak akses.
- Log mencatat ID admin, email pelaku dari sesi, aksi, ID/nama produk, dan waktu. Password/kunci tidak dicatat. ID/nama produk tetap tersimpan setelah produk dihapus; ID admin tetap dapat diaudit setelah akun dihapus. Perubahan melalui SQL Editor/layanan dicatat sebagai Sistem. Log mulai tersedia setelah migrasi; perubahan posisi awal pada migrasi juga dapat menghasilkan log Sistem.
- Pengaturan WhatsApp menerima 8–15 digit internasional tanpa awalan 0; spasi, tanda +, kurung, dan tanda hubung dinormalisasi. Link banner hanya HTTP(S) atau path aplikasi yang aman. Banner dan identitas memakai teks biasa, bukan HTML.
- Impor menambah produk baru, tidak mengubah berdasarkan ID. Kolom `id`, `created_at`, dan kolom tak dikenal diabaikan. Nama/harga wajib; harga harus positif dan bulat. Validasi galeri/stok/diskon/status tetap berlaku. Kategori harus sudah dibuat; tidak dibuat diam-diam. Format CSV mendukung BOM, koma, kutip ganda ter-escape, CRLF, dan baris baru di dalam sel berkutip. Baris gagal tidak ikut batch. Jika batch gagal, keberhasilan tidak diumumkan; setelah gangguan koneksi, periksa daftar sebelum mengulangi agar tidak menduplikasi data yang sudah tersimpan.
- Produk baru ditempatkan setelah produk lama. Naik/Turun berlaku pada urutan seluruh produk, termasuk nonaktif, dan menormalkan posisi dalam satu transaksi. Filter pencarian admin tidak mengubah arti posisi global. Urutan harga tetap memakai harga dasar seperti implementasi sebelumnya.
- Harga varian menggantikan harga dasar; diskon dasar tidak ditambahkan lagi pada varian. Stok produk dibagi bersama lintas semua variannya. Produk dengan varian mewajibkan pemilihan varian sebelum pesan/tambah keranjang. Produk tanpa varian tetap memakai harga/diskon biasa.
- Penyimpanan browser sekarang `beanstory:pilihan:v2`, dengan pembacaan cadangan v1 agar pilihan lama tetap dimuat. Item menyimpan ID produk/varian dan jumlah, tidak menyimpan harga. Maksimal 20 pilihan produk/varian. Resolusi server memuat varian/harga terbaru dan nomor toko. Varian yang dihapus atau produk lama yang kini wajib memilih varian memblokir checkout item tersebut sampai pengguna memperbarui pilihannya.
- Asisten menerima pertanyaan 3–500 karakter dan honeypot. Data aktif diambil ulang di server; konteks dibatasi pada nama/kategori/harga/stok/deskripsi dan maksimal 30 varian. Model memilih maksimal empat key fakta dalam JSON; server merangkai jawabannya dari nilai katalog, tanpa meneruskan klaim baru/HTML dari model. Informasi tidak tersedia mengarah ke pesan menghubungi toko. Tidak ada tools, akses web, atau perubahan data oleh AI.
- Gemini dipanggil melalui REST yang sudah digunakan proyek, timeout 15 detik, token/output dibatasi, error kuota/konfigurasi/jaringan ditampilkan tanpa detail rahasia. Pola JSON mengikuti [dokumentasi structured output Gemini](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Pemanggilan model sebenarnya tetap perlu diuji menggunakan akun Gemini pengguna.
- Batas AI berlaku lintas instance melalui RPC service-role: 5 pertanyaan/browser/menit dan 30 global/menit. Cookie acak HttpOnly/SameSite Lax bertanda tangan berlaku 24 jam; tabel hanya menyimpan hash token dan hitungan sampai jendela menit berakhir, tanpa IP/pertanyaan. Baris kedaluwarsa dibersihkan pada permintaan berikutnya. Ini pembatas dasar, bukan identifikasi orang. Pencatatan klik WhatsApp tetap hanya produk dan waktu.

## Verifikasi agent

```powershell
npm.cmd test
npm.cmd run build
node scripts/verify-us41-us50-http.mjs
```

- **73 pengujian otomatis lulus**, terdiri dari regresi dan 20 skenario tambahan untuk pengaturan/banner, registry admin, penolakan sesi, akun sendiri, kegagalan Auth/registry, CSV, urutan, varian/keranjang/stok, slug, jawaban AI, cookie dan kuota. Aksi CRUD asli juga diuji dengan sesi beridentitas sah tetapi registry admin nonaktif, sebelum query produk dijalankan.
- Build Production berhasil. Manifest kini dinamis supaya pengaturan toko tidak membeku saat build. Peringatan lockfile folder induk sudah ada sebelumnya dan tidak menghalangi build.
- Skrip HTTP lulus terhadap build Next.js dengan Supabase/Auth/Gemini pengganti: seluruh alur regresi serta dashboard klik, banner aktif/nonaktif, perubahan identitas dan nomor WA, tambah/nonaktifkan/aktifkan/hapus admin, JWT lama ditolak saat registry nonaktif, akun sendiri dilindungi, log aktivitas, impor valid/gagal, urutan katalog, CRUD varian/API, kategori/404/sitemap, jawaban AI dan penolakan kuota keenam.
- Layanan pengganti hanya berjalan dalam proses uji lokal port 3004. Kunci model dan Auth yang dipakai adalah nilai dummy. Hook Gemini khusus uji tidak dimuat aplikasi/deployment. Skrip menghentikan server uji setelah selesai dan tidak mengubah Supabase toko.
- Pengujian HTTP mensimulasikan trigger, FK, lock transaksi, dan RLS; hal itu **belum membuktikan eksekusi PostgreSQL/RLS sebenarnya**. Tidak ada koneksi SQL administratif atau browser terhubung. Interaksi visual/lebar 390 px, migrasi/idempotensi live, Auth/Storage live, Gemini live, dan Production belum diverifikasi agent.

## Uji setelah migrasi dan ulangi di Production

1. Login dengan akun lama. Cek dashboard kosong sebelum klik, kemudian klik pesan pada beberapa produk dan pastikan lima teratas/angkanya mengikuti tabel klik. Daftar kosong dan kegagalan layanan harus berbeda.
2. Simpan banner aktif dengan judul/teks/gambar/tujuan; periksa beranda. Nonaktifkan lalu pastikan hilang. Coba link `javascript:` dan link tidak valid: penyimpanan ditolak.
3. Ubah nama, WhatsApp, alamat, dan jam buka. Periksa header/footer/tentang, katalog, manifest, dan tautan pesan langsung/keranjang setelah memuat ulang. Nomor 08… atau berisi huruf ditolak. Saat pengaturan kosong, cadangan statis berlaku.
4. Tambah akun admin memakai email kedua yang Anda kuasai. Login dari browser lain, ganti password, lalu nonaktifkan dari akun pertama. Browser kedua harus kehilangan akses admin, termasuk aksi mutasi/CSV/Storage dengan sesi lamanya. Aktifkan kembali lalu uji login. Hapus akun uji dari akun pertama; upaya menghapus/menonaktifkan akun sendiri harus ditolak.
5. Tambah/ubah/hapus produk, ubah status/urutan, dan lakukan impor. Periksa log dengan pelaku/aksi/waktu; 50 terakhir saja tampil. Keluar dan pastikan seluruh halaman/aksi baru ditolak tanpa sesi.
6. Impor CSV campuran nama berkoma/kutip/baris baru, harga positif dan invalid, serta kategori yang belum tersedia. Periksa nomor baris, jumlah berhasil/gagal, dan data nyata. Coba header salah, file >1 MB, dan >500 baris. Setelah partial success, impor ulang hanya baris yang telah diperbaiki.
7. Naikkan/turunkan produk melewati batas halaman admin, dengan dan tanpa pencarian. Katalog Pilihan toko harus mengikuti posisi global; termurah/termahal/terbaru tetap sesuai pilihan. Produk di ujung memberi pesan batas.
8. Tambah varian dua ukuran dengan harga berbeda, ubah/hapus salah satunya. Di detail, pilih ukuran dan pastikan harga pilihan/total/pesan WA benar. Masukkan dua ukuran ke keranjang, reload, ubah harga varian/stok di admin, muat ulang keranjang. Total jumlah dua ukuran tidak boleh melebihi stok bersama. Varian terhapus harus diblokir. Produk tanpa varian tetap dapat dipesan.
9. Klik kategori dari kartu/detail, periksa URL dan filter produk aktif. Coba paginasi/pencarian, slug hilang, rename kategori (URL lama tetap berlaku), dan penghapusan kategori kosong. Sitemap harus memuat kategori yang ada.
10. Tanyakan harga/stok/deskripsi lewat AI. Coba klaim yang tidak ada dalam katalog dan instruksi mengabaikan aturan: jawaban tidak boleh mengarang fakta. Coba pertanyaan kosong/>500, honeypot, enam pertanyaan dalam satu menit, kunci/kuota/provider gagal, dan produk nonaktif. UI harus selesai dengan hasil atau error yang jelas.
11. Pada lebar sekitar 390 px, periksa navigasi admin membungkus, tabel bergeser dalam wadah, formulir/konfirmasi tidak terpotong, dan mode gelap tetap terbaca. Uji tombol Batal sebelum setiap penghapusan. Ulangi pada domain Vercel setelah deployment berhasil.

## File utama

- Migrasi: `docs/migrations/003-us41-us50.sql`.
- Admin: halaman banner/pengaturan/akun/aktivitas/impor/varian; `app/admin/{toko,akun,impor,urutan,varian}-actions.js`; pembaruan dashboard, NavAdmin/TabelProduk, login, password dan penjagaan sesi/proxy.
- Publik: katalog dipindahkan ke `components/Katalog.jsx`; kategori/slugs, banner, identitas dinamis pada layout/header/footer/tentang/metadata/manifest/sitemap, serta asisten pada detail.
- Komponen baru: `BannerPromo`, `ProdukTerlaris`, `FormPengaturan`, `FormAdminBaru`, `FormImpor`, `AsistenProduk`.
- Logika: `lib/{toko-server,pengaturan,impor-csv,kategori-server,asisten,asisten-server}.js`; perubahan katalog, harga/pemesanan, browser provider/keranjang dan API seleksi.
- Pengujian: `tests/us41-us50.test.mjs`, penyesuaian regresi, perluasan skrip HTTP dan `scripts/fixtures/gemini-fetch.mjs`.
- Dokumentasi: dokumen ini, `PROMPTS.md`, `README.md`, rancangan teknis dan skema database.

Tidak ada paket npm baru atau perintah Git yang dijalankan.
