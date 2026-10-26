import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { masukAdmin } from "@/app/admin/actions";

export default async function HalamanLogin({ searchParams }) {
  const { error: kodeError } = (await searchParams) || {};
  const pesanError =
    kodeError === "credentials"
      ? "Email atau password salah. Periksa kembali lalu coba lagi."
      : kodeError === "service"
        ? "Login gagal karena layanan autentikasi tidak dapat dihubungi. Coba lagi beberapa saat."
        : null;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold">Masuk admin</h1>
        <p className="mt-1 text-sm text-teks-lembut">Khusus pemilik toko untuk mengelola produk.</p>
      </div>
      <form action={masukAdmin} className="flex flex-col gap-4">
        {pesanError ? (
          <p role="alert" className="rounded-lg border border-bahaya/20 bg-permukaan p-3 text-sm text-bahaya">
            {pesanError}
          </p>
        ) : null}
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Tombol type="submit">Masuk</Tombol>
      </form>
    </div>
  );
}
