import type { Metadata } from "next";
import Link from "next/link";
import { ALL_PLACES, placeRouteSlug } from "@/lib/places-data";
import { schemaBreadcrumb, schemaCityDataset, schemaLd, schemaWebPage } from "@/lib/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tiempo en Espana | Prevision local 48 horas",
  description: "Consulta el tiempo local en ciudades, pueblos, costas e islas de Espana. Prevision de 48 horas con lluvia, viento, temperatura y contexto local.",
  alternates: {
    canonical: "https://weerzone.nl/es/tiempo/espana",
    languages: {
      "es-ES": "https://weerzone.nl/es/tiempo/espana",
      "nl-NL": "https://weerzone.nl/weer/spanje",
      "x-default": "https://weerzone.nl/es/tiempo/espana",
    },
  },
};

function characterLabel(character?: string): string {
  if (character === "mediterranean coastal") return "Costa mediterranea";
  if (character === "atlantic coastal") return "Costa atlantica e islas";
  if (character === "mountain") return "Montana";
  if (character === "urban") return "Ciudad";
  if (character === "northern continental") return "Interior norte";
  return "Interior";
}

export default function SpainWeatherIndexPage() {
  const spanishPlaces = ALL_PLACES
    .filter((place) => place.province === "spanje")
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  const topPlaces = spanishPlaces.slice(0, 72);
  const pageUrl = "https://weerzone.nl/es/tiempo/espana";
  const topCity = topPlaces[0];

  const jsonLd = [
    schemaBreadcrumb([
      { name: "WEERZONE", item: "https://weerzone.nl" },
      { name: "Tiempo", item: "https://weerzone.nl/es/tiempo" },
      { name: "Espana", item: pageUrl },
    ]),
    schemaWebPage({
      name: "Tiempo en Espana - WEERZONE",
      url: pageUrl,
      description: "Consulta el tiempo por ciudad, pueblo, costa o isla. Prevision hiperlocal de 48 horas.",
      inLanguage: "es-ES",
      speakableSelectors: ["h1", "[data-speakable]", ".card"],
    }),
    ...(topCity
      ? [
          schemaCityDataset({
            placeName: topCity.name,
            url: `https://weerzone.nl/es/tiempo/espana/${placeRouteSlug(topCity)}`,
            inLanguage: "es-ES",
            name: `Datos meteorologicos hiperlocales ${topCity.name}`,
            description: `Visión local de referencia para Espana, centrada en ${topCity.name}.`,
          }),
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-slate-950/10 bg-[#fffaf0]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-sm font-black tracking-[0.18em] text-slate-950">
            WEERZONE ESPANA
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-amber-700" data-speakable>
          Prevision hiperlocal - 48 horas
        </p>
        <h1 className="max-w-4xl text-4xl font-black leading-none tracking-tight sm:text-6xl">
          Tiempo en Espana
        </h1>
        <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-700" data-speakable>
          Consulta el tiempo por ciudad, pueblo, costa o isla. Juan lo cuenta claro: lluvia, viento, sol y el consejo practico para las proximas 48 horas.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Principales destinos
          </h2>
          <p className="text-xs font-bold text-slate-500">{spanishPlaces.length.toLocaleString("es-ES")} lugares en la base</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topPlaces.map((place) => (
            <Link
              key={`${place.province}/${placeRouteSlug(place)}`}
              href={`/es/tiempo/espana/${placeRouteSlug(place)}`}
              className="rounded-lg border border-slate-950/10 bg-white p-4 hover:border-amber-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black">{place.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {characterLabel(place.character)}
                  </p>
                </div>
                {place.population ? (
                  <p className="text-xs font-black text-slate-400">{place.population.toLocaleString("es-ES")}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
