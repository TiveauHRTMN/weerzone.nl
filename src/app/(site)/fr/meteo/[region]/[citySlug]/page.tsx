import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { placesByProvince, placeSlug, City } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { notFound } from "next/navigation";
import { FR_REGION_TO_PROVINCE, FR_REGION_SLUGS, FR_REGION_LABELS } from "@/config/locales";
import { getLucWeatherVerdict, getLocationSEOContent } from "@/app/actions";
import { schemaBreadcrumb, schemaCityDataset, schemaLd, schemaWebPage } from "@/lib/schema";
import { hreflangLuxembourg } from "@/lib/hreflang";
import { getLocationWeatherProfile } from "@/lib/location-profile";
import { buildCityGeoBlock } from "@/lib/geo-blocks";
import CityGeoBlock from "@/components/CityGeoBlock";

export function generateStaticParams() {
  return [];
  const params: { region: string; citySlug: string }[] = [];
  for (const region of FR_REGION_SLUGS) {
    const province = FR_REGION_TO_PROVINCE[region];
    if (!province) continue;
    const places = placesByProvince()[province] || [];
    const seen = new Set<string>();
    for (const p of places) {
      const slug = placeSlug(p.name);
      if (!seen.has(slug)) {
        seen.add(slug);
        params.push({ region, citySlug: slug });
      }
    }
  }
  return params;
}

export const revalidate = 300; // 5 minuten

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; citySlug: string }>;
}): Promise<Metadata> {
  const { region, citySlug } = await params;
  const province = FR_REGION_TO_PROVINCE[region];
  if (!province) return {};

  const places = placesByProvince()[province] || [];
  const city = places.find((p) => placeSlug(p.name) === citySlug);
  if (!city) return {};

  const frPath = `https://weerzone.nl/fr/meteo/${region}/${citySlug}`;
  const languages: Record<string, string> =
    region === "luxembourg"
      ? hreflangLuxembourg(citySlug)
      : {
          "fr-FR": frPath,
          "nl-NL": `https://weerzone.nl/weer/${province}/${citySlug}`,
          "x-default": frPath,
        };

  return {
    title: `Météo ${city.name} — Prévisions à 48 heures | WEERZONE`,
    description: `Météo hyperlocales pour ${city.name}. Prévisions heure par heure de la température, pluie, vent et alertes.`,
    alternates: {
      canonical: frPath,
      languages,
    },
    openGraph: {
      title: `Météo ${city.name} | WEERZONE`,
      description: `Ce que fait la météo aujourd'hui et demain à ${city.name}.`,
      locale: "fr_FR",
    },
  };
}

export default async function RegionCityPage({
  params,
}: {
  params: Promise<{ region: string; citySlug: string }>;
}) {
  const { region, citySlug } = await params;
  const province = FR_REGION_TO_PROVINCE[region];
  const label = FR_REGION_LABELS[region];
  if (!province || !label) notFound();

  const places = placesByProvince()[province] || [];
  const city = places.find((p) => placeSlug(p.name) === citySlug);
  if (!city) notFound();

  const weather = await fetchWeatherData(city.lat, city.lon, false, false, undefined, "fr");

  // Mariana 'Character Intelligence' Layer
  // We determine the unique properties of the location to drive AI content
  const char = (() => {
    if (city.character) return city.character;
    if (city.population && city.population > 80000) return "urban";
    if (city.lat < 43.8 && (city.lon > 3 && city.lon < 8)) return "mediterranean coastal";
    if (city.lat > 46.5 && city.lon < -1) return "atlantic coastal";
    if (city.lat < 46 && city.lon > 5.5) return "mountain";
    if (city.lat > 49 && city.lon > 2) return "northern continental";
    return "inland";
  })();

  const [lucUrteil, seoText] = await Promise.all([
    weather ? getLucWeatherVerdict(weather, city.name, label) : null,
    getLocationSEOContent(city.name, label, char, "fr"),
  ]);

  const pageUrl = `https://weerzone.nl/fr/meteo/${region}/${citySlug}`;
  const jsonLd = [
    schemaBreadcrumb([
      { name: "WEERZONE", item: "https://weerzone.nl/fr" },
      { name: "Meteo", item: "https://weerzone.nl/fr/meteo" },
      { name: label, item: `https://weerzone.nl/fr/meteo/${region}` },
      { name: city.name, item: pageUrl },
    ]),
    schemaWebPage({
      name: `Meteo ${city.name} - WEERZONE`,
      url: pageUrl,
      description: `Meteo hyperlocale pour ${city.name}. Previsions heure par heure de la temperature, pluie, vent et alertes.`,
      inLanguage: "fr-FR",
      speakableSelectors: ["h1", "[data-speakable]", ".card"],
    }),
    schemaCityDataset({
      placeName: city.name,
      url: pageUrl,
      inLanguage: "fr-FR",
      name: `Donnees meteo hyperlocales ${city.name}`,
      description: `Previsions hyperlocales pour ${city.name}, avec temperature, pluie, vent et horizon de 48 heures.`,
    }),
  ];

  const nowHour = new Date();
  nowHour.setMinutes(0, 0, 0);
  const geoBlock = buildCityGeoBlock({
    place: city,
    regionLabel: label,
    profile: getLocationWeatherProfile(city),
    weather: weather ?? undefined,
    locale: "fr",
    dateModified: nowHour,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WeatherDashboard
        initialCity={city}
        initialWeather={weather ?? undefined}
        initialWeatherCode={weather?.current?.weatherCode}
        initialIsDay={weather?.current?.isDay}
        locale="fr"
        beforeFooter={
          <div className="mt-12 mb-20 px-6 max-w-4xl mx-auto space-y-10">
            <CityGeoBlock block={geoBlock} inLanguage="fr-FR" />

            {lucUrteil && (
              <div className="card p-6 bg-[#22c55e]/5 border border-[#22c55e]/20 overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:rotate-12 transition-transform">
                  🌦
                </div>
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg">
                    L
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter mb-1">
                      L'avis de Luc
                    </h3>
                    <p className="text-text-secondary italic leading-relaxed">
                      &ldquo;{lucUrteil}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {seoText && (
              <div className="card p-6 border-white/5">
                <p className="text-sm text-text-secondary leading-relaxed" data-speakable>
                  {seoText}
                </p>
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
