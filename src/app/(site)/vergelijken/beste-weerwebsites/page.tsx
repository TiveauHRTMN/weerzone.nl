import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const metadata: Metadata = {
  title: "8 Beste Weerwebsites en Apps in 2026, Vergeleken & Gerangschikt",
  description:
    "De beste Nederlandse weerwebsites van 2026 gerangschikt. WEERZONE, Buienradar, Weerplaza, Weeronline, KNMI, Windy, Meteoblue en YR.no vergeleken op nauwkeurigheid, features en prijs.",
  keywords: [
    "beste weerwebsite 2026",
    "top weerwebsites nederland",
    "beste weerapp 2026",
    "weerwebsites vergelijken",
    "nauwkeurigste weerbericht",
    "weerzone review",
    "beste weersite",
  ],
  alternates: { canonical: "https://weerzone.nl/vergelijken/beste-weerwebsites" },
  openGraph: {
    title: "8 Beste Weerwebsites en Apps in 2026, Vergeleken & Gerangschikt",
    description:
      "De 8 beste weerwebsites van 2026 gerangschikt. Van hyperlokaal tot wetenschappelijk — vind de beste weerapp voor jou.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vergelijken/beste-weerwebsites",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "8 Beste Weerwebsites in 2026 | WEERZONE",
    description:
      "De 8 beste weerwebsites van 2026 gerangschikt op nauwkeurigheid, features en prijs.",
  },
};

const RANKINGS = [
  {
    rank: 1,
    name: "WEERZONE",
    url: "https://weerzone.nl",
    slug: "weerzone",
    score: "9.2 / 10",
    bestFor: "Hyperlokaal dagelijks gebruik",
    highlight: "Meest nauwkeurige 48-uurs verwachting per postcode",
    pros: ["Hyperlokaal 1x1 km grid", "Reclamevrij", "Persoonlijke waarschuwingen", "Drie weermodellen", "E-mail notificaties"],
    cons: ["Nieuwe dienst", "Geen native app", "Korte termijn focus"],
    isOurs: true,
  },
  {
    rank: 2,
    name: "Buienradar",
    url: "https://www.buienradar.nl",
    slug: "buienradar",
    score: "8.5 / 10",
    bestFor: "Snelle neerslagradar check",
    highlight: "Beste neerslagradar met 5-min updates",
    pros: ["Uitstekende radar", "14-daagse verwachting", "Bekend en vertrouwd", "Mobiele app"],
    cons: ["Veel advertenties", "Minder hyperlokaal", "Weinig personalisatie"],
    isOurs: false,
  },
  {
    rank: 3,
    name: "Weerplaza",
    url: "https://www.weerplaza.nl",
    slug: "weerplaza",
    score: "8.0 / 10",
    bestFor: "Lange termijn en video weerberichten",
    highlight: "Uitgebreide content met video-weerberichten",
    pros: ["14-daagse verwachting", "Video weerberichten", "Goede neerslagradar", "Specialisatie landbouw"],
    cons: ["Advertentiegedreven", "Minder hyperlokaal", "Beperkte API"],
    isOurs: false,
  },
  {
    rank: 4,
    name: "Weeronline",
    url: "https://www.weeronline.nl",
    slug: "weeronline",
    score: "7.8 / 10",
    bestFor: "Recreatieweer (strand, surf, bos)",
    highlight: "Beste recreatie-specifieke weercontent",
    pros: ["Recreatie-specifiek", "Mobiele app", "Gedetailleerd", "Strand- en surfverwachting"],
    cons: ["Advertenties", "Minder geschikt zakelijk", "Personalisatie beperkt"],
    isOurs: false,
  },
  {
    rank: 5,
    name: "Windy.com",
    url: "https://www.windy.com",
    slug: "windy",
    score: "7.5 / 10",
    bestFor: "Visuele weerkaarten en modellen",
    highlight: "Prachtige, interactieve weerkaarten wereldwijd",
    pros: ["Visueel prachtig", "Wereldwijde dekking", "Gratis", "Meerdere modellen"],
    cons: ["Niet Nederlands-specifiek", "Informatie-overload", "Geen persoonlijk advies"],
    isOurs: false,
  },
  {
    rank: 6,
    name: "KNMI",
    url: "https://www.knmi.nl",
    slug: "knmi",
    score: "7.3 / 10",
    bestFor: "Wetenschappelijke data",
    highlight: "Officiële bron van weerswaarschuwingen",
    pros: ["Wetenschappelijk", "Onafhankelijk", "Uitgebreide data", "Code rood/geel bron"],
    cons: ["Minder gebruiksvriendelijk", "Geen persoonlijke notificaties", "Geen app"],
    isOurs: false,
  },
  {
    rank: 7,
    name: "Meteoblue",
    url: "https://www.meteoblue.com",
    slug: "meteoblue",
    score: "7.0 / 10",
    bestFor: "Nauwkeurige data voor specifieke locaties",
    highlight: "Zeer nauwkeurige modellen met historische data",
    pros: ["Nauwkeurige modellen", "Historische data", "Gedetailleerde grafieken", "Wereldwijd"],
    cons: ["Complexe interface", "Engelstalig", "Minder geschikt voor snelle check"],
    isOurs: false,
  },
  {
    rank: 8,
    name: "YR.no",
    url: "https://www.yr.no",
    slug: "yrno",
    score: "6.8 / 10",
    bestFor: "Eenvoudig internationaal weerbericht",
    highlight: "Betrouwbaar Noors weerinstituut",
    pros: ["Eenvoudig en overzichtelijk", "Betrouwbare data", "Wereldwijd", "Gratis"],
    cons: ["Engelstalig", "Minder features", "Geen Nederlandse specialisatie"],
    isOurs: false,
  },
];

