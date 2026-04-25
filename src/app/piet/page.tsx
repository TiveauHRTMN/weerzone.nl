import type { Metadata } from "next";
import Link from "next/link";
import PietExtended from "@/components/PietExtended";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = {
  title: "Piet — Hyperlokaal weerbericht voor jouw straat",
  description:
    "Een eerlijke, korte weerbrief voor de komende 48 uur op jouw GPS-locatie. In gewone taal, zonder reclame, zonder gokwerk over twee weken vooruit.",
  alternates: { canonical: "https://weerzone.nl/piet" },
  openGraph: {
    title: "Piet — Het eerlijke 48-uurs weerbericht | Weerzone",
    description:
      "48 uur vooruit voor jouw locatie. Eerlijk, kort, persoonlijk — geen glazen-bol-praat over twee weken vooruit.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Piet — Hyperlokaal 48-uurs weerbericht",
  description:
    "De dagelijkse, eerlijke weeranalyse van Piet voor jouw GPS-locatie. Geen 14-daagse-gok, gewoon de komende 48 uur in gewone taal.",
  author: {
    "@type": "Organization",
    name: "Weerzone",
  },
  publisher: {
    "@type": "Organization",
    name: "Weerzone",
    logo: "https://weerzone.nl/favicon-icon.png",
  },
  datePublished: new Date().toISOString().split("T")[0],
};

export default function PietPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#3b7ff0] text-white px-4 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <header className="flex flex-col items-center mb-10 pt-2">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <img
                src="/weerzone-logo.png"
                alt="Weerzone"
                style={{ height: "60px", width: "auto" }}
                className="drop-shadow-md"
              />
            </Link>
          </header>

          <header className="mb-10">
            <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-4 tracking-tighter">
              Piet
            </h1>
            <p className="text-white/90 text-lg leading-relaxed font-medium">
              De volledige 48 uur voor jouw locatie. In gewone taal, met
              concrete tips voor je dag — betrouwbaar en lokaal, voor
              elke straat van Nederland.
            </p>
          </header>

          <PremiumGate>
            <PietExtended />
          </PremiumGate>

          <p className="mt-12 text-center text-white/50 text-xs font-medium">
            Verder dan 48 uur kijken we niet vooruit. Dan wordt het gokken
            — en dat doen we niet.
          </p>
        </div>
      </main>
    </>
  );
}
