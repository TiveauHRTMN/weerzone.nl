import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const metadata: Metadata = {
  title: "Weerapps Vergelijkingstabel — Features, Prijzen & Scores (2026)",
  description:
    "Complete vergelijkingstabel van 8 weerapps. Vergelijk WEERZONE, Buienradar, Weerplaza, Weeronline, KNMI, Windy, Meteoblue en YR.no op features, prijzen, radar en meer.",
  keywords: [
    "weerapps vergelijking",
    "vergelijkingstabel weer",
    "weerzone vs buienradar vs weerplaza",
    "beste weerapp 2026 vergelijking",
    "feature matrix weerapps",
  ],
  alternates: { canonical: "https://weerzone.nl/vergelijken/vergelijkingstabel" },
  openGraph: {
    title: "Weerapps Vergelijkingstabel — Features, Prijzen & Scores (2026)",
    description:
      "Complete feature-matrix van 8 weerapps. Vergelijk WEERZONE, Buienradar, Weerplaza, Weeronline, KNMI, Windy, Meteoblue en YR.no in één oogopslag.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vergelijken/vergelijkingstabel",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weerapps Vergelijkingstabel | WEERZONE",
    description:
      "Complete feature-matrix van 8 weerapps — WEERZONE, Buienradar, Weerplaza, Weeronline, KNMI, Windy, Meteoblue en YR.no.",
  },
};

interface Cell {
  value: string;
  note?: string;
  highlight?: boolean;
}

const HEADERS = ["Feature", "WEERZONE", "Buienradar", "Weerplaza", "Weeronline", "KNMI", "Windy", "Meteoblue", "YR.no"];
const ROWS: [string, ...Cell[]][] = [
  [
    "Hyperlokaal (resolutie)",
    { value: "✅ 1x1 km", highlight: true },
    { value: "⚠️ 2,5 km" },
    { value: "⚠️ 2,5 km" },
    { value: "⚠️ 2,5 km" },
    { value: "✅ 1x1 km" },
    { value: "⚠️ 5 km" },
    { value: "✅ 1x1 km" },
    { value: "⚠️ 2,5 km" },
  ],
  [
    "48-uurs per uur",
    { value: "✅", highlight: true },
    { value: "⚠️ Neerslag" },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
  ],
  [
    "14-daagse verwachting",
    { value: "❌" },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
  ],
  [
    "Neerslagradar live",
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "⚠️ Beperkt" },
    { value: "✅", highlight: true },
    { value: "❌" },
    { value: "❌" },
  ],
  [
    "Meerdere weermodellen",
    { value: "✅ (3)", highlight: true },
    { value: "⚠️ 1" },
    { value: "⚠️ 1" },
    { value: "⚠️ 1" },
    { value: "✅ (3)", highlight: true },
    { value: "✅ (4+)", highlight: true },
    { value: "✅ (4+)", highlight: true },
    { value: "⚠️ 1" },
  ],
  [
    "Weeralarmen (KNMI)",
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "⚠️ Beperkt" },
    { value: "❌" },
    { value: "❌" },
  ],
  [
    "Persoonlijke drempelwaarden",
    { value: "✅ (Reed)", highlight: true },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
  ],
  [
    "E-mail notificaties",
    { value: "✅", highlight: true },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
  ],
  [
    "Reclamevrij",
    { value: "✅ (standaard)", highlight: true },
    { value: "❌ (betaald)" },
    { value: "❌" },
    { value: "❌" },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
  ],
  [
    "Mobiele app",
    { value: "⚠️ PWA" },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "❌" },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
  ],
  [
    "API / Zakelijk",
    { value: "✅ (Steve)", highlight: true },
    { value: "❌" },
    { value: "❌" },
    { value: "❌" },
    { value: "✅", highlight: true },
    { value: "❌" },
    { value: "⚠️ Betaald" },
    { value: "❌" },
  ],
  [
    "Nederlandse taal",
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "⚠️" },
    { value: "⚠️" },
    { value: "⚠️" },
  ],
  [
    "Gratis versie",
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "✅", highlight: true },
    { value: "⚠️ Beperkt" },
    { value: "✅", highlight: true },
  ],
  [
    "Premium prijs (vanaf)",
    { value: "€3,99/mnd", highlight: true },
    { value: "€3,99/mnd" },
    { value: "N.v.t." },
    { value: "N.v.t." },
    { value: "N.v.t." },
    { value: "N.v.t." },
    { value: "N.v.t." },
    { value: "N.v.t." },
  ],
];

