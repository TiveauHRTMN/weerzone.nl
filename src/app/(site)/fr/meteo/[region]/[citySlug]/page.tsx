import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { placesByProvince, placeSlug, City } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { notFound } from "next/navigation";
import { FR_REGION_TO_PROVINCE, FR_REGION_SLUGS } from "@/config/locales";

export function generateStaticParams() {
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

  return {
    title: `Météo ${city.name} — Prévisions à 48 heures | WEERZONE`,
    description: `Météo hyperlocales pour ${city.name}. Prévisions heure par heure de la température, pluie, vent et alertes.`,
    alternates: {
      canonical: `https://weerzone.nl/fr/meteo/${region}/${citySlug}`,
      languages: {
        "fr-FR": `https://weerzone.nl/fr/meteo/${region}/${citySlug}`,
        "x-default": `https://weerzone.nl/fr/meteo/${region}/${citySlug}`,
      },
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
  if (!province) notFound();

  const places = placesByProvince()[province] || [];
  const city = places.find((p) => placeSlug(p.name) === citySlug);
  if (!city) notFound();

  const weather = await fetchWeatherData(city.lat, city.lon, false, false, undefined, "fr");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl/fr" },
      { "@type": "ListItem", position: 2, name: "Météo", item: "https://weerzone.nl/fr/meteo" },
      { "@type": "ListItem", position: 3, name: region, item: `https://weerzone.nl/fr/meteo/${region}` },
      { "@type": "ListItem", position: 4, name: city.name, item: `https://weerzone.nl/fr/meteo/${region}/${citySlug}` },
    ],
  };

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
        // Hide standard weather info title on exact city match pages if needed
      />
    </>
  );
}
