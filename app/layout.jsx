import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PasangAplikasi from "@/components/PasangAplikasi";
import { toko } from "@/lib/toko";
import PilihanProvider from "@/components/PilihanProvider";
import { siteUrl } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: toko.nama,
  description: toko.tagline,
  appleWebApp: { capable: true, title: toko.nama, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport = { themeColor: "#1f6b4f" };

export default function RootLayout({ children }) {
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
        <PilihanProvider>
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
        <PasangAplikasi />
        <Footer />
        </PilihanProvider>
      </body>
    </html>
  );
}