function cellContent(cell: Cell | string): string {
  return typeof cell === "string" ? cell : cell.value;
}

function isHighlight(cell: Cell | string): boolean {
  return typeof cell !== "string" && cell.highlight === true;
}

function cellNote(cell: Cell | string): string | undefined {
  return typeof cell !== "string" ? cell.note : undefined;
}

export default async function VergelijkingstabelPage() {
  const debilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(debilt.lat, debilt.lon).catch(() => undefined);

  const productListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Weerapps Vergelijkingstabel 2026",
    description: "Volledige feature-matrix van 8 weerapps en -websites.",
    url: "https://weerzone.nl/vergelijken/vergelijkingstabel",
    numberOfItems: 8,
    itemListElement: HEADERS.slice(1).map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name,
        applicationCategory: "WeatherApplication",
      },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productListLd) }} />
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
                  Vergelijken · Vergelijkingstabel
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Volledige vergelijkingstabel weerapps & websites
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Alle features van 8 weerapps en -websites in één oogopslag. Van hyperlokale
                resolutie tot prijzen — sorteer en vergelijk welke dienst het beste past bij
                jouw wensen.
              </p>
            </div>

            <div className="card p-4 sm:p-6 overflow-x-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">
                Feature matrix
              </p>
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {HEADERS.map((h, i) => (
                      <th
                        key={h}
                        className={`pb-3 font-black whitespace-nowrap ${
                          i === 0
                            ? "text-left pr-4 text-slate-700"
                            : i === 1
                            ? "text-center px-2 text-sky-700"
                            : "text-center px-2 text-slate-600"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([feature, ...cells]) => (
                    <tr key={feature} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-700 font-medium whitespace-nowrap sticky left-0 bg-white">
                        {feature}
                      </td>
                      {cells.map((cell, i) => (
                        <td
                          key={i}
                          className={`py-2.5 px-2 text-center whitespace-nowrap ${
                            isHighlight(cell) ? "font-bold text-sky-700" : "text-slate-600"
                          }`}
                          title={cellNote(cell)}
                        >
                          {cellContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 mt-4">
                Features gebaseerd op publieke documentatie en praktijktests per{" "}
                {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}.
                ✅ = beschikbaar, ⚠️ = beperkt beschikbaar, ❌ = niet beschikbaar.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Samenvatting
              </p>
              <p className="text-slate-900 font-black text-lg mb-3">Kort advies per gebruikssituatie</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left font-black text-slate-700 pb-3 pr-4">Als je zoekt…</th>
                    <th className="text-left font-black text-slate-700 pb-3 pl-4">Kies dan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Hyperlokaal dagelijks weerbericht", "WEERZONE"],
                    ["Snelle neerslagradar check", "Buienradar"],
                    ["Lange termijn met video", "Weerplaza"],
                    ["Recreatieweer (strand, surf)", "Weeronline"],
                    ["Wetenschappelijke data", "KNMI"],
                    ["Visuele weerkaarten", "Windy"],
                  ].map(([need, choice], i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-600">{need}</td>
                      <td className="py-3 pl-4 font-black text-sky-700">{choice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-6 bg-gradient-to-br from-sky-50 to-white">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 mb-2">
                Klaar om te kiezen?
              </p>
              <h2 className="font-black text-slate-900 text-lg mb-3">Probeer WEERZONE gratis</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Geen enkele weerapp biedt de combinatie van hyperlokale precisie, reclamevrije
                ervaring, persoonlijke waarschuwingen én een zakelijke API zoals WEERZONE.
                <br />Probeer het nu gratis — geen creditcard nodig.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Gratis proberen
                </Link>
                <Link
                  href="/prijzen"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  Bekijk prijzen
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
                  href="/vergelijken/buienradar-alternatieven"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  Buienradar alternatieven
                </Link>
                <Link
                  href="/vergelijken/beste-weerwebsites"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  Beste weerwebsites 2026
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </main>
  );
}
