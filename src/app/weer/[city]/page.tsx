import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import WeatherDashboard from "@/components/WeatherDashboard";

function findCity(slug: string) {
  return DUTCH_CITIES.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug
  );
}

export function generateStaticParams() {
  return DUTCH_CITIES.map((city) => ({
    city: city.name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = findCity(slug);
  if (!city) return {};

  const title = `Weer ${city.name} — Vandaag & 48 uur vooruit | WeerZone`;
  const description = `Actueel weer in ${city.name}. Temperatuur, neerslag, wind en 48-uurs voorspelling op basis van KNMI HARMONIE en DWD ICON modellen. Betrouwbaar en nauwkeurig.`;

  return {
    title,
    description,
    keywords: [
      `weer ${city.name.toLowerCase()}`,
      `weerbericht ${city.name.toLowerCase()}`,
      `${city.name.toLowerCase()} weer vandaag`,
      `temperatuur ${city.name.toLowerCase()}`,
      "weer",
      "48 uur weer",
      "weerzone",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "nl_NL",
      url: `https://weerzone.nl/weer/${slug}`,
    },
    alternates: {
      canonical: `https://weerzone.nl/weer/${slug}`,
    },
  };
}

export default async function CityWeatherPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = findCity(slug);
  if (!city) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Weer ${city.name} — WeerZone`,
    description: `Actueel weer en 48-uurs voorspelling voor ${city.name}`,
    url: `https://weerzone.nl/weer/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "WeerZone",
      url: "https://weerzone.nl",
    },
    about: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "Country",
        name: "Nederland",
      },
    },
    provider: {
      "@type": "Organization",
      name: "WeerZone",
      url: "https://weerzone.nl",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard initialCity={city} />
      </main>
    </>
  );
}
