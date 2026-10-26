import NavAdmin from "@/components/NavAdmin";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { ubahPasswordAdmin } from "@/app/admin/actions";

const pesanStatus = {
  success: { teks: "Password berhasil diperbarui.", kelas: "text-utama", role: "status" },
  "too-short": {
    teks: "Password baru harus terdiri dari minimal 8 karakter.",
    kelas: "text-bahaya",
    role: "alert",
  },
  mismatch: {
    teks: "Konfirmasi password tidak sama dengan password baru.",
    kelas: "text-bahaya",
    role: "alert",
  },
  "session-error": {
    teks: "Sesi admin tidak dapat diverifikasi. Silakan coba lagi atau login kembali.",
    kelas: "text-bahaya",
    role: "alert",
  },
  "update-error": {
    teks: "Password gagal diperbarui. Periksa koneksi lalu coba lagi.",
    kelas: "text-bahaya",
    role: "alert",
  },
};

export default async function HalamanGantiPassword({ searchParams }) {
  const { status } = (await searchParams) || {};
  const pesan = pesanStatus[status];

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-extrabold">Ganti password</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Ganti password bawaan segera setelah pertama kali masuk. Minimal 8 karakter.
        </p>
      </div>
      {pesan ? (
        <p role={pesan.role} className={`max-w-sm text-sm ${pesan.kelas}`}>
          {pesan.teks}
        </p>
      ) : null}
      <form action={ubahPasswordAdmin} className="flex max-w-sm flex-col gap-4">
        <Input
          label="Password baru"
          name="password_baru"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          label="Ulangi password baru"
          name="konfirmasi_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Tombol type="submit" className="self-start">
          Simpan password
        </Tombol>
      </form>
    </div>
  );
}
