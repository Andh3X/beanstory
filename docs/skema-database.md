# Skema Database

## Tambahan US-41–US-50

Migrasi terpisah `migrations/003-us41-us50.sql` dijalankan setelah 001/002 dan sebelum deployment. Skema dasar asli tidak ditulis ulang.

| Objek | Peran |
| --- | --- |
| `admin_toko` | ID Auth dan status aktif; RLS, tabel authenticated hanya dapat dibaca admin aktif. |
| `admin_aktif()`, `status_admin(uuid,boolean)` | Pemeriksaan registry dan perubahan status dengan perlindungan akun sendiri/lock. |
| `pengaturan_toko`, `banner` | Singleton id=1 untuk identitas/WhatsApp dan promo aktif. |
| `varian` | ID, produk_id FK cascade, nama unik per produk, harga positif. |
| `log_admin` | Snapshot pelaku/aksi/produk/waktu, dipenuhi trigger produk; authenticated hanya membaca. |
| `produk.urutan`, `geser_produk(...)` | Posisi integer dan perpindahan atomik; default produk baru di akhir. |
| `kategori.slug` | Slug unik/non-null, trigger menghasilkan slug; rename nama mempertahankan slug. |
| `produk_terlaris()` | Agregasi 5 produk berdasarkan jumlah klik, hanya sesi admin aktif. |
| `batas_ai`, `ambil_kuota_ai(text)` | Kuota per menit lintas instance; tabel/RPC hanya service-role. |

Kebijakan restrictive tambahan pada produk/kategori/ulasan/klik dan Storage produk memastikan admin nonaktif tidak dapat memakai token lamanya. Tabel baru juga mewajibkan admin aktif. Ulasan/klik tetap memakai RPC publik melalui server sebagaimana migrasi 002. [Panduan aktivasi dan pengujian](bonus-us41-us50.md).

## Tabel `produk`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | bigint | Nomor unik, dibuat otomatis |
| `nama` | text | Nama produk, wajib diisi |
| `harga` | integer | Harga dalam rupiah, tidak boleh negatif |
| `deskripsi` | text | Penjelasan produk |
| `foto_url` | text | Link gambar produk |
| `kategori` | text | Kelompok produk, misalnya "Camilan" |
| `created_at` | timestamptz | Waktu dibuat, otomatis |

## Aturan akses (RLS)

Row Level Security aktif di tabel `produk`.

| Siapa | Baca | Tambah | Ubah | Hapus |
| --- | --- | --- | --- | --- |
| Publik (tanpa login) | Ditolak | Ditolak | Ditolak | Ditolak |
| Admin yang login | Boleh | Boleh | Boleh | Boleh |

Pengunjung tetap bisa melihat katalog karena data dibaca oleh server memakai kunci rahasia, bukan langsung dari browser.

Skrip lengkap ada di `docs/schema.sql`.

## Tambahan bonus US-18–US-20

Jalankan `docs/migrations/001-us18-us20.sql` di SQL Editor Supabase untuk menambah:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `foto_tambahan` | text[] | Maksimal 9 link foto tambahan, default array kosong; foto utama tetap `foto_url` |
| `stok` | integer, nullable | Kosong berarti tidak dibatasi, 0 berarti habis, nilai lain harus nonnegatif |
| `harga_diskon` | integer, nullable | Jika diisi harus nonnegatif dan lebih rendah dari `harga` |
| `badge` | text, nullable | `Baru`, `Terlaris`, atau kosong |

Kolom dan kebijakan RLS lama tetap berlaku. Panduan aktivasi dan pengujian ada di `docs/bonus-us11-us20.md`.

## Tambahan bonus US-21–US-40

Jalankan `docs/migrations/002-us21-us40.sql` sebelum deployment kode. Migrasi ini tidak mengganti `schema.sql` atau kebijakan RLS produk.

| Objek | Isi |
| --- | --- |
| `produk.aktif` | Boolean wajib, default true; semua query produk publik menyaring true. |
| `kategori` | Primary key nama; diisi dari kategori lama. `produk.kategori` tetap teks nullable, FK update cascade/delete restrict. |
| `ulasan` | ID, produk_id, nama, rating 1–5, komentar, terlihat default true, created_at; hapus produk menghapus ulasan terkait. |
| `klik_whatsapp` | ID, produk_id, created_at; tanpa data pribadi. Hapus produk menghapus klik terkait. |
| `statistik_produk()` | Agregasi jumlah seluruh produk per kategori untuk sesi admin, mengikuti RLS. |
| `ringkasan_ulasan(bigint)` | Jumlah/rata-rata seluruh ulasan terlihat pada produk aktif; hanya server service_role. |
| `kirim_ulasan(...)`, `catat_klik_whatsapp(bigint[])` | RPC penulisan publik melalui server, eksekusi hanya service_role, memastikan produk aktif. |
| Storage `produk` | Bucket privat, maksimal 3 MB, JPEG/PNG/WebP; insert/select/delete objek hanya sesi authenticated. |

RLS aktif pada tabel baru. Admin dapat mengelola kategori/ulasan dan membaca klik. Publik tidak memiliki akses tabel atau eksekusi RPC langsung. Kunci rahasia tetap hanya di server; penulisan publik ulasan/klik adalah pengecualian eksplisit US-38/US-40. Pengelolaan toko/upload tetap memakai sesi admin.

Harga lama nol tetap sah pada skema asli. Form tambah/ubah kini mensyaratkan harga positif. Foto diunggah dengan nama UUID dan disimpan sebagai URL aplikasi; route media memeriksa rujukan produk aktif sebelum mengunduh objek dari Storage.

Panduan SQL Editor, aktivasi, daftar file, hasil verifikasi, dan uji Production: [bonus-us21-us40.md](bonus-us21-us40.md).