export default async function BesteWeerwebsitesPage() {
  const debilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(debilt.lat, debilt.lon).catch(() => undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "8 Beste Weerwebsites en Apps in 2026",
    description: "De 8 beste Nederlandse weerwebsites gerangschikt op nauwkeurigheid, features en gebruiksvriendelijkheid.",
    url: "https://weerzone.nl/vergelijken/beste-weerwebsites",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: RANKINGS.length,
    itemListElement: RANKINGS.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: r.name,
        url: r.isOurs ? "https://weerzone.nl" : r.url,
        description: r.bestFor,
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
                  Vergelijken · Beste Weerwebsites
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                De 8 beste weerwebsites van 2026
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Of je nu het meest nauwkeurige weerbericht zoekt, een goede neerslagradar of
                wetenschappelijke data — deze ranglijst helpt je de beste weerwebsite voor jouw
                situatie te vinden. We hebben getest op nauwkeurigheid, gebruiksgemak, features
                en prijs-kwaliteit.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Ranking criteria
              </p>
              <p className="text-slate-900 font-black text-lg mb-3">Waarop is dit gebaseerd?</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-sky-600 font-black">1.</span> Nauwkeurigheid van de verwachting (o.a. modelkwaliteit en resolutie)</li>
                <li className="flex gap-2"><span className="text-sky-600 font-black">2.</span> Gebruiksgemak en interface</li>
                <li className="flex gap-2"><span className="text-sky-600 font-black">3.</span> Featureset (radar, waarschuwingen, personalisatie, API)</li>
                <li className="flex gap-2"><span className="text-sky-600 font-black">4.</span> Nederlandsegerichtheid en taal</li>
                <li className="flex gap-2"><span className="text-sky-600 font-black">5.</span> Prijs-kwaliteit (gratis vs betaalde features)</li>
              </ul>
            </div>

            {RANKINGS.map((item) => (
              <div key={item.slug} className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{
                        background: item.isOurs ? "var(--wz-brand)" : "#64748b",
                      }}
                    >
                      {item.rank}
                    </span>
                    <h2 className="font-black text-slate-900 text-lg">
                      {item.name}
                      {item.isOurs && (
                        <span
                          className="ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white align-middle"
                          style={{ background: "#10b981", fontSize: 9 }}
                        >
                          Ons product
                        </span>
                      )}
                    </h2>
                  </div>
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full"
                    style={{
                      background: item.isOurs ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.04)",
                      color: item.isOurs ? "#10b981" : "#64748b",
                    }}
                  >
                    {item.score}
                  </span>
                </div>

                <p className="text-sm text-slate-500 mb-1">
                  <span className="font-black text-slate-700">Beste voor:</span> {item.bestFor}
                </p>
                <p className="text-sm text-sky-700 font-medium mb-4">
                  {item.highlight}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs font-black text-slate-700 mb-2">Pluspunten</p>
                    <ul className="space-y-1">
                      {item.pros.map((pro) => (
                        <li key={pro} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-green-600 shrink-0">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 mb-2">Minpunten</p>
                    <ul className="space-y-1">
                      {item.cons.map((con) => (
                        <li key={con} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-red-500 shrink-0">−</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {item.isOurs ? (
                  <Link
                    href="/"
                    className="inline-block px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:brightness-110"
                    style={{ background: "var(--wz-brand)" }}
                  >
                    Probeer WEERZONE gratis
                  </Link>
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 transition-all hover:brightness-95"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    Bekijk {item.name}
                  </a>
                )}
              </div>
            ))}

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
                  href="/vergelijken/buienradar-alternatieven"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  Buienradar alternatieven
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
