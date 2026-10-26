# Skema Database

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
