import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const metadata: Metadata = {
  title: "WEERZONE vs Buienradar: Wat is het beste? (2026)",
  description:
    "WEERZONE vs Buienradar vergeleken: nauwkeurigheid, lokaal weer, radar, waarschuwingen en gebruiksgemak. Ontdek welke weerapp het beste bij jou past.",  alternates: { canonical: "https://weerzone.nl/vergelijken/weerzone-vs-buienradar" },
  openGraph: {
    title: "WEERZONE vs Buienradar: Wat is het beste? (2026)",
    description:
      "WEERZONE vs Buienradar: nauwkeurigheid, lokaal weer, radar en waarschuwingen vergeleken.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vergelijken/weerzone-vs-buienradar",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE vs Buienradar: Wat is het beste?",
    description:
      "WEERZONE vs Buienradar — nauwkeurigheid, lokaal weer, radar en waarschuwingen vergeleken.",
  },
};

const FEATURE_MATRIX = [
  ["Weer voor jouw plek", "✅", "⚠️ Buienradar is vooral sterk in neerslagradar"],
  ["48-uurs verwachting per uur", "✅", "❌ Alleen neerslag per 5 min"],
  ["Drie weerkaarten tegelijk", "✅", "❌"],
  ["Meerdere bronnen", "✅ Breed vergeleken", "⚠️ Beperkter"],
  ["Neerslagradar live", "✅", "✅"],
  ["Weeralarmen (KNMI)", "✅ (gepersonaliseerd)", "✅"],
  ["E-mail notificaties", "✅", "❌ Alleen app-push"],
  ["Rader-vrije ervaring", "✅", "❌ Volledig afhankelijk van advertenties"],
  ["API voor zakelijk gebruik", "✅", "❌"],
  ["Gratis versie", "✅", "✅"],
  ["Reclamevrije ervaring", "Standaard", "Betaalde variant bij Buienradar"],
  ["Persoonlijke drempelwaarden", "✅", "❌"],
  ["Meerdere locaties", "✅", "❌"],
];

