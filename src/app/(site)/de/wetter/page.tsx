import type { Metadata } from "next";
import Link from "next/link";
import { DE_BUNDESLAND_LABELS, DE_BUNDESLAND_SLUGS } from "@/config/locales";

export const metadata: Metadata = {
  title: "Wetter Deutschland | Alle Bundesländer",
  description:
    "Aktuelles Wetter für alle deutschen Bundesländer und Städte. Wähle dein Bundesland für präzise 48-Stunden-Prognosen.",
  alternates: {
    canonical: "https://weerzone.nl/de/wetter",
    languages: {
      "nl-NL": "https://weerzone.nl/weer",
      "de-DE": "https://weerzone.nl/de/wetter",
      "x-default": "https://weerzone.nl/weer",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl/de" },
    { "@type": "ListItem", position: 2, name: "Wetter", item: "https://weerzone.nl/de/wetter" },
  ],
};

export default function WetterIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-text-primary mb-2">
            Wetter Deutschland
          </h1>
          <p className="text-text-secondary">
            Wähle dein Bundesland für die lokale Wettervorhersage.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {DE_BUNDESLAND_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/de/wetter/${slug}`}
              className="card p-5 border border-white/5 hover:border-accent-orange/40 transition-all rounded-2xl"
            >
              <span className="text-sm font-bold text-text-primary">
                {DE_BUNDESLAND_LABELS[slug] ?? slug}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
