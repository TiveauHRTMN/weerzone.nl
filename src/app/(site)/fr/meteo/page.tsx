import type { Metadata } from "next";
import Link from "next/link";
import { FR_REGION_LABELS, FR_REGION_SLUGS } from "@/config/locales";

export const metadata: Metadata = {
  title: "Météo France | Régions",
  description:
    "Météo actuelle pour les régions de France et de Belgique francophone. Choisissez votre région pour des prévisions précises à 48 heures.",
  alternates: {
    canonical: "https://weerzone.nl/fr/meteo",
    languages: {
      "nl-NL": "https://weerzone.nl/weer",
      "de-DE": "https://weerzone.nl/de/wetter",
      "fr-FR": "https://weerzone.nl/fr/meteo",
      "x-default": "https://weerzone.nl/weer",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl/fr" },
    { "@type": "ListItem", position: 2, name: "Météo", item: "https://weerzone.nl/fr/meteo" },
  ],
};

export default function MeteoIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-text-primary mb-2">
            Météo Régions
          </h1>
          <p className="text-text-secondary">
            Choisissez votre région pour obtenir les prévisions météorologiques locales.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {FR_REGION_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/fr/meteo/${slug}`}
              className="card p-5 border border-white/5 hover:border-accent-orange/40 transition-all rounded-2xl"
            >
              <span className="text-sm font-bold text-text-primary">
                {FR_REGION_LABELS[slug] ?? slug}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
