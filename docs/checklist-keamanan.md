# Checklist Keamanan

Cek semua poin ini sebelum mengumpulkan karya. Poin ini juga dipakai saat penilaian.

- [ ] Buka situs di browser, klik kanan > Inspect > tab Network. Muat ulang halaman: tidak ada permintaan ke alamat `supabase.co`.
- [ ] Cari kata `supabase` dan `NEXT_PUBLIC` di seluruh kode: tidak ada environment variable berawalan `NEXT_PUBLIC_`.
- [ ] File `.env.local` tidak ikut ter-push ke GitHub (cek di halaman repo).
- [ ] Buka `/admin` di jendela penyamaran (incognito) tanpa login: dialihkan ke `/admin/login`.
- [ ] Buka `/admin/password` tanpa login: dialihkan ke `/admin/login`.
- [ ] Login dengan password bawaan: gagal, karena password sudah diganti.
- [ ] RLS di tabel `produk` aktif (Supabase > Table Editor > produk: tidak ada label "RLS disabled").
- [ ] Tidak ada email, password, atau kunci yang ditulis di kode.
- [ ] (Bonus) Aksi tambah, ubah, dan hapus produk ditolak jika tidak login.
- [ ] Header live pada katalog, detail, login, redirect admin, dan 404 memuat `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, dan CSP dengan `frame-ancestors 'none'`.
- [ ] CSP Production memakai nonce baru per request; tidak ada `unsafe-inline`/`unsafe-eval`. Reload tema, navigasi, dan form admin berfungsi tanpa error CSP di Console.
- [ ] Pemeriksaan RPC moderasi dan trigger log melalui `docs/verifikasi-penilaian.sql` sesuai; uji CRUD dan moderasi pada aplikasi live sudah dilakukan sebagaimana `docs/perbaikan-penilaian.md`.
