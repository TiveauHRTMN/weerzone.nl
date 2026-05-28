import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { fetchWeatherData } from "@/lib/weather";
import { placesByProvince, placeSlug } from "@/lib/places-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLucWeatherVerdict } from "@/app/actions";
import {
  FR_REGION_TO_PROVINCE,
  FR_REGION_LABELS,
  FR_REGION_SLUGS,
} from "@/config/locales";

export function generateStaticParams() {
  return FR_REGION_SLUGS.map((region) => ({ region }));
}

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  const label = FR_REGION_LABELS[region];
  if (!label) return {};

  return {
    title: `Météo ${label} — Prévisions actuelles par ville`,
    description: `Météo actuelle en ${label}. Prévisions précises à 48 heures pour toutes les villes et communes. Température, précipitations et vent par heure.`,
    alternates: {
      canonical: `https://weerzone.nl/fr/meteo/${region}`,
      languages: {
        "fr-FR": `https://weerzone.nl/fr/meteo/${region}`,
        "x-default": `https://weerzone.nl/fr/meteo/${region}`,
      },
    },
    openGraph: {
      title: `Météo ${label} — WEERZONE`,
      description: `Prévisions météo à 48h pour toutes les localités en ${label}.`,
      locale: "fr_FR",
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const province = FR_REGION_TO_PROVINCE[region];
  const label = FR_REGION_LABELS[region];
  if (!province || !label) notFound();

  const seenSlugs = new Set<string>();
  const rawPlaces = placesByProvince()[province] ?? [];
  const places = rawPlaces
    .filter((p) => {
      const s = placeSlug(p.name);
      if (seenSlugs.has(s)) return false;
      seenSlugs.add(s);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const mainCities = [...places]
    .filter((p) => p.population && p.population >= 5000)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .slice(0, 12);

  const refCity = mainCities[0] ?? places[0];
  if (!refCity) notFound();

  const weather = await fetchWeatherData(refCity.lat, refCity.lon, false, false, undefined, "fr");

  const lucUrteil = weather ? await getLucWeatherVerdict(weather, refCity.name, label) : null;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
        { "@type": "ListItem", position: 2, name: "Météo", item: "https://weerzone.nl/fr/meteo" },
        { "@type": "ListItem", position: 3, name: label, item: `https://weerzone.nl/fr/meteo/${region}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Villes en ${label}`,
      itemListElement: mainCities.map((place, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://weerzone.nl/fr/meteo/${region}/${placeSlug(place.name)}`,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Météo {label} — Prévisions actuelles par ville</h1>
      <WeatherDashboard
        initialCity={refCity}
        initialWeather={weather ?? undefined}
        locale="fr"
        titleOverride={`Météo en ${label}`}
        beforeFooter={
          <div className="mt-12 mb-20 px-6 max-w-4xl mx-auto">
            {lucUrteil && (
              <div className="card p-6 bg-[#22c55e]/5 border border-[#22c55e]/20 mb-10 overflow-hidden relative group">
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

            {mainCities.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">
                  Villes Principales
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {mainCities.map((place) => (
                    <Link
                      key={place.name}
                      href={`/fr/meteo/${region}/${placeSlug(place.name)}`}
                      className="card p-4 hover:border-[#22c55e]/50 transition-all border border-white/5"
                    >
                      <span className="text-sm font-bold text-text-primary line-clamp-1">
                        {place.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <details className="mb-10 group">
              <summary className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 cursor-pointer hover:text-[#22c55e] transition-colors list-none flex items-center gap-2">
                <span className="text-[10px] group-open:rotate-90 transition-transform">▶</span>
                Toutes les {places.length} localités en {label}
              </summary>
              <div className="mt-6">
                {Object.entries(
                  places.reduce(
                    (acc, place) => {
                      const letter = place.name.charAt(0).toUpperCase();
                      if (!acc[letter]) acc[letter] = [];
                      acc[letter].push(place);
                      return acc;
                    },
                    {} as Record<string, typeof places>,
                  ),
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, letterPlaces]) => (
                    <div key={letter} className="mb-10">
                      <h3 className="text-xl font-black text-white/20 mb-4 border-b border-white/5 pb-2">
                        {letter}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1">
                        {letterPlaces.map((place) => (
                          <a
                            key={place.name}
                            href={`/fr/meteo/${region}/${placeSlug(place.name)}`}
                            className="text-sm py-1 text-white/40 hover:text-[#22c55e] transition-colors truncate"
                          >
                            {place.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        }
      />
    </>
  );
}
