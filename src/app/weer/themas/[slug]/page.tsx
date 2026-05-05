import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { notFound } from "next/navigation";
import { schemaWebPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";

interface Theme {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
}

const THEMES: Record<string, Theme> = {
  "bbq-weer": {
    slug: "bbq-weer",
    title: "BBQ Weer | Kunnen we vanavond barbecueën?",
    description: "De WeerZone BBQ-index: Wind, temperatuur en neerslag perfect geanalyseerd voor de ultieme grill-avond.",
    metaDescription: "Ontdek of het vandaag BBQ weer is in jouw regio. Wij checken de windkracht, neerslagkans en temperatuur van het KNMI Harmonie model.",
  },
  "strandweer": {
    slug: "strandweer",
    title: "Strandweer Nederland | SPF & UV Advies",
    description: "UV-index en wind aan de kust. Alles wat je moet weten voordat je naar Zandvoort of Scheveningen gaat.",
    metaDescription: "Actueel strandweer voor Nederland. UV-straling, watertemperatuur en windkracht aan de kust direct van het KNMI.",
  },
  "hardloopweer": {
    slug: "hardloopweer",
    title: "Hardloopweer | De ideale loopcondities",
    description: "Niet te warm, niet te koud. Wij checken de luchtvochtigheid en wind voor jouw perfecte run.",
    metaDescription: "Is het goed hardloopweer vandaag? Check de hardloop-index op WeerZone: wind, vochtigheid en temperatuur.",
  },
  "hooikoorts": {
    slug: "hooikoorts",
    title: "Hooikoorts Radar | Pollenbureau WeerZone",
    description: "Droge wind uit het oosten? Wij vertellen je precies wanneer je binnen moet blijven om die rode ogen te voorkomen.",
    metaDescription: "Actuele hooikoorts verwachting en pollenradar. WeerZone kijkt naar droogte en windrichting voor het beste advies.",
  },
  "wintersport-nl": {
    slug: "wintersport-nl",
    title: "Wintersport Nederland | Schaatsweer & Sneeuw",
    description: "Komt de vorst eraan? Wij monitoren de watertemperatuur en sneeuwkansen voor de Nederlandse wintersporter.",
    metaDescription: "Check de kans op natuurijs en sneeuw in Nederland. WeerZone kijkt dieper in de kaarten dan de rest.",
  }
};

export async function generateStaticParams() {
  return Object.keys(THEMES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const theme = THEMES[slug];
  if (!theme) return {};

  return {
    title: theme.title,
    description: theme.metaDescription,
    alternates: {
      canonical: `https://weerzone.nl/weer/themas/${theme.slug}`,
    },
  };
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = THEMES[slug];
  if (!theme) notFound();

  // Gebruik De Bilt als landelijke referentie voor de themapagina
  const deBilt = DUTCH_CITIES.find(c => c.name === "De Bilt")!;
  const weather = await fetchWeatherData(deBilt.lat, deBilt.lon);

  if (!weather) {
    return <div>Data tijdelijk niet beschikbaar...</div>;
  }

  return (
    <>
      <script {...schemaLd([
        schemaWebPage({
          name: theme.title.split("|")[0].trim(),
          url: `https://weerzone.nl/weer/themas/${slug}`,
          description: theme.metaDescription,
          dateModified: new Date().toISOString(),
        }),
        schemaBreadcrumb([
          { name: "WEERZONE", item: "https://weerzone.nl" },
          { name: "Weer", item: "https://weerzone.nl/weer" },
          { name: theme.title.split("|")[0].trim(), item: `https://weerzone.nl/weer/themas/${slug}` },
        ]),
      ])} />
    <WeatherDashboard
      initialCity={deBilt}
      initialWeather={weather}
      titleOverride={theme.title.split("|")[0].trim()}
      beforeFooter={
        <div className="mt-12 mb-20 px-6 max-w-2xl mx-auto">
          <div className="card p-8 bg-black/5 border-black/10">
            <h2 className="text-2xl font-black text-text-primary mb-4 uppercase tracking-tighter">
              {theme.title}
            </h2>
            <p className="text-text-secondary leading-relaxed text-lg italic">
              "{theme.description}"
            </p>
            <div className="mt-6 flex gap-4">
              <div className="w-1 h-12 bg-accent-orange rounded-full" />
              <p className="text-sm text-text-muted">
                Deze pagina is hyper-gespecialiseerd op basis van het KNMI Harmonie model. 
                Geen gemiddelden, maar pure data voor jouw {slug.replace("-", " ")}.
              </p>
            </div>
          </div>
        </div>
      }
    />
    </>
  );
}
