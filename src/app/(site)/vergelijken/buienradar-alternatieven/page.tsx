import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const metadata: Metadata = {
  title: "5 Beste Buienradar Alternatieven in 2026 (Gratis & Premium)",
  description:
    "Op zoek naar een goed alternatief voor Buienradar? Wij vergeleken WEERZONE, Weerplaza, Weeronline, KNMI en Windy. Vind de beste weerapp voor jouw situatie.",
  keywords: [
    "buienradar alternatief",
    "beste buienradar alternatieven",
    "weerapp alternatief",
    "weerzone buienradar alternatief",
    "beste weerwebsite nederland",
    "vervanger buienradar",
  ],
  alternates: { canonical: "https://weerzone.nl/vergelijken/buienradar-alternatieven" },
  openGraph: {
    title: "5 Beste Buienradar Alternatieven in 2026 (Gratis & Premium)",
    description:
      "Vergelijk de 5 beste Buienradar alternatieven: WEERZONE, Weerplaza, Weeronline, KNMI en Windy — gratis en premium opties.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vergelijken/buienradar-alternatieven",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Beste Buienradar Alternatieven in 2026",
    description:
      "Op zoek naar een alternatief voor Buienradar? Wij vergeleken de 5 beste opties.",
  },
};

const ALTERNATIVES = [
  {
    name: "WEERZONE",
    tagline: "Hyperlokaal, 48 uur vooruit, reclamevrij",
    tag: "AANRADER",
    tagColor: "#10b981",
    pros: [
      "Hyperlokaal op 1x1 km grid",
      "Drie weermodellen naast elkaar",
      "Volledig reclamevrij",
      "Persoonlijke waarschuwingen op maat",
      "E-mail notificaties",
      "Zakelijke API beschikbaar",
    ],
    cons: [
      "Nieuwe dienst, kortere historiek",
      "Geen native app (wel PWA)",
      "Geen 14-daagse verwachting",
    ],
    bestFor: "Iedereen die een persoonlijk, reclamevrij weerbericht wil met focus op vandaag en morgen.",
    cta: "Gratis proberen",
    ctaHref: "/",
    isOurs: true,
  },
  {
    name: "Weerplaza",
    tagline: "Breed aanbod met video en lange termijn",
    tag: "GOED ALTERNATIEF",
    tagColor: "#0ea5e9",
    pros: [
      "Uitgebreide 14-daagse verwachting",
      "Weerberichten met video",
      "Actuele neerslagradar",
      "Goede landbouw- en tuinweerinformatie",
    ],
    cons: [
      "Veel advertenties op de website",
      "Minder hyperlokaal dan WEERZONE",
      "Beperkte personalisatie",
      "Geen API voor zakelijk gebruik",
    ],
    bestFor: "Gebruikers die naast het korte termijn ook een 14-daagse verwachting willen met video-uitleg.",
    cta: "Bekijk Weerplaza",
    ctaHref: "https://www.weerplaza.nl",
    isOurs: false,
  },
  {
    name: "Weeronline",
    tagline: "Betrouwbaar weermerk met uitgebreide content",
    tag: "SOLIDE",
    tagColor: "#8b5cf6",
    pros: [
      "Zeer gedetailleerde verwachtingen",
      "Specialisatie in recreatieweer",
      "Uitstekende strand- en surfverwachtingen",
      "Mobiele app beschikbaar",
    ],
    cons: [
      "Advertentiegedreven model",
      "Minder geschikt voor zakelijk gebruik",
      "Personalisatie beperkt tot locatie",
    ],
    bestFor: "Mensen die gespecialiseerde recreatieweerberichten willen, zoals strand- en surfcondities.",
    cta: "Bekijk Weeronline",
    ctaHref: "https://www.weeronline.nl",
    isOurs: false,
  },
  {
    name: "KNMI",
    tagline: "Officiële overheidsdata, wetenschappelijk onderbouwd",
    tag: "OFFICIEEL",
    tagColor: "#f59e0b",
    pros: [
      "Wetenschappelijk meest betrouwbaar",
      "Onafhankelijk en niet-commercieel",
      "Uitgebreide data en modellen",
      "Code rood/geel/oranje waarschuwingen als bron",
    ],
    cons: [
      "Minder gebruiksvriendelijke interface",
      "Geen persoonlijke notificaties",
      "Weinig vertaalslag naar praktijk",
      "Geen app-ervaring",
    ],
    bestFor: "Data-enthousiastelingen en professionals die de ruwe wetenschappelijke data willen inzien.",
    cta: "Bekijk KNMI",
    ctaHref: "https://www.knmi.nl",
    isOurs: false,
  },
  {
    name: "Windy.com",
    tagline: "Visuele kaarten voor de weerliefhebber",
    tag: "VISUEEL",
    tagColor: "#06b6d4",
    pros: [
      "Prachtige visuele weerkaarten",
      "Gratis en uitgebreid",
      "Wereldwijde dekking",
      "ECMWF, GFS en andere modellen beschikbaar",
    ],
    cons: [
      "Niet Nederlands-specifiek",
      "Informatie-overload voor dagelijks gebruik",
      "Geen persoonlijk weerbericht",
      "Vooral gericht op weerkaarten, niet op locatie",
    ],
    bestFor: "Weerliefhebbers en professionals die visuele kaarten en meerdere modellen willen verkennen.",
    cta: "Bekijk Windy",
    ctaHref: "https://www.windy.com",
    isOurs: false,
  },
];

