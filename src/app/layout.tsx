import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KutWeer — Het weer, maar dan eerlijk",
  description:
    "KutWeer.nl — Het weer in normaal Nederlands. Geen onzin, geen 14-daagse fantasie. Gewoon eerlijk weeradvies met een vleugje sarcasme.",
  keywords: ["weer", "nederland", "weersverwachting", "kutweer", "regen", "fietsweer"],
  openGraph: {
    title: "KutWeer — Het weer, maar dan eerlijk",
    description: "Het weer in normaal Nederlands. Geen onzin, gewoon eerlijk.",
    type: "website",
    locale: "nl_NL",
    url: "https://kutweer.nl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
