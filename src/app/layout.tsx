import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "./providers";
import PostHogPageView from "@/components/PostHogPageView";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://weerzone.nl"),
  title: {
    default: "WEERZONE | Weerkeuzes voor vandaag en morgen",
    template: "%s | WEERZONE",
  },
  description:
    "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Hyperlokaal, tot 48 uur vooruit.",
};

const globalSchemasLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    logo: "https://weerzone.nl/weerzone-icon.png",
    description:
      "Nederlandse hyperlocale weerdienst voor 48-uur weersverwachtingen per stad en provincie.",
    areaServed: { "@type": "Country", name: "Nederland" },
    inLanguage: "nl-NL",
    sameAs: [
      "https://www.youtube.com/@weerzone",
      "https://x.com/weerzone",
      "https://www.instagram.com/weerzonenl",
      "https://www.tiktok.com/@weerzonenl",
      "https://www.reddit.com/r/weerzone",
      "https://www.wikidata.org/wiki/Q139675943",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    applicationCategory: "WeatherApplication",
    operatingSystem: "Web",
    inLanguage: "nl-NL",
    description:
      "Hyperlokale 48-uur weersverwachting voor alle Nederlandse steden en provincies, vertaald naar praktische keuzes.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Gratis 48-uurs weerbericht op weerzone.nl",
    },
    publisher: { "@type": "Organization", name: "WEERZONE", url: "https://weerzone.nl" },
  },
];

const LOCALE_GLOBAL_SCHEMA = {
  nl: globalSchemasLd,
} as const;

// Root layout wraps alle pagina's met SiteShell. Eerder zat SiteShell in
// (site)/layout.tsx maar dat veroorzaakte een dubbele render in Next.js 16
// (twee identieke <header>+<footer>-paren in de HTML output). Door SiteShell
// hier te renderen wordt de async layer geëlimineerd en is er gegarandeerd
// maar één instance van de chrome.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // LET OP: GEEN headers()/cookies() hier — die zijn dynamic APIs en blokkeren
  // CDN-caching op alle 88k descendants. <html lang="nl"> is een hint voor
  // assistive tech en search; per-pagina hreflang + JSON-LD inLanguage zijn
  // autoritatief voor Google's locale-matching, niet dit attribuut.
  // De /de, /fr, /es route-group layouts injecteren hun eigen JSON-LD,
  // dus we shippen hier alleen de NL globalSchemasLd als baseline.
  return (
    <html lang="nl" className="antialiased">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen">
        <Providers>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <SiteShell globalSchemasLd={LOCALE_GLOBAL_SCHEMA.nl}>
            {children}
          </SiteShell>
        </Providers>
      </body>
    </html>
  );
}
