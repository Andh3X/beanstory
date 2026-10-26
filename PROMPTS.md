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

### Bonus US-21–US-40 (26 Oktober 2026)

**Prompt pengguna [SENDIRI]:** "Sekarang lanjutkan mulai US-21 sampai US-40", dilanjutkan permintaan **PLEASE IMPLEMENT THIS PLAN** untuk seluruh 20 user story. Pengguna secara eksplisit mengizinkan pengerjaan banyak user story dalam satu prompt dan memilih ulasan valid langsung ditampilkan. Potensi bonus 195 poin; tidak menganggap skor otomatis bertambah tanpa penilaian ulang.

**US-21–US-24, US-36–US-37:** Keranjang, favorit, riwayat, dan perbandingan memakai provider browser bersama dengan kunci berversi. Persistensi hanya ID/jumlah; data terkini diambil dari server. Keranjang memakai diskon, memeriksa stok/aktif, dan mengirim satu pesan WhatsApp tanpa reservasi/pengurangan stok. Batas 20/50/6/2 diterapkan; pilihan pembanding ketiga ditolak. Halaman Tentang memakai identitas toko yang tersedia dan tombol bagikan memakai Web Share/clipboard dengan pesan hasil.

**US-25–US-28:** Tema terang/gelap/sistem diterapkan sebelum tampilan awal melalui skrip eksternal, dengan token untuk seluruh antarmuka dan warna tombol terpisah dari tautan. Metadata produk, canonical, Open Graph, sitemap produk aktif dalam batch, robots, serta skeleton ditambahkan. SITE_URL memiliki default domain Bean Story.

**US-29–US-35:** Form menerima satu foto JPEG/PNG/WebP maksimal 3 MB dengan validasi tipe/signature/ukuran di server; upload menggantikan link utama. Bucket privat memakai sesi admin, nama UUID, URL media aplikasi relatif, dan pemeriksaan rujukan produk aktif. Upload baru dibersihkan jika penyimpanan gagal; foto lama tidak dihapus otomatis. Dashboard agregasi seluruh produk terpisah dari pencarian, daftar admin 12 baris per halaman. Kategori memakai dropdown database dan FK cascade/restrict. Status aktif menyaring seluruh fitur publik. Harga baru/perubahan wajib positif dengan error per field dan isian/file tetap tersimpan saat gagal. Ekspor CSV terproteksi, mencakup nonaktif, dibaca dalam batch, memakai BOM/escaping dan perlindungan formula.

**US-38–US-40:** Server Action ulasan memvalidasi panjang nama/komentar, rating dan honeypot, kemudian memanggil RPC sempit di server; ulasan valid langsung terlihat. Daftar publik 20 per halaman dan rata-rata dari seluruh ulasan terlihat. Moderasi admin menyembunyikan/menampilkan kembali/menghapus dengan pemeriksaan sesi. Klik WhatsApp memakai beacon/fetch keepalive dan mencatat produk/waktu tanpa identitas pengunjung. Penulisan publik ulasan/klik adalah pengecualian eksplisit yang disetujui; RPC hanya dapat dieksekusi service_role. Pengelolaan toko tetap memakai sesi admin dan RLS.

**Database dan aktivasi:** Migrasi idempoten terpisah `docs/migrations/002-us21-us40.sql` menambahkan objek baru tanpa mengubah schema.sql asli atau RLS produk. Migrasi harus dijalankan pengguna melalui Supabase SQL Editor sebelum deployment. Pemeriksaan baca saja pada Supabase asli menemukan kolom aktif belum tersedia (42703); agent tidak mempunyai koneksi SQL administratif dan tidak menjalankan migrasi live. Panduan langkah klik, daftar file, serta pengujian ada di `docs/bonus-us21-us40.md`.

**Perbaikan dari pengujian:** Loading tingkat root menyebabkan notFound tampil dengan HTTP 200 akibat streaming. Batas loading katalog dipindahkan ke Suspense dan pemeriksaan produk ditempatkan di layout sebelum loading detail; HTTP 404 kembali benar. Pengujian HTTP juga menemukan hostname internal Next.js dapat berbeda dari Host browser; pemeriksaan origin pencatatan disesuaikan agar klik sah tidak ditolak. Beacon yang melempar error sekarang tetap mencoba fetch keepalive. File terlalu besar juga ditolak di browser sebelum mencapai batas payload framework, sambil tetap divalidasi ulang di server.

**Verifikasi:** 53 pengujian otomatis lulus dan build Production berhasil (peringatan lockfile folder induk sudah ada sebelumnya). Skrip `node scripts/verify-us21-us40-http.mjs` lulus dengan build Next.js dan Supabase pengganti dalam memori: katalog/detail/metadata/sitemap/perbandingan/404, proteksi login, CRUD/validasi, upload/media, kategori/status, ulasan langsung tampil/moderasi/perubahan rata-rata, klik unik dan CSV. Simulasi kategori tidak membuktikan FK PostgreSQL asli. Unit test mencakup penolakan sesi, storage rusak/tidak tersedia, batas pilihan, diskon/stok, upload palsu/besar/gagal/cleanup, CSV dan batch >1.000 baris, ulasan/honeypot, beacon/fetch dan service worker. Pengujian tidak menulis ke Supabase toko.

**Belum diverifikasi:** SQL/idempotensi/FK/RLS/Storage pada database asli, interaksi browser, login dan mutasi live, lebar 390 px, reload tema dalam browser, dan Production. Tidak ada browser atau koneksi SQL administratif terhubung; Docker engine lokal tidak berjalan. Langkah uji pengguna setelah migrasi/deployment disertakan. Push/deployment dilakukan pengguna; agent tidak memasang paket atau menjalankan perintah Git. Timeout 524 layanan penilai dipisahkan dari hasil aplikasi.

