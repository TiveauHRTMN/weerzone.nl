import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
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
  title: {
    default: "WeerZone — 48 uur. De rest is gelul.",
    template: "%s | WeerZone",
  },
  description:
    "WeerZone.nl — De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON: 48 uur extreem nauwkeurig weer. Geen 14-daagse onzin, gewoon de waarheid.",
  keywords: [
    "weer", "weer nederland", "weerbericht", "weersverwachting", "weer vandaag",
    "weer morgen", "48 uur weer", "fietsweer", "regen verwachting", "weerzone",
    "nauwkeurig weer", "KNMI", "KNMI HARMONIE", "DWD ICON", "weerbericht vandaag",
    "temperatuur nederland", "wind nederland", "neerslag radar", "buienradar alternatief",
  ],
  openGraph: {
    title: "WeerZone — 48 uur. De rest is gelul.",
    description: "De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON. 48 uur extreem nauwkeurig. Geen verzonnen 14-daagse onzin.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
    siteName: "WeerZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "WeerZone — 48 uur. De rest is gelul.",
    description: "De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON. 48 uur extreem nauwkeurig.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4a9ee8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen">
        {children}
        <CookieBanner />
        <InstallPrompt />
      </body>
    </html>
  );
}
