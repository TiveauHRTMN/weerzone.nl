import type { Metadata } from "next";
import { Inter, Outfit, Manrope } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
import FounderBanner from "@/components/FounderBanner";
import GlobalPersonaModal from "@/components/GlobalPersonaModal";
import PaperclipAssistant from "@/components/PaperclipAssistant";
import { Providers } from "./providers";
import PostHogPageView from "@/components/PostHogPageView";
import { Suspense } from "react";
import "./globals.css";

const ADSENSE_CLIENT = "ca-pub-6187487207780127";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    default: "WEERZONE | 48 uur weersverwachting. De rest is ruis.",
    template: "%s | WEERZONE",
  },
  description:
    "WEERZONE.nl — Het eerlijke weerbericht. Vergeet de 14-daagse gok. Komende 48 uur uiterst nauwkeurig dankzij KNMI HARMONIE data op de vierkante meter.",
  keywords: [
    "weer", "weer nederland", "weerbericht", "weersverwachting", "weer vandaag",
    "weer morgen", "48 uur weer", "weer komende 48 uur", "regen verwachting",
    "WEERZONE", "nauwkeurig weer", "KNMI", "KNMI HARMONIE", "weerzone.nl",
    "buienradar alternatief", "weerbericht nederland", "actueel weer",
    "neerslagverwachting", "zonkracht vandaag", "weerstation nederland",
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
  verification: {
    google: "NwNAWZ0Op3b4pguSizj32bSXRf4gpQRfTzhEPFyu2B8",
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

import { getSupabase } from "@/lib/supabase";
import AffiliateBanner from "@/components/AffiliateBanner";

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
    <html lang="nl" className={`${inter.variable} ${outfit.variable} ${manrope.variable} antialiased`}>
      <head>
        <meta name="theme-color" content="#4a9ee8" />
        {/* AdSense loader — native script in head, voorkomt data-nscript warning */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen">
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

          {children}
          <CookieBanner />
          <InstallPrompt />
          <FounderBanner />
          <GlobalPersonaModal />
          <PaperclipAssistant />
        </Providers>
      </body>
    </html>
  );
}
