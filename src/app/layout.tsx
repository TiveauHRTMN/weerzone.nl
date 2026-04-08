import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeerZone — Het weer, maar dan eerlijk",
  description:
    "WeerZone.nl — Nauwkeurig weer voor Nederland met KNMI HARMONIE en DWD ICON modellen. 48-uurs voorspelling, fietsweer, en eerlijk weeradvies.",
  keywords: ["weer", "nederland", "weersverwachting", "weerbericht", "weer vandaag", "48 uur weer", "fietsweer", "regen", "weerzone"],
  openGraph: {
    title: "WeerZone — Het weer, maar dan eerlijk",
    description: "Nauwkeurig weer voor Nederland. KNMI HARMONIE + DWD ICON modellen. 48 uur betrouwbaar.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
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
