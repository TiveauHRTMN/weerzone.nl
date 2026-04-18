import type { Metadata } from "next";
import Link from "next/link";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Onweer vandaag in Nederland — live CAPE-waarden per uur | WEERZONE",
  description:
    "Onweer vandaag in Nederland? Bekijk live de CAPE-waarden (onweersenergie) per uur per stad. KNMI HARMONIE + DWD ICON. De enige site die je echt vertelt óf en wanneer het onweert.",
  keywords: [
    "onweer vandaag",
    "onweer nederland",
    "onweer morgen",
    "cape waarde onweer",
    "onweersradar",
    "wanneer gaat het onweren",
    "onweer verwachting",
    "bliksem vandaag",
    "onweer knmi",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/onweer" },
  openGraph: {
    title: "Onweer vandaag — WEERZONE",
    description: "Live CAPE-waarden per uur per Nederlandse stad.",
    url: "https://weerzone.nl/weer/onweer",
    type: "website",
    locale: "nl_NL",
    siteName: "WEERZONE",
  },
};

export default function OnweerPage() {
  const topCities = DUTCH_CITIES.slice(0, 12);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Wat is een CAPE-waarde?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CAPE (Convective Available Potential Energy, in J/kg) meet hoeveel energie er in de atmosfeer zit om onweer te vormen. Onder 500 is rustig. 500-1500 is lichte buienkans. 1500-2500 is serieus onweer. Boven 2500 wordt het zwaar: windstoten, hagel, of erger.",
        },
      },
      {
        "@type": "Question",
        name: "Gaat het vandaag onweren in Nederland?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kies je stad op WEERZONE en je ziet de CAPE-waarde per uur. Als CAPE boven 1000 komt én er is neerslag voorspeld, dan is onweerskans reëel. Geen giswerk — gewoon de ruwe modeldata.",
        },
      },
      {
        "@type": "Question",
        name: "Hoe nauwkeurig is onweersvoorspelling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Onweer is lokaal en grillig. Modellen zoals HARMONIE en ICON zien de condities, niet de exacte bliksemflits. WEERZONE laat CAPE + neerslag + wind zien, zodat jij zelf de risico-inschatting kan maken.",
        },
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: "Onweer", item: "https://weerzone.nl/weer/onweer" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WEERZONE</Link>
            <span className="mx-2">/</span>
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Onweer</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">⛈️</div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Onweer vandaag in Nederland — live.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              De meeste weerapps zeggen &ldquo;kans op onweer&rdquo; en laten je raden. WEERZONE laat je
              de <strong className="text-white">CAPE-waarde per uur</strong> zien — de ruwe energie in de atmosfeer.
              Boven 1500 J/kg wordt het serieus. Kies je stad en je ziet het.
            </p>
          </header>

          <section className="mb-10 space-y-4 text-white/75 leading-relaxed">
            <h2 className="text-2xl font-bold text-white">Wat is CAPE eigenlijk?</h2>
            <p>
              CAPE staat voor <em>Convective Available Potential Energy</em>. Hoe hoger, hoe onstabieler
              de atmosfeer — en hoe groter de kans dat er binnen een paar uur een onweersbui ontstaat.
              Meteorologen gebruiken het dagelijks; de consument zag het nooit. Tot nu.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <div className="text-xs text-green-300 font-bold">&lt; 500</div>
                <div className="text-[11px] text-white/60">Rustig</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                <div className="text-xs text-yellow-300 font-bold">500–1500</div>
                <div className="text-[11px] text-white/60">Lichte buien</div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                <div className="text-xs text-orange-300 font-bold">1500–2500</div>
                <div className="text-[11px] text-white/60">Serieus onweer</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                <div className="text-xs text-red-300 font-bold">&gt; 2500</div>
                <div className="text-[11px] text-white/60">Code geel/oranje</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Wanneer gaat het onweren?</h2>
            <p>
              Onweer in Nederland piekt in de late middag en vroege avond, vooral in de zomer. Warme,
              vochtige lucht stijgt op, koelt af, en dondert. In de winter is onweer zeldzaam maar
              heftig — vaak gekoppeld aan koufronten uit het noordwesten. Kies hieronder je stad en je
              ziet per uur of de CAPE boven de drempel komt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Bekijk onweerskans per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topCities.map((c) => {
                const slug = c.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={c.name}
                    href={`/weer/${slug}`}
                    className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-semibold transition-all"
                  >
                    Onweer {c.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Link href="/weer" className="text-sm text-accent-orange hover:underline">
                → Alle Nederlandse steden
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
