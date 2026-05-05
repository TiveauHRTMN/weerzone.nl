import type { Metadata } from "next";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
import FounderBanner from "@/components/FounderBanner";
import GlobalPersonaModal from "@/components/GlobalPersonaModal";
import { Providers } from "./providers";
import PostHogPageView from "@/components/PostHogPageView";
import { Suspense } from "react";
import "./globals.css";

const ADSENSE_CLIENT = "ca-pub-6187487207780127";

export const metadata: Metadata = {
  metadataBase: new URL("https://weerzone.nl"),
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
    "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Hyperlokaal, tot 48 uur vooruit.",
  keywords: [
    "weer",
    "weer nederland",
    "weerbericht",
    "weersverwachting",
    "weer vandaag",
    "weer morgen",
    "48 uur weer",
    "weer komende 48 uur",
    "regen verwachting",
    "WEERZONE",
    "nauwkeurig weer",
    "weerzone.nl",
    "buienradar alternatief",
    "weerbericht nederland",
    "actueel weer",
    "neerslagverwachting",
    "zonkracht vandaag",
    "weerstation nederland",
  ],
  openGraph: {
    title: "WEERZONE | Weerkeuzes voor vandaag en morgen",
    description: "Hyperlokaal weer voor concrete keuzes in de komende 48 uur.",
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
    description: "Hyperlokaal weer voor concrete keuzes in de komende 48 uur.",
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
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

import { getSupabase } from "@/lib/supabase";
import AffiliateBanner from "@/components/AffiliateBanner";
import GlobalNav from "@/components/wz/GlobalNav";

const globalSchemasLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    logo: "https://weerzone.nl/weerzone-icon.png",
    description: "Nederlandse hyperlocale weerdienst voor 48-uur weersverwachtingen per stad en provincie.",
    areaServed: { "@type": "Country", name: "Nederland" },
    inLanguage: "nl-NL",
    sameAs: [
      "https://www.youtube.com/@weerzone",
      "https://x.com/weerzone",
      "https://www.instagram.com/weerzone",
      "https://www.tiktok.com/@weerzone",
      "https://www.reddit.com/r/weerzone",
      "https://www.wikidata.org/wiki/Q139675943"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    applicationCategory: "WeatherApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "nl-NL",
    description: "Hyperlokale 48-uur weersverwachting voor alle Nederlandse steden en provincies, vertaald naar praktische keuzes.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Gratis 48-uurs weerbericht op weerzone.nl",
    },
    publisher: {
      "@type": "Organization",
      name: "WEERZONE",
      url: "https://weerzone.nl",
    },
  },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = getSupabase();
  let activeDeal = null;

  if (supabase) {
    const { data: state } = await supabase
      .from("system_state")
      .select("*")
      .eq("id", "global")
      .single();

    if (state?.is_active) {
      activeDeal = state;
    }
  }

  return (
    <html lang="nl" className="antialiased">
      <head>
        <meta name="theme-color" content="#4a9ee8" />
      </head>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchemasLd) }}
        />
        <Script
          id="adsense-loader"
          strategy="lazyOnload"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        <Providers>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>

          {activeDeal && (
            <AffiliateBanner
              message={activeDeal.flash_deal_message}
              link={activeDeal.flash_deal_link}
              cta="Profiteer nu"
              type={activeDeal.flash_deal_type as any}
            />
          )}

          <GlobalNav />
          {children}
          <CookieBanner />
          <InstallPrompt />
          <FounderBanner />
          <GlobalPersonaModal />
        </Providers>
      </body>
    </html>
  );
}
