import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PasangAplikasi from "@/components/PasangAplikasi";
import { ambilToko } from "@/lib/toko-server";
import PilihanProvider from "@/components/PilihanProvider";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const toko=await ambilToko();
  return {
  metadataBase: new URL(siteUrl()),
  title: toko.nama,
  description: toko.tagline,
  appleWebApp: { capable: true, title: toko.nama, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  };
}

export const viewport = { themeColor: "#1f6b4f" };

export default async function RootLayout({ children }) {
  const toko=await ambilToko();
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <PilihanProvider toko={toko}>
        <Header toko={toko} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
        <PasangAplikasi />
        <Footer toko={toko} />
        </PilihanProvider>
      </body>
    </html>
  );
}
