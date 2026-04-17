import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
import { Providers } from "./providers";
import "./globals.css";

const ADSENSE_CLIENT = "ca-pub-6187487207780127";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://weerzone.nl"),
  icons: {
    icon: [
      { url: "/favicon-icon.png", type: "image/png" },
    ],
    shortcut: "/favicon-icon.png",
    apple: "/favicon-icon.png",
  },
  title: {
    default: "WEERZONE | 48 uur vooruit. De rest is ruis.",
    template: "%s | WEERZONE | 48 uur vooruit. De rest is ruis.",
  },
  description:
    "WEERZONE.nl — Vergeet de 14-daagse. De komende 48 uur vooruit. De rest is ruis. KNMI HARMONIE data op de vierkante meter.",
  keywords: [
    "weer", "weer nederland", "weerbericht", "weersverwachting", "weer vandaag",
    "weer morgen", "48 uur weer", "weer komende 48 uur", "fietsweer", "regen verwachting",
    "WEERZONE", "nauwkeurig weer", "KNMI", "KNMI HARMONIE", "weerzone.nl",
  ],
  openGraph: {
    title: "WEERZONE | 48 uur vooruit. De rest is ruis.",
    description: "Vergeet de 14-daagse. De komende 48 uur vooruit. De rest is ruis. De enige weerdienst die de waarheid deelt.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
    siteName: "WEERZONE",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WEERZONE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE | 48 uur vooruit. De rest is ruis.",
    description: "Vergeet de 14-daagse. De komende 48 uur vooruit. De rest is ruis.",
    images: ["/og-image.png"],
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WEERZONE",
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
        <meta name="theme-color" content="#4a9ee8" />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          {children}
          <CookieBanner />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
