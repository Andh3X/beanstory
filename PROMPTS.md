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

### Bonus US-11–US-20

**Prompt pengguna [SENDIRI]:** "sekarang lanjutkan mulai US-11 sampai US-20".

**US-11 — Hasil:** Katalog memiliki pencarian nama dan filter kategori melalui query database, memakai URL GET agar dapat dibagikan dan tetap tersedia saat reload. Hasil kosong mempunyai pesan tersendiri.

**US-12 — Hasil:** Pengunjung dapat memilih jumlah 1–99, dibatasi stok bila diisi. Pesan WhatsApp memuat nama, jumlah, harga satuan, dan total. Jumlah tidak valid tidak menghasilkan tautan pesan.

**US-13 — Hasil:** Manifest App Router, ikon PNG 192/512/maskable/Apple, service worker, offline HTML, dan tombol/petunjuk pemasangan ditambahkan. Harga/stok dan halaman admin tidak dicache. Instalasi pada HP belum diuji secara langsung.

**US-14 — Hasil:** Tombol AI pada form admin memanggil Gemini melalui Server Action yang memeriksa login. Draf mengisi textarea sebelum produk disimpan dan dapat diedit. Input/hasil dibatasi, permintaan timeout 15 detik, error kuota/koneksi ditangani. Kunci hanya di server. **Aktivasi tertunda:** `GEMINI_API_KEY` belum tersedia sehingga generasi live belum diuji.

**US-15 — Hasil:** Urutan termurah, termahal, dan terbaru diterapkan melalui `.order()` database. Harga normal menjadi dasar pengurutan; ID menjadi urutan tambahan yang stabil.

**US-16 — Hasil:** Katalog memakai 12 produk per halaman, exact count, dan `.range()` database. Navigasi mempertahankan filter/urutan, halaman berlebih dibatasi ke halaman terakhir.

**US-17 — Hasil:** Detail menampilkan maksimal tiga produk dari kategori yang sama, mengecualikan produk yang sedang dibuka. Error produk terkait tidak menggagalkan detail utama.

**US-18 — Hasil:** Galeri foto utama dan thumbnail interaktif, serta input maksimal sembilan link tambahan di admin. **Aktivasi tertunda:** kolom `foto_tambahan` harus ditambahkan dengan migrasi sebelum dapat menyimpan beberapa foto di database live.

**US-19 — Hasil:** Stok dapat diisi di admin; 0 menampilkan Habis pada kartu/detail dan meniadakan pemesanan. Stok positif membatasi jumlah pesanan. Stok kosong tidak dibatasi. **Aktivasi tertunda:** kolom `stok` belum ada di database live.

**US-20 — Hasil:** Harga normal dicoret ketika diskon valid; harga diskon dipakai untuk pesan WhatsApp. Badge Baru/Terlaris berasal dari pilihan tersimpan di database. **Aktivasi tertunda:** kolom `harga_diskon` dan `badge` belum ada di database live.

**Perbaikan dan kompatibilitas:** Migrasi disimpan terpisah tanpa mengubah `docs/schema.sql` atau aturan RLS. Form hanya mengirim kolom bonus jika tersedia, sehingga CRUD US-07–US-10 tetap bekerja sebelum migrasi. Validasi server menolak stok negatif, diskon tidak valid, badge di luar pilihan, dan galeri berlebihan. Error publik tidak menampilkan rincian database.

**Verifikasi:** 29 pengujian otomatis dan build berhasil. Pemeriksaan HTTP dengan Supabase asli cocok untuk pencarian, kategori, ketiga urutan, halaman berlebih, detail/404, dan produk terkait. Manifest/ikon/service worker/offline HTML dapat diakses; rute form admin menolak POST tanpa sesi. Pengujian AI sukses/error dan metadata baru memakai pengganti layanan. Tidak ada browser/sesi admin terhubung untuk menguji interaksi, layout HP, atau instalasi PWA. Panduan aktivasi, daftar file, dan langkah uji lengkap tersedia di `docs/bonus-us11-us20.md`.
