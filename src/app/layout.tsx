import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://weerzone.nl"),
  icons: {
    icon: "/favicon-icon.png",
    apple: "/favicon-icon.png",
  },
  title: "WeerZone — 48 uur. De rest is gelul.",
  description:
    "WeerZone.nl — De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON: 48 uur extreem nauwkeurig weer. Geen 14-daagse onzin, gewoon de waarheid.",
  keywords: ["weer", "nederland", "weersverwachting", "weerbericht", "weer vandaag", "48 uur weer", "fietsweer", "regen", "weerzone", "nauwkeurig weer", "KNMI", "weerbericht vandaag"],
  openGraph: {
    title: "WeerZone — 48 uur. De rest is gelul.",
    description: "De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON. 48 uur extreem nauwkeurig. Geen verzonnen 14-daagse onzin.",
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
      <body className="min-h-screen">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