### Bonus US-41–US-50

**Prompt pengguna [SENDIRI]:** "Sekarang eksekusi US-41 sampai US-50". Izin pengerjaan banyak user story dalam satu prompt yang diberikan sebelumnya tetap dipakai. Potensi bonus tambahan 125 poin; skor tetap menunggu deployment dan penilaian ulang.

**US-41–US-43:** Dashboard memakai agregasi lima produk dengan klik WhatsApp terbanyak, dengan pesan kosong/error. Banner singleton dapat dibuat/diubah/nonaktifkan dari admin; beranda hanya membaca banner aktif. Identitas toko dan WhatsApp dikelola dalam database, dipakai header/footer/tentang/katalog/metadata/manifest/pesan langsung/keranjang, dengan lib/toko.js sebagai cadangan. Nomor internasional serta URL banner divalidasi server. Pembacaan cadangan diberi timeout dan manifest dinamis.

**US-44:** Tambah/list/nonaktifkan/aktifkan kembali/hapus akun melalui server Supabase Auth Admin API. Setiap aksi diawali pemeriksaan getUser dan registry admin aktif. Registry serta kebijakan RLS restrictive menolak token lama admin nonaktif, termasuk Storage produk. Akun sendiri dilindungi di aplikasi dan RPC; RPC mengunci perubahan status untuk mencegah dua pemanggil saling menonaktifkan hingga tidak ada admin aktif. Semua admin aktif mempunyai hak pengelolaan yang sama. Password awal tidak disimpan di tabel/log. Kegagalan registrasi membersihkan akun Auth baru; kegagalan Auth setelah menonaktifkan tetap membiarkan registry nonaktif dan memberikan pesan keadaan parsial. Public signup tetap dimatikan.

**US-45–US-47:** Trigger database mencatat pelaku/aksi/produk/waktu untuk perubahan produk dalam transaksi yang sama, termasuk impor/status/urutan. Halaman admin menampilkan 50 terakhir. Impor CSV UTF-8 maksimal 1 MB/500 produk mendukung kutip/koma/baris baru, validasi per baris dan nomor fisik, lalu satu insert batch bagi baris valid. ID/created_at tidak ikut ditulis dan kategori harus sudah ada. Posisi produk dikelola lewat RPC atomik Naik/Turun; Pilihan toko menjadi default katalog, pilihan harga/terbaru tetap tersedia.

**US-48–US-49:** Varian disimpan per produk dengan nama unik dan harga positif, dikelola pada halaman admin tersendiri. Harga pilihan menggantikan harga dasar tanpa diskon tambahan; stok dibagi lintas varian. Keranjang v2 menyimpan ID varian/jumlah dan memuat cadangan v1; harga terkini diambil server, varian hilang memblokir checkout. Kategori mendapat slug unik yang tetap saat rename, halaman publik berfilter aktif/paginasi/pencarian/urutan, 404 sebelum streaming, link kategori pada kartu/detail, dan entri sitemap. Katalog diekstrak ke komponen server bersama agar halaman kategori tidak mengimpor module halaman beranda.

**US-50:** Form pertanyaan 3–500 karakter/honeypot memanggil Server Action publik. Gemini hanya memilih key fakta dari konteks produk aktif; server merangkai jawaban dari nilai katalog, sehingga teks/klaim baru model tidak diteruskan. Output/context dibatasi, timeout model 15 detik, error konfigurasi/kuota/jaringan ditangani. Kuota lintas instance melalui RPC service-role (5/browser/menit, 30 global/menit), cookie acak HttpOnly bertanda tangan, DB hanya hash token/hitungan per jendela menit tanpa IP/pertanyaan. Pengecualian penulisan publik pembatas AI didokumentasikan; pengelolaan toko tetap sesi admin dan RLS.

**Perbaikan dari verifikasi:** Pengujian lama disesuaikan untuk registry admin aktif, default urutan toko, identitas dinamis, dan manifest asinkron. Pemeriksaan angka klik HTTP memperhitungkan komentar pemisah teks React. Kegagalan insert registry yang melempar exception juga membersihkan akun baru, tidak hanya error yang dikembalikan SDK. File CSV dipertahankan saat gagal dan dibersihkan setelah ada keberhasilan agar pengulangan impor memerlukan pilihan file kembali. Label harga dasar dibedakan dari harga varian.

**Verifikasi:** 73 pengujian otomatis lulus, termasuk 20 skenario tambahan. Build Production berhasil. Skrip HTTP baru menjalankan regresi dan seluruh fitur baru melalui build Next.js dengan Supabase/Auth/Gemini pengganti dalam memori, termasuk perubahan nomor WA, banner aktif/nonaktif, siklus akun dan penolakan JWT registry nonaktif, impor campuran, urutan, varian, kategori/sitemap/404, AI dan kuota keenam. Hook provider hanya dimuat proses uji; kunci dummy, tanpa perubahan database/akun/model live. Pemeriksaan browser menghasilkan apps=[]/browsers=[].

**Aktivasi dan batas verifikasi:** Migrasi baru docs/migrations/003-us41-us50.sql disiapkan terpisah, wajib dijalankan melalui Supabase SQL Editor sebelum deployment. Kebijakan lama tetap aktif dan diberi syarat restrictive admin aktif; docs/schema.sql asli tidak diubah. SQL/RLS/trigger/lock/idempotensi pada PostgreSQL sebenarnya, Auth/Storage/Gemini live, tampilan 390 px, interaksi browser dan Production belum diverifikasi. Panduan langkah aktivasi, daftar file, perilaku, serta uji lengkap ada di docs/bonus-us41-us50.md. Tidak memasang paket npm atau menjalankan perintah Git; push/deployment dilakukan pengguna.
