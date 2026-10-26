# Jurnal Prompt

Catat prompt penting selama membangun aplikasi: apa yang kamu minta, hasilnya, dan perbaikan yang dilakukan. Beri tanda **[SENDIRI]** untuk prompt yang kamu tulis sendiri (bukan dari lembar kerja).

## US-01 Katalog dari database

**Prompt:**

**Hasil:**

**Perbaikan:**

## US-02 Detail produk

**Prompt:**

**Hasil:**

**Perbaikan:**

## US-03 Pesan via WhatsApp

**Prompt:**

**Hasil:**

**Perbaikan:**

## US-04 Login admin

**Prompt:**

**Hasil:**

**Perbaikan:**

## US-05 Ganti password

**Prompt:**

**Hasil:**

**Perbaikan:**

## US-06 Proteksi halaman admin

**Prompt:**

**Hasil:**

**Perbaikan:**

## Debugging dan fitur bonus

Tambahkan bagian baru untuk setiap error yang kamu perbaiki atau fitur bonus yang kamu kerjakan.

### US-07 List produk dari database

**Prompt pengguna [SENDIRI]:** "Sudah LULUS, sekarang check docs/userstories.md dan tingkatkan scorenya melalui bonus US-07 sampai US-10!" Dilanjutkan dengan permintaan implementasi rencana bonus US-07–US-10.

**Hasil:** `/admin` menjadi Server Component asinkron, memverifikasi sesi admin di server, lalu mengambil tabel `produk` melalui koneksi sesi Supabase. Data contoh tidak lagi dipakai. Kegagalan memuat dan database kosong mempunyai pesan berbeda.

**Perbaikan:** Koneksi sesi dapat dipakai dalam Server Component yang hanya boleh membaca cookie; pembaruan cookie tetap ditangani `proxy.js`. Pemeriksaan sesi tersedia melalui helper bersama dan tetap dilakukan pada setiap aksi perubahan.

### US-08 Tambah produk

**Prompt:** Implementasikan bagian US-08 pada rencana yang disetujui: sambungkan form tambah ke Server Action, simpan kolom produk yang diizinkan, periksa login di server, lalu kembali ke `/admin`.

**Hasil:** Server Action `tambahProduk` menyimpan nama, harga, kategori, link foto, dan deskripsi melalui sesi admin. Nama wajib dan harga rupiah bulat nonnegatif divalidasi di server. Link foto menerima URL HTTP(S) atau path lokal. Form menampilkan error, mempertahankan isian, dan menonaktifkan input saat menyimpan. Setelah berhasil, cache katalog diperbarui dan admin menerima pesan sukses.

**Perbaikan:** Validasi menolak harga kosong, negatif, pecahan, atau melebihi batas integer database. Field tambahan seperti `id` dan `created_at` dari form tidak ikut disimpan. Formulir dengan bentuk tidak valid juga ditolak.

### US-09 Ubah produk

**Prompt:** Implementasikan bagian US-09: ambil data lama berdasarkan ID dari database, isi form ubah, lalu simpan perubahan melalui Server Action yang memeriksa sesi admin.

**Hasil:** Halaman ubah membaca produk dari database setelah verifikasi sesi. ID tidak valid dan produk tidak ditemukan diarahkan ke halaman 404. Server Action `ubahProduk` memfilter perubahan berdasarkan ID, memvalidasi input, serta memperbarui cache daftar, katalog, detail, dan form ubah.

**Perbaikan:** Pengujian menemukan bahwa ID `null` pada aksi ubah dapat disalahartikan sebagai mode tambah. Mode tambah/ubah sekarang eksplisit, sehingga ID ubah kosong ditolak. Kegagalan mengambil data dibedakan dari produk yang memang tidak ditemukan.

### US-10 Hapus produk

**Prompt:** Implementasikan bagian US-10: tombol hapus meminta konfirmasi inline yang menyebut nama produk, pilihan batal tidak menghapus, dan Server Action tetap memverifikasi login sebelum menghapus satu produk.

**Hasil:** Tombol "Hapus" membuka konfirmasi "Batal" / "Ya, hapus". Server Action `hapusProduk` memeriksa sesi dan ID, menghapus hanya baris tujuan, serta memeriksa hasil penghapusan. Error ditampilkan tanpa membocorkan detail database; keberhasilan memperbarui cache dan kembali ke daftar dengan pesan sukses.

**Perbaikan:** Form penghapusan baru ditampilkan setelah pengguna memilih "Hapus". Tombol konfirmasi dinonaktifkan selama proses. Produk yang sudah tidak ada tidak menghasilkan pesan sukses palsu.

### Verifikasi US-07–US-10

**Hasil pengujian otomatis:** `npm test` menjalankan 10 pengujian dengan modul Server Action dan helper autentikasi asli, serta pengganti batas Next.js/Supabase. Mencakup siklus tambah–ubah–hapus pada data uji dalam memori, pembatasan perubahan ke ID tujuan, penolakan sesi kosong/error, validasi input dan ID, produk tidak ditemukan, revalidasi cache, serta kegagalan database. Sepuluh pengujian lulus; pengujian ini tidak menulis ke database toko.

**Build:** `npm run build` berhasil. Ada peringatan Next.js mengenai lockfile di folder induk; build tetap selesai.

**Pengujian HTTP lokal:** Server produksi lokal mengalihkan `/admin`, `/admin/password`, `/admin/produk/baru`, dan `/admin/produk/1/ubah` tanpa login ke halaman login (307). Halaman login memberi respons 200. Katalog berhasil membaca delapan produk dari Supabase sebenarnya; detail produk merespons 200 dan memuat link WhatsApp; ID tidak ditemukan merespons 404. Ketiga Server Action dipanggil langsung tanpa sesi melalui rute login yang tidak diproteksi proxy: semuanya mengalihkan ke login, membuktikan pemeriksaan sesi di dalam aksi.

**Kendala lingkungan:** Koneksi Supabase awalnya ditolak sandbox (`EACCES`); pemeriksaan dengan izin jaringan berhasil. Tidak ada browser atau sesi admin terhubung untuk menguji interaksi visual dan CRUD login pada database sebenarnya.

**Pengujian lanjutan pengguna:** Login sebagai admin, tambah satu produk uji, pastikan muncul di daftar dan katalog, ubah dan periksa detailnya, batalkan hapus, kemudian konfirmasi hapus dan pastikan detail menjadi 404. Periksa pada lebar HP sekitar 390 px. Setelah perubahan dikirim dan deployment Production selesai, ulangi pada link Vercel dan kirim ulang karya untuk penilaian bonus. Hasil Production dan interaksi browser belum diverifikasi oleh agent.
