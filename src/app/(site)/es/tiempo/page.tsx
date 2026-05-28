import type { Metadata } from "next";
import Link from "next/link";
import { ALL_PLACES, placeRouteSlug } from "@/lib/places-data";

export const metadata: Metadata = {
  title: "Tiempo Espana | Ciudades y previsiones locales",
  description:
    "Elige una ciudad de Espana para ver el tiempo hiperlocal de las proximas 48 horas: lluvia, viento, temperatura y contexto local.",
  alternates: {
    canonical: "https://weerzone.nl/es/tiempo",
    languages: {
      "nl-NL": "https://weerzone.nl/weer",
      "de-DE": "https://weerzone.nl/de/wetter",
      "fr-FR": "https://weerzone.nl/fr/meteo",
      "es-ES": "https://weerzone.nl/es/tiempo",
      "x-default": "https://weerzone.nl/weer",
    },
  },
  openGraph: {
    title: "Tiempo Espana | WEERZONE",
    description: "Prevision local de 48 horas para ciudades, costas, islas y zonas de interior.",
    type: "website",
    locale: "es_ES",
    url: "https://weerzone.nl/es/tiempo",
    siteName: "WEERZONE",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl/es" },
    { "@type": "ListItem", position: 2, name: "Tiempo", item: "https://weerzone.nl/es/tiempo" },
  ],
};

export default function TiempoIndexPage() {
  const topPlaces = ALL_PLACES
    .filter((place) => place.province === "spanje")
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .slice(0, 24);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-accent-orange">
            Espana · 48 horas
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-text-primary mb-3">
            Tiempo en Espana
          </h1>
          <p className="max-w-2xl text-text-secondary leading-relaxed">
            Consulta la prevision local por ciudad, costa, isla o zona de interior. WEERZONE prioriza
            las proximas 48 horas para ayudarte a decidir con menos ruido.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
              Destinos principales
            </h2>
            <Link href="/es/tiempo/espana" className="text-xs font-black uppercase tracking-[0.16em] text-accent-orange hover:opacity-80">
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topPlaces.map((place) => (
              <Link
                key={`${place.province}/${placeRouteSlug(place)}`}
                href={`/es/tiempo/espana/${placeRouteSlug(place)}`}
                className="card p-5 border border-white/5 hover:border-accent-orange/40 transition-all rounded-2xl"
              >
                <span className="text-sm font-bold text-text-primary">{place.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-black text-text-primary mb-2">Toda Espana en una vista</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            El indice completo reune ciudades grandes, pueblos, costas e islas en una sola lista.
          </p>
          <Link href="/es/tiempo/espana" className="btn btn-primary btn-sm">
            Abrir indice de Espana
          </Link>
        </section>
      </main>
    </>
  );
}
