import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_PLACES, findPlace, placeRouteSlug, nearbyPlaces } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { getLocationSEOContent, getJuanWeatherVerdict } from "@/app/actions";
import { schemaBreadcrumb, schemaCityDataset, schemaWebPage } from "@/lib/schema";
import WeatherDashboard from "@/components/WeatherDashboard";

interface PageProps {
  params: Promise<{ ciudad: string }>;
}

function spanishCharacterLabel(character?: string): string {
  if (character === "mediterranean coastal") return "costa mediterranea";
  if (character === "atlantic coastal") return "costa atlantica";
  if (character === "mountain") return "montana";
  if (character === "urban") return "ciudad";
  if (character === "northern continental") return "interior norte";
  return "interior";
}

function spanishRegionLabel(character?: string): string {
  if (character === "mediterranean coastal") return "Espana mediterranea";
  if (character === "atlantic coastal") return "Espana atlantica e islas";
  if (character === "mountain") return "zonas de montana";
  if (character === "urban") return "ciudad espanola";
  if (character === "northern continental") return "interior norte";
  return "Espana interior";
}

export function generateStaticParams() {
  return ALL_PLACES
    .filter((place) => place.province === "spanje" && (place.population ?? 0) >= 100000)
    .map((place) => ({ ciudad: placeRouteSlug(place) }));
}

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad } = await params;
  const place = findPlace("spanje", ciudad);
  if (!place) return {};

  return {
    title: `Tiempo en ${place.name} | Prevision 48 horas | WEERZONE`,
    description: `Consulta el tiempo en ${place.name}, Espana. Prevision local de 48 horas con temperatura, lluvia, viento y el comentario de Juan.`,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://weerzone.nl/es/tiempo/espana/${ciudad}`,
      languages: {
        "es-ES": `https://weerzone.nl/es/tiempo/espana/${ciudad}`,
        "nl-NL": `https://weerzone.nl/weer/spanje/${ciudad}`,
        "x-default": `https://weerzone.nl/es/tiempo/espana/${ciudad}`,
      },
    },
    openGraph: {
      title: `Tiempo en ${place.name} | WEERZONE`,
      description: `Prevision local para ${place.name}: lluvia, viento, temperatura y ventanas secas.`,
      type: "website",
      locale: "es_ES",
      url: `https://weerzone.nl/es/tiempo/espana/${ciudad}`,
      siteName: "WEERZONE",
    },
  };
}

export default async function SpainCityWeatherPage({ params }: PageProps) {
  const { ciudad } = await params;
  const place = findPlace("spanje", ciudad);
  if (!place) notFound();

  const regionLabel = spanishRegionLabel(place.character);
  const characterLabel = spanishCharacterLabel(place.character);

  const initialWeather = await fetchWeatherData(place.lat, place.lon, false, false, place, "es").catch(() => undefined);
  const [juanVerdict, seoText] = await Promise.all([
    initialWeather ? getJuanWeatherVerdict(initialWeather, place.name, regionLabel, place.character).catch(() => null) : null,
    getLocationSEOContent(place.name, regionLabel, place.character, "es").catch(() => null),
  ]);

  const nearby = nearbyPlaces(place, 8).filter((candidate) => candidate.province === "spanje");

  const pageUrl = `https://weerzone.nl/es/tiempo/espana/${ciudad}`;
  const jsonLd = [
    schemaBreadcrumb([
      { name: "WEERZONE", item: "https://weerzone.nl" },
      { name: "Tiempo", item: "https://weerzone.nl/es/tiempo" },
      { name: "Espana", item: "https://weerzone.nl/es/tiempo/espana" },
      { name: place.name, item: pageUrl },
    ]),
    schemaWebPage({
      name: `Tiempo en ${place.name} - WEERZONE`,
      url: pageUrl,
      description: `Consulta el tiempo en ${place.name}, Espana. Prevision local de 48 horas con temperatura, lluvia, viento y el comentario de Juan.`,
      inLanguage: "es-ES",
      speakableSelectors: ["h1", "[data-speakable]", ".card"],
    }),
    schemaCityDataset({
      placeName: place.name,
      url: pageUrl,
      inLanguage: "es-ES",
      name: `Datos meteorologicos hiperlocales ${place.name}`,
      description: `Prevision hiperlocal para ${place.name} con temperatura, lluvia, viento y horizonte de 48 horas.`,
    }),
    {
      "@context": "https://schema.org",
      "@type": "WeatherForecast",
      name: `Tiempo en ${place.name}`,
      areaServed: {
        "@type": "City",
        name: place.name,
        addressCountry: "ES",
      },
      url: pageUrl,
      provider: {
        "@type": "Organization",
        name: "WEERZONE",
        url: "https://weerzone.nl",
      },
    },
  ];

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
          locale="es"
          initialNarrative={juanVerdict}
          beforeFooter={
            <div className="space-y-6 pt-10">
              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/app/signup?tier=juan&lang=es&city=${encodeURIComponent(place.name)}`}
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-amber-500 text-slate-900 shadow-xl hover:scale-[1.02] transition-all text-center border border-white/20"
                >
                  <span className="text-3xl mb-3">📬</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">
                    Activar el parte de Juan
                  </span>
                  <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest italic">
                    Gratis para {place.name}
                  </span>
                </Link>
                <Link
                  href="/es/precios#reed"
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-white/5 border border-white/10 text-white shadow-xl hover:scale-[1.02] transition-all text-center backdrop-blur-sm"
                >
                  <span className="text-3xl mb-3">⚡</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">
                    Alertas Reed
                  </span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">
                    Tus limites personales
                  </span>
                </Link>
              </div>

              {/* Perfil local — texto SEO unico via Mariana */}
              <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 shadow-2xl">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                  Tiempo en {place.name} — Perfil local
                </h2>
                <p className="text-white/65 text-xs leading-relaxed italic" data-speakable>
                  {seoText ||
                    `${place.name} esta en ${regionLabel} (${characterLabel}). WEERZONE traduce las proximas 48 horas a una decision concreta: terraza, paseo, playa, chaqueta o esperar.`}
                </p>
              </div>

              {/* Back to Spain index */}
              <div className="text-center">
                <Link
                  href="/es/tiempo/espana"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← Todas las ciudades en Espana
                </Link>
              </div>

              {/* Nearby ES cities */}
              {nearby.length > 0 && (
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">
                    Cerca de {place.name}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {nearby.map((candidate) => (
                      <Link
                        key={`${candidate.province}/${placeRouteSlug(candidate)}`}
                        href={`/es/tiempo/espana/${placeRouteSlug(candidate)}`}
                        className="card p-3 hover:border-amber-500/50 transition-all border border-white/5 text-center"
                      >
                        <span className="text-sm font-bold text-text-primary">{candidate.name}</span>
                      </Link>
                    ))}
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
