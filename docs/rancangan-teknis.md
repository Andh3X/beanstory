# Rancangan Teknis

## Alur data

```
Browser pengunjung/admin
        |
        v
Next.js di Vercel (server)          <- semua akses Supabase terjadi di sini
  - Server Component: membaca data
  - Server Action: memproses form
  - proxy.js: menjaga halaman /admin
        |
        v
Supabase
  - Tabel produk (RLS aktif)
  - Auth (akun admin)
```

Browser tidak pernah berhubungan langsung dengan Supabase. Alamat proyek dan kunci Supabase hanya ada di server.

## Dua jenis koneksi Supabase

| Koneksi | Kunci | Dipakai untuk |
| --- | --- | --- |
| Koneksi server untuk pengunjung | `SUPABASE_SECRET_KEY` | Membaca katalog dan detail produk (pengunjung tidak login, dan RLS menolak akses publik) |
| Koneksi sesi admin | `SUPABASE_PUBLISHABLE_KEY` + cookie login (`@supabase/ssr`) | Login, keluar, ganti password, dan aksi tambah/ubah/hapus produk |

Kunci rahasia melewati aturan RLS. Selain membaca data publik, ada dua pengecualian penulisan publik yang disetujui untuk US-38/US-40: pengiriman ulasan dan pencatatan klik WhatsApp, melalui RPC khusus di server. Eksekusi kedua RPC hanya diberikan kepada `service_role`; `PUBLIC`, `anon`, dan `authenticated` tidak dapat menjalankannya langsung. Browser tetap tidak menerima koneksi atau kunci Supabase. Aksi pengelolaan toko memakai koneksi sesi admin setelah `auth.getUser()`, sehingga RLS tetap berlaku.

## Struktur folder

```
app/
  page.jsx                  katalog (US-01)
  produk/[id]/page.jsx      detail produk (US-02)
  admin/
    login/page.jsx          login (US-04)
    page.jsx                daftar produk admin (US-07, bonus)
    password/page.jsx       ganti password (US-05)
    produk/baru/page.jsx    tambah produk (US-08, bonus)
    produk/[id]/ubah/...    ubah produk (US-09, bonus)
components/                 komponen tampilan (lihat DESIGN.md)
lib/
  toko.js                   identitas toko dan nomor WhatsApp
  data-contoh.js            data contoh sebelum terhubung database
  format.js                 format rupiah
docs/                       dokumen proyek
```

File yang akan dibuat saat mengerjakan user story:

```
lib/supabase/            koneksi Supabase untuk server
app/admin/actions.js     Server Action untuk login, ganti password, dan kelola produk
proxy.js                 proteksi halaman /admin (US-06)
```

## Pesan WhatsApp (US-03)

Format link: `https://wa.me/<nomor>?text=<pesan>`

- `<nomor>` diambil dari `lib/toko.js`, format internasional tanpa tanda + (contoh `6281234567890`).
- `<pesan>` berisi nama dan harga produk, di-encode dengan `encodeURIComponent`.

## Alur bonus US-21–US-40

- `PilihanProvider` berbagi state browser berversi untuk keranjang/favorit/riwayat/perbandingan. Harga/stok tidak dipersistenkan. Resolusi data terkini melalui `POST /api/produk/seleksi` di server, selalu produk aktif.
- Server Action kategori, status, moderasi, dan produk memanggil `requireAdmin()` sebelum query. Daftar admin dipaginasi server; statistik agregasi terpisah dari pencarian. CSV mengambil seluruh produk dalam batch.
- Upload lewat sesi admin menuju bucket privat, dengan validasi ukuran/tipe/signature. Route media memeriksa rujukan produk aktif dan mengunduh objek dari server. URL foto baru berupa path aplikasi relatif agar tetap berlaku saat domain berubah.
- Ulasan dan klik publik melewati RPC service_role khusus seperti dijelaskan di atas. Publik tidak mengakses tabel baru langsung; validasi aplikasi dan constraint SQL sama-sama berlaku. Ulasan valid langsung tampil dan dapat dimoderasi.
- `ambilProdukPublik` memakai React cache per request dan dipakai layout/detail/metadata. Layout memastikan produk ada/aktif sebelum batas loading, sehingga HTTP 404 tetap benar. Sitemap mengambil seluruh produk aktif dalam batch.
- Aktivasi dan hasil pengujian nyata: [bonus-us21-us40.md](bonus-us21-us40.md).

## Akun admin

Akun admin dibuat dari skrip di panduan workshop (bukan dari aplikasi) dan password bawaannya wajib diganti lewat US-05. Pendaftaran akun baru dimatikan di pengaturan Supabase Auth.