export default async function VsBuienradarPage() {
  const debilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(debilt.lat, debilt.lon).catch(() => undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "WEERZONE",
    description:
      "Heldere 48-uurs weersverwachting voor Nederland — reclamevrij, persoonlijk en vertaald naar praktische keuzes.",
    brand: { "@type": "Brand", name: "WEERZONE" },
    comparison: {
      "@type": "Product",
      name: "Buienradar",
      description: "Nederlandse weerwebsite met neerslagradar en 14-daagse verwachting van RTL.",
    },
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
                  Vergelijken · WEERZONE vs Buienradar
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                WEERZONE vs Buienradar: welke past bij jou?
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Buienradar is al jaren de standaard voor Nederlanders die willen weten of ze droog
                blijven. Maar er groeit een nieuwe generatie weerapps die verder kijken dan alleen
                neerslag. In deze vergelijking lees je hoe WEERZONE — 48 uur vooruit
                en reclamevrij — zich verhoudt tot de gevestigde orde.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Feature matrix
              </p>
              <p className="text-slate-900 font-black text-lg mb-4">
                Wat biedt elke dienst?
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-black text-slate-700 pb-3 pr-4">Feature</th>
                      <th className="text-center font-black text-sky-700 pb-3 px-4">WEERZONE</th>
                      <th className="text-center font-black text-slate-700 pb-3 pl-4">Buienradar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_MATRIX.map(([feature, wz, br], i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-700 font-medium">{feature}</td>
                        <td className="py-3 px-4 text-center text-sm">{wz}</td>
                        <td className="py-3 pl-4 text-center text-sm">{br}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                Features gebaseerd op publieke documentatie en praktijktests.
                Gecontroleerd op {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 mb-2">
                  WEERZONE
                </p>
                <h2 className="font-black text-slate-900 text-lg mb-3">Voordelen</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> Weer voor jouw plek, uitgelegd in gewone taal</li>
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> Meerdere bronnen naast elkaar</li>
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> Volledig reclamevrij, ook in de gratis versie</li>
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> Persoonlijke e-mail notificaties op maat</li>
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> Vertaling van data naar praktische keuzes (fietsen, BBQ, strand)</li>
                  <li className="flex gap-2"><span className="text-sky-600 shrink-0">✅</span> API en zakelijke opties</li>
                </ul>

                <h2 className="font-black text-slate-900 text-lg mt-5 mb-3">Nadelen</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Kortere historiek — nieuwere dienst dan Buienradar</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Nog geen mobiele app (web-gebaseerd, PWA wel beschikbaar)</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> 48-uur focus — geen 14-daagse verwachting</li>
                </ul>
              </div>

              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 mb-2">
                  Buienradar
                </p>
                <h2 className="font-black text-slate-900 text-lg mb-3">Voordelen</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-green-600 shrink-0">✅</span> Bekend and vertrouwd — al 20+ jaar de standaard in Nederland</li>
                  <li className="flex gap-2"><span className="text-green-600 shrink-0">✅</span> Uitstekende neerslagradar met 5-minuten updates</li>
                  <li className="flex gap-2"><span className="text-green-600 shrink-0">✅</span> Zeer hoge traffic and community</li>
                  <li className="flex gap-2"><span className="text-green-600 shrink-0">✅</span> 14-daagse verwachting beschikbaar</li>
                  <li className="flex gap-2"><span className="text-green-600 shrink-0">✅</span> Speciale weerberichten voor wegverkeer and scheepvaart</li>
                </ul>

                <h2 className="font-black text-slate-900 text-lg mt-5 mb-3">Nadelen</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Advertentiegedreven — veel banners and onderbrekingen</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Minder nauwkeurig op lokaal niveau (2,5 km grid)</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Beperkte personalisatie van waarschuwingen</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Geen API voor zakelijk gebruik</li>
                  <li className="flex gap-2"><span className="text-red-500 shrink-0">❌</span> Minder brede vergelijking</li>
                </ul>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Ervaring
              </p>
              <p className="text-slate-900 font-black text-lg mb-4">Wat kost het?</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-black text-slate-700 pb-3 pr-4"></th>
                      <th className="text-center font-black text-sky-700 pb-3 px-4">WEERZONE</th>
                      <th className="text-center font-black text-slate-700 pb-3 pl-4">Buienradar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Gratis versie", "✅ — Dashboard met alle data", "✅ — Met advertenties"],
                      ["Reclamevrij", "Standaard", "Betaalde variant bij Buienradar"],
                      ["Persoonlijke heads-up", "Piet", "Niet beschikbaar"],
                      ["Waarschuwingen", "Reed", "Beperkt"],
                      ["Zakelijk", "Steve komt later", "Niet beschikbaar"],
                    ].map(([row, wz, br], i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-700 font-medium">{row}</td>
                        <td className="py-3 px-4 text-center text-sm">{wz}</td>
                        <td className="py-3 pl-4 text-center text-sm">{br}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                Inhoud gecontroleerd op {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}.
                
              </p>
            </div>

            <div className="card p-6 bg-gradient-to-br from-sky-50 to-white">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 mb-2">
                Eindoordeel
              </p>
              <h2 className="font-black text-slate-900 text-lg mb-3">Onze aanbeveling</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                <strong>Kies WEERZONE</strong> als je een reclamevrij weerbericht wilt
                dat vertaald is naar concrete keuzes voor jouw dag. Vooral als je persoonlijke
                waarschuwingen op maat belangrijk vindt of als bedrijf weerinformatie wilt gebruiken.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                <strong>Kies Buienradar</strong> als je vooral de neerslagradar wilt zien and gewend
                bent aan de vertrouwde interface. Buienradar blijft een uitstekende keuze voor
                snelle radarcontroles and 14-daagse verwachtingen. Houd wel rekening met advertenties.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Probeer WEERZONE gratis
                </Link>
                <a
                  href="https://www.buienradar.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  Bekijk Buienradar
                </a>
              </div>
              <p className="text-[10px] text-slate-400 mt-4">
                Dit is een eigen productvergelijking. WEERZONE is een product van Tiveau.
                Buienradar is een dienst van RTL.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Gerelateerde vergelijkingen
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
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
