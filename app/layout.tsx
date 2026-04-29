import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fauqiyya – Air Mineral Premium",
  description: "Pesan air mineral Fauqiyya berkualitas tinggi langsung dari sumbernya. Segar, murni, terpercaya.",
  keywords: "air mineral, Fauqiyya, air minum, mineral water",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Plus_Jakarta_Sans,system-ui,sans-serif] antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
