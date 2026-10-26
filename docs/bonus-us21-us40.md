# Bonus US-21 sampai US-40

Kode mencakup 20 user story dengan potensi 195 poin. Nilai sebenarnya ditentukan penilai setelah migrasi, deployment, dan penilaian ulang. Timeout 524 layanan penilai bukan hasil uji aplikasi.

## Aktivasi sebelum deployment

1. Buka **dashboard Supabase** di browser dan pilih proyek database yang dipakai Bean Story.
2. Klik **SQL Editor** di sidebar kiri, kemudian **New query**.
3. Buka berkas lokal [`migrations/002-us21-us40.sql`](migrations/002-us21-us40.sql). Salin **seluruh isinya** ke editor Supabase, lalu klik **Run**. Migrasi 001 harus sudah dijalankan terlebih dahulu; kolom US-18–US-20 telah tersedia saat pemeriksaan sebelumnya.
4. Pastikan query selesai tanpa error. Migrasi 002 aman dijalankan ulang: membuat kolom `aktif`, kategori dari nilai produk lama, ulasan, klik, fungsi agregasi/RPC, bucket privat `produk`, dan kebijakan akses. `docs/schema.sql`, produk lama, dan kebijakan RLS produk tidak diubah. Jangan membuat bucket publik.
5. Di **Vercel → proyek beanstory → Environment Variables**, pastikan tiga variabel Supabase sudah tersedia untuk **Production**. Tambahkan `SITE_URL` jika domain aplikasi berbeda dari `https://beanstory.vercel.app`. Value berupa URL asal, misalnya `https://beanstory.vercel.app`, tanpa tanda kutip. Variabel ini juga boleh diisi di `.env.local`.
6. Jalankan pengujian lokal di bawah, lalu lakukan push dan deployment secara manual. **Migrasi harus diterapkan sebelum kode baru**, karena pembacaan publik sekarang mensyaratkan kolom `aktif`. Setelah mengubah konfigurasi Vercel, buat deployment baru.
7. Login pada domain Production dan ulangi alur uji. Kirim ulang karya untuk meminta penilaian bonus.

Pemeriksaan SQL opsional setelah Run:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'produk' and column_name = 'aktif';
select id, public, file_size_limit from storage.buckets where id = 'produk';
select nama from public.kategori order by nama;
select
  has_function_privilege('anon', 'public.kirim_ulasan(bigint,text,integer,text)', 'execute') as anon_ulasan,
  has_function_privilege('authenticated', 'public.catat_klik_whatsapp(bigint[])', 'execute') as sesi_rpc_klik,
  has_function_privilege('service_role', 'public.kirim_ulasan(bigint,text,integer,text)', 'execute') as server_ulasan;
