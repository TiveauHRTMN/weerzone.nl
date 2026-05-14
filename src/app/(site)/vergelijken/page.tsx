import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const metadata: Metadata = {
  title: "Weerwebsites vergelijken — WEERZONE vs Buienradar, Weerplaza en meer",
  description:
    "Vergelijk de beste Nederlandse weerwebsites en apps. WEERZONE vs Buienradar, Weerplaza, Weeronline en KNMI — eerlijk, actueel en onafhankelijk.",
  keywords: [
    "weerwebsites vergelijken",
    "weerzone vs buienradar",
    "beste weerwebsite",
    "weer app vergelijking",
    "buienradar alternatief",
    "weerplaza vs weerzone",
    "weeronline alternatief",
  ],
  alternates: { canonical: "https://weerzone.nl/vergelijken" },
  openGraph: {
    title: "Weerwebsites vergelijken — WEERZONE vs Buienradar, Weerplaza en meer",
    description:
      "Vergelijk de beste Nederlandse weerwebsites. WEERZONE vs Buienradar, Weerplaza, Weeronline en KNMI — eerlijk en actueel.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vergelijken",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weerwebsites vergelijken | WEERZONE",
    description:
      "Vergelijk de beste Nederlandse weerwebsites en apps — eerlijk, actueel en onafhankelijk.",
  },
};

const COMPARISONS = [
  {
    title: "WEERZONE vs Buienradar",
    href: "/vergelijken/weerzone-vs-buienradar",
    summary:
      "Een directe vergelijking tussen WEERZONE en Buienradar: hyperlokale precisie tegenover de gevestigde orde.",
    label: "X vs Y",
    color: "#0ea5e9",
  },
  {
    title: "5 Beste Buienradar Alternatieven",
    href: "/vergelijken/buienradar-alternatieven",
    summary:
      "Op zoek naar een alternatief voor Buienradar? Wij vergeleken de 5 beste opties voor 2026.",
    label: "Alternatieven",
    color: "#10b981",
  },
  {
    title: "Beste Weerwebsites van 2026",
    href: "/vergelijken/beste-weerwebsites",
    summary:
      "De 8 beste Nederlandse weerwebsites gerangschikt op nauwkeurigheid, gebruiksgemak en features.",
    label: "Toplijst",
    color: "#f59e0b",
  },
  {
    title: "Vergelijkingstabel Weerapps",
    href: "/vergelijken/vergelijkingstabel",
    summary:
      "Complete feature-matrix van alle weerapps: prijzen, radar, waarschuwingen, API, en meer in één overzicht.",
    label: "Tabel",
    color: "#8b5cf6",
  },
];

export default async function VergelijkenIndexPage() {
  const debilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(debilt.lat, debilt.lon).catch(() => undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Weerwebsites vergelijken",
    description:
      "Vergelijk de beste Nederlandse weerwebsites en apps met onze onafhankelijke vergelijkingen.",
    url: "https://weerzone.nl/vergelijken",
    inLanguage: "nl-NL",
    mainEntity: COMPARISONS.map((c) => ({
      "@type": "Article",
      name: c.title,
      url: `https://weerzone.nl${c.href}`,
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
                  Vergelijken · Weerzone
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Weerwebsites vergelijken: wie is het beste?
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Of je nu twijfelt tussen WEERZONE en Buienradar, op zoek bent naar een alternatief
                of gewoon de beste weerapp van 2026 wilt vinden — hier vind je onze eerlijke,
                onafhankelijke vergelijkingen. Alle informatie is gecontroleerd en voorzien van
                bronvermeldingen.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMPARISONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card p-5 hover:scale-[1.01] transition-transform"
                >
                  <p
                    className="text-[10px] font-black uppercase tracking-widest mb-2"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </p>
                  <h2 className="font-black text-slate-900 text-base mb-1">{item.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
                </Link>
              ))}
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Verantwoording
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Hoe wij vergelijken
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Alle vergelijkingen op deze pagina zijn gebaseerd op publiek beschikbare informatie
                van de betreffende diensten, reviewplatforms zoals G2 en Trustpilot, en eigen
                praktijktests. Prijzen zijn gecontroleerd per{" "}
                {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}.
                WEERZONE is een eigen product van Tiveau. Voor elke vergelijking vermelden we
                duidelijk welk product van ons is.
              </p>
            </div>
          </div>
        }
      />
    </main>
  );
}
