# Perbaikan hasil penilaian 535/600

Audit ini menangani US-35, US-39, US-45, jurnal US-01–US-06, dan keamanan K-6/K-11 yang belum mendapat poin pada screenshot. Penilaian ulang bisa berbeda; dokumen ini menjelaskan implementasi dan cara membuktikannya, bukan menjanjikan skor.

## Perubahan

- US-35: tautan admin sekarang berlabel **Ekspor CSV**. Route `/admin/produk/ekspor` memeriksa `requireAdmin()`, membaca seluruh produk dalam batch, termasuk nonaktif, lalu menghasilkan BOM/escaping/perlindungan formula CSV. Label lama berbeda, sedangkan fungsi ekspor sudah ada.
- US-39: daftar publik memakai `.eq("terlihat", true)`. RPC `ringkasan_ulasan` pada migrasi 002 menghitung `count(*)` dan `avg(u.rating)` dengan `where p.id = p_produk_id and p.aktif and u.terlihat`. Jadi ulasan tersembunyi tidak masuk daftar **maupun rata-rata**. Aksi moderasi memeriksa admin dan merevalidasi layout publik. Tidak perlu mengganti agregasi database dengan hitungan dari satu halaman ulasan.
- US-45: migrasi 003 memasang trigger `catat_perubahan_produk after insert or update or delete on public.produk for each row execute function public.log_perubahan_produk()`. Fungsi mengisi `log_admin` dengan `auth.uid()`, email JWT sebagai pelaku, aksi tambah/ubah/hapus, ID/nama produk, dan waktu default database. Insert log berada dalam transaksi perubahan produk; kegagalan trigger membatalkan perubahan. Tidak menambah insert log kedua pada Server Action agar tidak terjadi duplikasi. Halaman `/admin/aktivitas` memeriksa sesi dan mengambil 50 log terbaru.
- Jurnal wajib dilengkapi dengan prompt audit yang benar-benar tersedia dan ringkasan kode. Entri secara eksplisit menyatakan prompt implementasi awal tidak tersedia, bukan mengarang riwayat pengerjaan.
- Header global: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, Permissions Policy, dan HSTS. CSP memakai nonce acak 128 bit per request, `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, serta `form-action 'self'`. Production tidak mengizinkan `unsafe-inline` atau `unsafe-eval`.
- Nonce diteruskan ke renderer Next.js dan skrip tema; header nonce kiriman browser selalu ditimpa. Font Google, gambar tautan HTTP(S), worker lokal, dan API origin aplikasi tetap diizinkan. Gambar boleh berasal dari host berbeda sesuai fitur link foto; skrip dan koneksi browser ke Supabase/Gemini tidak diizinkan. Development saja mengizinkan eval/style inline/WebSocket untuk tooling Next.js.
- Halaman offline memakai CSS eksternal supaya cocok dengan CSP statis. Service worker v2 menyimpan CSS offline bersama halaman koneksi; katalog/harga/stok/admin/API tetap tidak dicache.

## Aktivasi dan pembuktian di Production

Tidak ada migrasi baru untuk perubahan ini. Pastikan migrasi 002 dan 003 yang sebelumnya disediakan sudah sukses di proyek Supabase yang dipakai Vercel. Setelah itu pengguna melakukan push dan deployment.

1. Di Supabase SQL Editor, jalankan seluruh isi `docs/verifikasi-penilaian.sql`. Ini pemeriksaan baca saja. Definisi RPC harus memfilter `u.terlihat`; kolom `sesuai` harus true. Query trigger harus menghasilkan satu baris dengan status `O` atau `A`. Jika objek belum ada, jalankan migrasi terkait sebelum melanjutkan.
2. Login di aplikasi, unduh **Ekspor CSV** dan periksa karakter koma/kutip serta produk nonaktif. Ulangi URL ekspor tanpa sesi: harus dialihkan ke login.
3. Pada produk uji, kirim dua ulasan rating 4 dan 2: rata-rata 3.0. Sembunyikan rating 4 di `/admin/ulasan`: daftar hanya memuat rating 2, rata-rata 2.0. Tampilkan kembali: 3.0. Hapus rating 2: 4.0. Gunakan produk tanpa ulasan lain, lalu bersihkan ulasan uji.
4. Tambah satu produk uji, ubah namanya, lalu hapus. Di `/admin/aktivitas` dan query SQL, pastikan ketiga aksi memiliki ID produk yang sama, pelaku admin dan waktu. Tanpa sesi, halaman log harus dialihkan ke login. Trigger tidak mengisi ulang riwayat yang terjadi sebelum pemasangannya.
5. Di DevTools → Network, reload `/`, detail, login, dan 404. Periksa header keamanan/CSP, lalu Console: tidak ada pelanggaran CSP yang menghalangi skrip aplikasi. Coba tema setelah reload, pencarian, keranjang, login, form admin, galeri, dan WhatsApp pada lebar 390 px. Periksa Network tidak ada panggilan browser ke Supabase/Gemini.
6. Sesudah bukti Production sesuai, kirim ulang karya untuk penilaian bot. Jangan menandai pengujian live selesai hanya karena pengujian pengganti berhasil.

## Verifikasi lokal

Perintah: `npm test`, `npm run build`, dan `node scripts/verify-us41-us50-http.mjs`.
Pemeriksaan Production baca saja: `node scripts/verify-penilaian-production.mjs` membaca `.env.local` tanpa menampilkan kunci atau data pribadi; memeriksa header live serta membandingkan RPC rating dengan seluruh rating terlihat pada maksimal tiga produk. Tambahkan `--database-only` bila kode belum dideploy. Pemeriksaan ini tidak menggantikan pengujian trigger/RLS dengan sesi admin sebenarnya.
Skrip HTTP memakai server Next.js Production dengan Supabase/Auth/Gemini pengganti dalam memori. Pengujian tambahan memeriksa header/nonces pada HTML, login, redirect admin, dan 404; ekspor; rata-rata sesudah sembunyi/tampil/hapus; serta identitas/aksi/waktu log CRUD. Simulasi trigger tidak membuktikan pemasangan trigger, transaksi, atau RLS pada PostgreSQL sebenarnya. Hasil akhir perintah dicatat di `PROMPTS.md`.

Implementasi nonce mengikuti [panduan CSP resmi Next.js](https://nextjs.org/docs/app/guides/content-security-policy). Semua halaman aplikasi sudah dinamis; aset statis menggunakan CSP tanpa skrip inline.

Hasil audit: **77/77 pengujian lulus**, build Production dan skrip HTTP lulus. Pembacaan Supabase sebenarnya berhasil: tabel log_admin tersedia (8 baris), agregasi rating pada tiga produk sampel cocok dengan semua rating terlihat. Ini bukan bukti uji mutasi/RLS/trigger asli. Browser tidak terhubung, sehingga hidrasi/interaksi, layout 390 px, dan tampilan Production setelah deployment tetap perlu diperiksa.

## Daftar file perubahan

- Keamanan: `lib/security.mjs`, `next.config.mjs`, `proxy.js`, `app/layout.jsx`.
- Ekspor dan bukti alur database: `app/admin/page.jsx`, `app/admin/actions.js`, `components/UlasanProduk.jsx`.
- Offline/PWA: `public/offline.html`, `public/offline.css`, `public/sw.js`.
- Verifikasi: `tests/security.test.mjs`, `tests/pwa.test.mjs`, `scripts/verify-us21-us40-http.mjs`, `scripts/verify-penilaian-production.mjs`, `docs/verifikasi-penilaian.sql`.
- Dokumentasi: `PROMPTS.md`, `README.md`, `docs/checklist-keamanan.md`, dan panduan ini.
