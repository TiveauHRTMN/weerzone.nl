import type { Metadata } from "next";

// (site) is een route group. SiteShell wordt gerenderd vanuit de root
// layout (src/app/layout.tsx) — hier alleen metadata en pass-through,
// anders krijg je dubbele GlobalNav/Footer (Next.js 16 PPR-streaming
// rendert async layouts soms twee keer in dezelfde HTML response).

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/weerzone-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/weerzone-icon.png",
  },
  title: {
    default: "WEERZONE | Weerkeuzes voor vandaag en morgen",
    template: "%s | WEERZONE",
  },
  description:
    "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Helder, reclamevrij en tot 48 uur vooruit.",
  openGraph: {
    title: "WEERZONE | Weerkeuzes voor vandaag en morgen",
    description: "Helder weerbericht voor concrete keuzes in de komende 48 uur.",
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
    title: "WEERZONE | Weerkeuzes voor vandaag en morgen",
    description: "Helder weerbericht voor concrete keuzes in de komende 48 uur.",
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
  verification: {
    google: "NwNAWZ0Op3b4pguSizj32bSXRf4gpQRfTzhEPFyu2B8",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
