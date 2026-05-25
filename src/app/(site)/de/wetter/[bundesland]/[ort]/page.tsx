import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_PLACES, findPlace, placeSlug, nearbyPlaces } from "@/lib/places-data";
import WeatherDashboard from "@/components/WeatherDashboard";
import { getKarlWeatherVerdict, getLocationSEOContent } from "@/app/actions";
import { fetchWeatherData } from "@/lib/weather";
import Link from "next/link";
import { getLocationWeatherProfile } from "@/lib/location-profile";
import { schemaBreadcrumb, schemaCityDataset, schemaLd, schemaWebPage } from "@/lib/schema";
import {
  DE_BUNDESLAND_TO_PROVINCE,
  DE_BUNDESLAND_LABELS,
  PROVINCE_TO_DE_BUNDESLAND,
} from "@/config/locales";
import { hreflangLuxembourg } from "@/lib/hreflang";
import { buildCityGeoBlock } from "@/lib/geo-blocks";
import CityGeoBlock from "@/components/CityGeoBlock";

interface PageProps {
  params: Promise<{ bundesland: string; ort: string }>;
}

export function generateStaticParams() {
  return [];
  return ALL_PLACES.filter((p) => {
    const bl = PROVINCE_TO_DE_BUNDESLAND[p.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND];
    return bl && p.population && p.population >= 20000;
  }).map((p) => ({
    bundesland: PROVINCE_TO_DE_BUNDESLAND[p.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND]!,
    ort: placeSlug(p.name),
  }));
}

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bundesland, ort } = await params;
  const province = DE_BUNDESLAND_TO_PROVINCE[bundesland];
  if (!province) return {};
  const place = findPlace(province, ort);
  if (!place) return {};
  const label = DE_BUNDESLAND_LABELS[bundesland] ?? bundesland;

  const dePath = `https://weerzone.nl/de/wetter/${bundesland}/${ort}`;
  const languages: Record<string, string> =
    bundesland === "luxembourg"
      ? hreflangLuxembourg(ort)
      : {
          "de-DE": dePath,
          "nl-NL": `https://weerzone.nl/weer/${province}/${ort}`,
          "x-default": dePath,
        };

  return {
    title: `Wetter ${place.name} | 48h Vorhersage ${label}`,
    description: `Aktuelles Wetter in ${place.name} (${label}). Stündliche Prognose für Temperatur, Regen und Wind — 48 Stunden voraus, auf 1 km genau.`,
    robots: { index: true, follow: true },
    alternates: {
      canonical: dePath,
      languages,
    },
    openGraph: {
      title: `Wetter ${place.name} — WEERZONE`,
      description: `48h Wettervorhersage für ${place.name} in ${label}.`,
      type: "website",
      locale: "de_DE",
      url: dePath,
      siteName: "WEERZONE",
    },
  };
}

export default async function OrtWeatherPage({ params }: PageProps) {
  const { bundesland, ort } = await params;
  const province = DE_BUNDESLAND_TO_PROVINCE[bundesland];
  if (!province) notFound();

  const place = findPlace(province, ort);
  if (!place) notFound();

  const label = DE_BUNDESLAND_LABELS[bundesland] ?? bundesland;

  const [initialWeather, marianaSeoText] = await Promise.all([
    fetchWeatherData(place.lat, place.lon, false, false, undefined, "de"),
    getLocationSEOContent(place.name, label, place.character, "de").catch(() => null),
  ]);
  const locationProfile = getLocationWeatherProfile(place);

  const karlVerdict = initialWeather
    ? await getKarlWeatherVerdict(initialWeather, place.name, label).catch(() => null)
    : null;

  const nearby = nearbyPlaces(place, 8).filter((p) =>
    PROVINCE_TO_DE_BUNDESLAND[p.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND],
  );

  const pageUrl = `https://weerzone.nl/de/wetter/${bundesland}/${ort}`;
  const jsonLd = [
    schemaBreadcrumb([
      { name: "WEERZONE", item: "https://weerzone.nl" },
      { name: "Wetter", item: "https://weerzone.nl/de/wetter" },
      { name: label, item: `https://weerzone.nl/de/wetter/${bundesland}` },
      { name: place.name, item: pageUrl },
    ]),
    schemaWebPage({
      name: `Wetter ${place.name} - WEERZONE`,
      url: pageUrl,
      description: `Aktuelles Wetter in ${place.name} (${label}). Stundliche Prognose fuer Temperatur, Regen und Wind.`,
      inLanguage: "de-DE",
      speakableSelectors: ["h1", "[data-speakable]", ".card"],
    }),
    schemaCityDataset({
      placeName: place.name,
      url: pageUrl,
      inLanguage: "de-DE",
      name: `Hyperlokale Wetterdaten ${place.name}`,
      description: `Lokale Vorhersage fuer ${place.name} in ${label}, mit Temperatur, Regen, Wind und 48-Stunden-Horizont.`,
    }),
  ];

  const nowHour = new Date();
  nowHour.setMinutes(0, 0, 0);
  const geoBlock = buildCityGeoBlock({
    place,
    regionLabel: label,
    profile: locationProfile,
    weather: initialWeather,
    locale: "de",
    dateModified: nowHour,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={place}
          initialWeather={initialWeather}
          locale="de"
          initialNarrative={karlVerdict}
          beforeFooter={
            <div className="space-y-6 pt-10">
              <CityGeoBlock block={geoBlock} inLanguage="de-DE" />

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/app/signup?tier=karl&lang=de&city=${encodeURIComponent(place.name)}`}
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-[#22c55e] text-slate-900 shadow-xl hover:scale-[1.02] transition-all text-center border border-white/20"
                >
                  <span className="text-3xl mb-3">📬</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">
                    Karl täglich aktivieren
                  </span>
                  <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest italic">
                    Kostenlos für {place.name}
                  </span>
                </Link>
                <Link
                  href="/de/preise#reed"
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-white/5 border border-white/10 text-white shadow-xl hover:scale-[1.02] transition-all text-center backdrop-blur-sm"
                >
                  <span className="text-3xl mb-3">⚡</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">
                    Reed-Warnungen
                  </span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">
                    Persönliche Wettergrenzen
                  </span>
                </Link>
              </div>

              {/* Lokales Profil — unieke SEO-tekst per locatie (intern via Mariana/Hermes gegenereerd) */}
              <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 shadow-2xl">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                  Wetter in {place.name} — Lokales Profil
                </h2>
                <p className="text-white/65 text-xs leading-relaxed italic" data-speakable>
                  {marianaSeoText ||
                    locationProfile.summary ||
                    `${place.name} liegt in ${label}. WEERZONE liefert die stündlich aktualisierte Vorhersage mit 1 km Auflösung — direkt für deine Straße, nicht nur für die Stadt.`}
                </p>
              </div>

              {/* Back to Bundesland */}
              <div className="text-center">
                <Link
                  href={`/de/wetter/${bundesland}`}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← Alle Orte in {label}
                </Link>
              </div>

              {/* Nearby DE cities */}
              {nearby.length > 0 && (
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">
                    In der Nähe
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {nearby.map((p) => {
                      const pBl =
                        PROVINCE_TO_DE_BUNDESLAND[
                          p.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND
                        ];
                      if (!pBl) return null;
                      return (
                        <Link
                          key={p.name}
                          href={`/de/wetter/${pBl}/${placeSlug(p.name)}`}
                          className="card p-3 hover:border-[#22c55e]/50 transition-all border border-white/5 text-center"
                        >
                          <span className="text-sm font-bold text-text-primary">{p.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          }
        />
      </main>
    </>
  );
}
