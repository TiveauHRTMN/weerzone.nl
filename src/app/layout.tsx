import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, JetBrains_Mono } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
import FounderBanner from "@/components/FounderBanner";
import GlobalPersonaModal from "@/components/GlobalPersonaModal";
import { Providers } from "./providers";
import PostHogPageView from "@/components/PostHogPageView";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const ADSENSE_CLIENT = "ca-pub-6187487207780127";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

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
    default: "WEERZONE | De nauwkeurigste weersvoorspelling van Nederland",
    template: "%s | WEERZONE",
  },
  description:
    "WeerZone is de nauwkeurigste weersvoorspelling van Nederland. Voor jouw postcode, op 1 bij 1 kilometer, tot 48 uur vooruit.",
  keywords: [
    "weer", "weer nederland", "weerbericht", "weersverwachting", "weer vandaag",
    "weer morgen", "48 uur weer", "weer komende 48 uur", "regen verwachting",
    "WEERZONE", "nauwkeurig weer", "weerzone.nl",
    "buienradar alternatief", "weerbericht nederland", "actueel weer",
    "neerslagverwachting", "zonkracht vandaag", "weerstation nederland",
  ],
  openGraph: {
    title: "WEERZONE | De nauwkeurigste weersvoorspelling van Nederland",
    description: "De nauwkeurigste weersvoorspelling van Nederland. Op 1 bij 1 kilometer, tot 48 uur vooruit.",
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
    title: "WEERZONE | De nauwkeurigste weersvoorspelling van Nederland",
    description: "De nauwkeurigste weersvoorspelling van Nederland. Op 1 bij 1 kilometer, tot 48 uur vooruit.",
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
    <html lang="nl" className={`${manrope.variable} ${jetbrains.variable} antialiased`}>
      <head>
        <meta name="theme-color" content="#4a9ee8" />
      </head>
      <body className="min-h-screen">
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
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