```

Hasil yang diharapkan: kolom aktif ditemukan; bucket `public = false` dan batas 3.145.728 byte; kategori lama tersedia; tiga pemeriksaan izin berturut-turut `false`, `false`, `true`. Koneksi SQL administratif tidak tersedia di lingkungan agent sehingga migrasi belum dijalankan oleh agent.

## Fitur dan tempat mengujinya

| US | Fitur | Tempat/perilaku |
| --- | --- | --- |
| 21 | Keranjang | Detail → Tambah ke keranjang → `/keranjang`; ubah jumlah/hapus, total diskon, satu pesan WhatsApp. |
| 22 | Tentang | `/tentang`, data asli `lib/toko.js`, tertaut navigasi. |
| 23 | Bagikan | Detail → Bagikan; Web Share atau clipboard, hasil/kegagalan ditampilkan. |
| 24 | Favorit | Detail → Simpan favorit, lalu `/favorit`; bertahan setelah reload. |
| 25 | Tema | Tombol Mode gelap dan pilihan Sistem/Terang/Gelap di header; pilihan diingat. |
| 26 | Metadata | Detail memuat judul, deskripsi, canonical, Open Graph nama/foto. |
| 27 | Mesin pencari | `/sitemap.xml` dari seluruh produk aktif dalam batch; `/robots.txt` menunjuk sitemap. |
| 28 | 404/loading | Produk hilang/nonaktif 404; skeleton katalog/detail/admin. Pemeriksaan produk di layout berada sebelum batas streaming. |
| 29 | Upload | Form tambah/ubah → foto utama; JPEG/PNG/WebP maksimal 3 MB, signature diperiksa di server. |
| 30 | Dashboard | `/admin` jumlah seluruh produk dan per kategori dari agregasi database; termasuk nonaktif. |
| 31 | Kategori | `/admin/kategori` tambah/rename/hapus. Rename mengikuti FK cascade; kategori terpakai ditolak saat hapus. |
| 32 | Aktif | Tombol Aktifkan/Nonaktifkan di daftar atau pilihan status di form admin. |
| 33 | Daftar admin | Pencarian server, 12 baris per halaman, parameter `cari`/`halaman` di URL. |
| 34 | Validasi | Nama wajib, harga bulat 1–2.147.483.647, error per field; isian dan pilihan file dipertahankan saat gagal. Produk lama berharga nol masih dapat dibaca. |
| 35 | CSV | `/admin` → Unduh seluruh produk (CSV), termasuk nonaktif; endpoint memeriksa sesi. |
| 36 | Riwayat | Detail yang dibuka masuk Terakhir dilihat di beranda; maksimal enam. |
| 37 | Bandingkan | Pilih dua dari detail → `/bandingkan`; pilihan ketiga ditolak; `?ids=1,2` dapat dibuka langsung. |
| 38 | Ulasan | Detail → nama/rating/komentar; ulasan valid langsung tampil, 20 per halaman, rata-rata seluruh ulasan terlihat. |
| 39 | Moderasi | `/admin/ulasan` → sembunyikan/tampilkan kembali atau hapus dengan konfirmasi. |
| 40 | Klik WA | Klik pesan langsung/keranjang mencatat produk dan waktu. Kegagalan beacon/fetch tidak menghambat WhatsApp. |

## Batas data dan akses

- Pilihan browser memakai `beanstory:pilihan:v1`: maksimal 20 produk keranjang (1–99 per produk), 50 favorit, enam riwayat, dua pembanding. Hanya ID/jumlah yang disimpan, bukan harga atau stok. Data storage rusak dinormalisasi saat dibaca; storage tidak tersedia memakai memori dan memberi pemberitahuan.
- Data terbaru dimuat dari `POST /api/produk/seleksi`, maksimal 50 ID. Keranjang memuat ulang saat dibuka/fokus kembali atau tombol muat ulang ditekan. Produk hilang/nonaktif/habis atau jumlah melebihi stok memblokir seluruh pesan. Tidak ada reservasi atau pengurangan stok; toko mengonfirmasi ketersediaan di WhatsApp.
- Semua pembacaan produk publik mensyaratkan `aktif = true`. Halaman perbandingan untuk produk hilang/nonaktif mengirim 404.
- Supabase hanya dipanggil dari server. Operasi admin dan upload memakai sesi publishable key setelah `auth.getUser()`, serta RLS. Pendaftaran akun baru tetap harus dimatikan sesuai rancangan akun admin yang sudah ada.
- **Pengecualian publik yang disetujui:** ulasan dan klik tidak memerlukan login. Server Action ulasan memvalidasi nama 2–80 karakter, rating bulat 1–5, komentar 5–1.000, dan honeypot. Server memanggil RPC `kirim_ulasan`/`catat_klik_whatsapp` memakai koneksi rahasia; eksekusi RPC hanya untuk `service_role`. Tabel tidak menerima akses publik langsung. RPC juga memeriksa produk aktif. Klik menyimpan hanya produk/waktu (serta ID baris), tanpa IP, perangkat, atau identitas pengunjung.
- Foto di bucket privat, nama UUID. `foto_url` menyimpan URL aplikasi `/media/produk/[nama]`, bukan URL Supabase. Route hanya melayani foto utama yang dirujuk produk aktif. Foto produk nonaktif tidak dilayani melalui route publik, termasuk bila URL dibuka dari daftar admin. Upload baru dibersihkan bila penyimpanan produk gagal; foto lama tidak dihapus otomatis. Jika pembersihan gagal karena jaringan/izin, server mencatat pesan umum untuk pemeriksaan Storage.
- Server Action dibatasi 4 MB, file 3 MB, di bawah batas payload Vercel 4,5 MB. Ekspor CSV dan sitemap membaca batch 1.000 produk agar tidak terpotong batas baris PostgREST. CSV memakai UTF-8 BOM, escaping dan penetralan formula.
- Service worker hanya menyimpan aset statis. Admin/API, HTML katalog/detail, harga/stok, halaman pilihan pribadi, respons RSC, dan media privat tidak disimpan olehnya. Saat offline hanya halaman koneksi umum ditampilkan.

## Perintah pengujian

```powershell
npm.cmd test
npm.cmd run build
node scripts/verify-us21-us40-http.mjs
```

Skrip HTTP memakai port lokal 3004 dan Supabase pengganti dalam memori, termasuk sesi admin uji. Skrip tidak memakai kredensial atau database toko, dan menghentikan server uji setelah selesai. Port 3004 harus kosong. Unit test tidak memerlukan akun atau migrasi live.

## Hasil verifikasi agent

- **53 pengujian otomatis lulus**, termasuk regresi; storage rusak/ditolak/kuota, batas pilihan, diskon/stok keranjang, produk aktif, input/ID, upload palsu/besar/error dan cleanup, autentikasi aksi/ekspor, CSV >1.000 baris, ulasan/honeypot, API klik/beacon/fetch, tema awal, serta service worker.
- Build Production berhasil; peringatan lockfile folder induk sudah ada sebelumnya dan tidak menghalangi build.
- Skrip HTTP lengkap lulus terhadap build Next.js dan Supabase pengganti: katalog/detail/perbandingan, metadata/canonical, sitemap aktif, HTTP 404, proteksi admin, CRUD/validasi, upload dan route media, kategori, status, ulasan terlihat/moderasi/rata-rata, klik unik, serta CSV termasuk nonaktif. Cascade/restrict di skrip disimulasikan, **bukan verifikasi constraint PostgreSQL sebenarnya**.
- Pemeriksaan baca saja pada Supabase toko: `produk.aktif` belum tersedia (kode 42703). API baru mengembalikan 503 saat migrasi belum ada, tanpa membocorkan rincian database. HTTP lokal untuk admin/kategori/ulasan/ekspor tanpa sesi mengalihkan ke login; halaman pilihan dan tentang merespons 200; ID produk/perbandingan tidak valid 404 setelah perbaikan batas loading.
- Belum diverifikasi: eksekusi/idempotensi SQL di PostgreSQL sebenarnya, FK cascade/restrict dan RLS/Storage live, login/mutasi live, interaksi browser, lebar 390 px, reload tema di browser, serta Production. Browser terhubung dan koneksi SQL administratif belum tersedia; Docker engine lokal juga tidak berjalan.

## Uji setelah migrasi, ulangi di Production

1. Login, buat kategori uji dan satu produk uji dengan foto asli, diskon, stok. Pastikan tersimpan di admin/katalog/detail dan foto `/media/produk/...` tampil. Ubah data, rename kategori dan pastikan kategori produk mengikuti; hapus kategori terpakai harus ditolak.
2. Coba nama kosong, harga nol/negatif/pecahan, diskon/stok salah, file bukan gambar yang diganti ekstensinya, serta file >3 MB. Periksa error di bawah field dan isian/file tetap terpilih. Gangguan jaringan/izin upload atau database tidak boleh memberi pesan sukses.
3. Masukkan dua produk ke keranjang, ubah jumlah/hapus, bandingkan total diskon dengan pesan WhatsApp. Reload/pindah halaman. Ubah harga/stok/status lewat admin lalu muat ulang keranjang; pemesanan produk tidak tersedia harus diblokir. Coba favorit, riwayat enam produk, pilihan pembanding ketiga, dan perbandingan produk nonaktif.
4. Kirim ulasan rating 4 dan 2: rata-rata 3.0. Sembunyikan rating 2: rata-rata 4.0 dan komentar tidak terlihat publik. Tampilkan kembali, lalu hapus dengan konfirmasi. Uji rating invalid, panjang komentar, honeypot; tidak boleh tersimpan.
5. Klik WhatsApp langsung dan keranjang; periksa tabel `klik_whatsapp`: satu baris per produk berbeda per klik, hanya produk/waktu. Putuskan endpoint pencatatan lewat alat pengembang: WhatsApp harus tetap terbuka.
6. Ekspor CSV berisi koma/kutip/baris baru dan nama diawali `=`, `+`, `-`, `@`; buka di spreadsheet. Pastikan produk nonaktif ikut diekspor. Keluar dan buka seluruh rute admin/ekspor; harus dialihkan ke login, aksi mutasi tanpa sesi tidak boleh mengubah data.
7. Pada lebar 390 px, periksa navigasi membungkus, tabel dapat digeser di wadahnya, perbandingan tetap dua kolom, dan tombol/form terbaca. Pilih gelap, reload/pindah halaman, pilih terang dan sistem. Uji bagikan/clipboard beserta penolakan izinnya.
8. Periksa source metadata, `/sitemap.xml`, `/robots.txt`, skeleton pada jaringan lambat, dan 404 setelah menonaktifkan/menghapus produk uji. Batalkan penghapusan terlebih dahulu untuk memastikan tidak terjadi perubahan. Hapus produk/kategori uji setelah selesai; foto lama tetap ada sesuai kebijakan tanpa penghapusan otomatis.

## Daftar file implementasi

- Pengunjung/SEO: `app/page.jsx`, `app/layout.jsx`, `app/globals.css`, `app/produk/[id]/{page,layout,loading}.jsx`, `app/produk/ulasan-actions.js`, `app/{keranjang,favorit,bandingkan,tentang}/page.jsx`, `app/{sitemap,robots}.js`.
- Endpoint: `app/api/produk/seleksi/route.js`, `app/api/klik-whatsapp/route.js`, `app/media/produk/[nama]/route.js`, `app/admin/produk/ekspor/route.js`.
- Admin: `app/admin/{page,layout,loading}.jsx`, `app/admin/actions.js`, `app/admin/kelola-actions.js`, halaman kategori/ulasan serta form baru/ubah produk.
- Komponen baru: `PilihanProvider`, `AksiPengunjung`, `DaftarPilihan`, `Tema`, `Skeleton`, `Paginasi`, `FormAksi`, `FormUlasan`, `UlasanProduk`. Komponen diperbarui: `Header`, `Tombol`, `TombolWhatsApp`, `Input`, `FormProduk`, `NavAdmin`, `TabelProduk`.
- Logika: `lib/{pilihan,klik-whatsapp,produk-server,site,admin-data,csv,ulasan,upload}.js`; pembaruan `lib/{produk,katalog}.js` dan `lib/supabase/server.js`.
- Konfigurasi/aset: `next.config.mjs`, `.env.example`, `public/theme-init.js`.
- Data/dokumentasi: migrasi 002, dokumen ini, `docs/{rancangan-teknis,skema-database}.md`, `DESIGN.md`, `README.md`, `PROMPTS.md`.
- Pengujian: `tests/{bonus-api,bonus-server,pilihan,tema}.test.mjs`, pembaruan pengujian produk/katalog/PWA, dan `scripts/verify-us21-us40-http.mjs`.

Tidak ada paket baru, perintah Git, push, atau deployment yang dijalankan agent.