export default async function BuienradarAlternatievenPage() {
  const debilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(debilt.lat, debilt.lon).catch(() => undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "5 Beste Buienradar Alternatieven in 2026",
    description:
      "Wij vergeleken de 5 beste alternatieven voor Buienradar: WEERZONE, Weerplaza, Weeronline, KNMI en Windy.",
    url: "https://weerzone.nl/vergelijken/buienradar-alternatieven",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: ALTERNATIVES.length,
    itemListElement: ALTERNATIVES.map((alt, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": alt.isOurs ? "Product" : "SoftwareApplication",
        name: alt.name,
        description: alt.tagline,
        url: alt.isOurs ? "https://weerzone.nl" : alt.ctaHref,
      },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WeatherDashboard
        hideWeatherInfo
        initialCity={debilt}
        initialWeather={initialWeather}
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-xs font-black uppercase tracking-widest text-sky-600">
                  Vergelijken · Buienradar Alternatieven
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                De 5 beste Buienradar alternatieven in 2026
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Buienradar is al jaren vertrouwd, maar misschien ben je toe aan iets anders.
                Minder advertenties, meer precisie, of een compleet andere manier van
                weer kijken. Wij zetten de 5 beste alternatieven voor je op een rij — van
                hyperlokaal tot wetenschappelijk.
              </p>
            </div>

            {ALTERNATIVES.map((alt, index) => (
              <div key={alt.name} id={alt.name.toLowerCase()} className="card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: alt.tagColor }}
                  />
                  {alt.isOurs && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ background: alt.tagColor }}
                    >
                      Ons product
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="font-black text-slate-900 text-xl">
                    {index + 1}. {alt.name}
                  </h2>
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: alt.tagColor }}
                  >
                    {alt.tag}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{alt.tagline}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-black text-slate-700 mb-2">Voordelen</p>
                    <ul className="space-y-1.5">
                      {alt.pros.map((pro) => (
                        <li key={pro} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-green-600 shrink-0">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 mb-2">Nadelen</p>
                    <ul className="space-y-1.5">
                      {alt.cons.map((con) => (
                        <li key={con} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-red-500 shrink-0">−</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-xs font-black text-slate-700 mb-3">
                  Best voor: <span className="font-normal text-slate-600">{alt.bestFor}</span>
                </p>

                <Link
                  href={alt.ctaHref}
                  {...(alt.isOurs ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="inline-block px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:brightness-110"
                  style={{ background: alt.tagColor }}
                >
                  {alt.cta}
                </Link>
              </div>
            ))}

            <div className="card p-6 bg-gradient-to-br from-sky-50 to-white">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 mb-2">
                Welke kies jij?
              </p>
              <h2 className="font-black text-slate-900 text-lg mb-3">Onze topkeuze</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Als we één alternatief moeten aanraden dat voor de meeste mensen het beste werkt,
                is dat <strong>WEERZONE</strong>. Het combineert hyperlokale precisie met een
                reclamevrije ervaring en persoonlijke waarschuwingen — precies wat Buienradar
                gebruikers vaak missen.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Maar elk alternatief heeft zijn eigen sterke punten. Weerplaza voor de lange
                termijn, Windy voor de visuele ervaring, KNMI voor de wetenschappelijke basis.
                Kies wat het beste bij jouw situatie past.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Probeer WEERZONE gratis
                </Link>
                <Link
                  href="/vergelijken/weerzone-vs-buienradar"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  WEERZONE vs Buienradar
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Gerelateerde vergelijkingen
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href="/vergelijken/weerzone-vs-buienradar"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  WEERZONE vs Buienradar
                </Link>
                <Link
                  href="/vergelijken/beste-weerwebsites"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  Beste weerwebsites 2026
                </Link>
                <Link
                  href="/vergelijken/vergelijkingstabel"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  Volledige vergelijkingstabel
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </main>
  );
}
