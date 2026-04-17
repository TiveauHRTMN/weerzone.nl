import type { Metadata } from "next";
import Link from "next/link";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Weer Nederland — 48 uur vooruit op de vierkante meter | WeerZone",
  description:
    "Het weer in Nederland, stad voor stad. 48 uur messcherp met KNMI HARMONIE + DWD ICON. Geen 14-daagse ruis, gewoon de waarheid — per uur, per gemeente.",
  keywords: [
    "weer nederland",
    "weer vandaag",
    "weer morgen",
    "48 uur weer",
    "weerbericht nederland",
    "weer per stad",
    "knmi weer",
    "nauwkeurig weerbericht",
    "weer nu",
  ],
  alternates: { canonical: "https://weerzone.nl/weer" },
  openGraph: {
    title: "Weer Nederland — WeerZone",
    description:
      "Het weer per Nederlandse stad. 48 uur vooruit met KNMI HARMONIE. De rest is ruis.",
    url: "https://weerzone.nl/weer",
    type: "website",
    locale: "nl_NL",
    siteName: "WeerZone",
  },
};

export default function WeerIndexPage() {
  const cities = [...DUTCH_CITIES].sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Weer Nederland — alle steden",
    url: "https://weerzone.nl/weer",
    description: "Overzicht van het weer in alle Nederlandse steden op WeerZone.",
    isPartOf: { "@type": "WebSite", name: "WeerZone", url: "https://weerzone.nl" },
    hasPart: cities.map((c) => ({
      "@type": "WebPage",
      name: `Weer ${c.name}`,
      url: `https://weerzone.nl/weer/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WeerZone", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer Nederland", item: "https://weerzone.nl/weer" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WeerZone</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Weer Nederland</span>
          </nav>

          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Het weer in Nederland — 48 uur vooruit, op de vierkante meter.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Geen 14-daagse bullshit. Geen gladde presentator die zegt dat het &ldquo;mogelijk gaat regenen&rdquo;.
              WeerZone combineert <strong className="text-white">KNMI HARMONIE</strong> en{" "}
              <strong className="text-white">DWD ICON</strong> — de twee meest nauwkeurige modellen van
              Noordwest-Europa — en laat je per uur zien wat er gebeurt in jouw stad.
            </p>
          </header>

          <section className="mb-10 space-y-4 text-white/75 leading-relaxed">
            <h2 className="text-2xl font-bold text-white">Waarom maximaal 48 uur?</h2>
            <p>
              Weersverwachtingen verder dan twee dagen zijn statistisch onbetrouwbaar. De atmosfeer is
              chaotisch — na ~48 uur loopt elk model uit de bocht. De 14-daagse die jij in de app ziet?
              Dat is een gemiddelde van klimaatdata, geen voorspelling. Wij doen het andersom: korter,
              maar messcherp.
            </p>
            <h2 className="text-2xl font-bold text-white">Per uur. Per stad. Per model.</h2>
            <p>
              Temperatuur, neerslag, wind, onweer (CAPE), UV, gevoelstemperatuur — alles per uur. En je
              ziet óók of HARMONIE en ICON het eens zijn. Zijn ze het oneens? Dan weet je dat de
              onzekerheid hoog is. Dat krijg je nergens anders te zien.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Kies je stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {cities.map((c) => {
                const slug = c.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={c.name}
                    href={`/weer/${slug}`}
                    className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-semibold transition-all"
                  >
                    Weer {c.name}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Specials</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <Link href="/weer/onweer" className="block p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                <div className="text-2xl mb-2">⛈️</div>
                <div className="font-bold">Onweer vandaag</div>
                <div className="text-xs text-white/60 mt-1">CAPE-waarden per uur</div>
              </Link>
              <Link href="/weer/regen" className="block p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                <div className="text-2xl mb-2">🌧️</div>
                <div className="font-bold">Regen vandaag</div>
                <div className="text-xs text-white/60 mt-1">Wanneer wordt het droog?</div>
              </Link>
              <Link href="/weer/48-uur" className="block p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-bold">48 uur weer</div>
                <div className="text-xs text-white/60 mt-1">Waarom geen 14-daagse</div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
