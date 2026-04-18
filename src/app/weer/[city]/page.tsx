import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ZakelijkCTA from "@/components/ZakelijkCTA";

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

  const title = `Vergeet volgende week. Dit gebeurt er de komende 48 uur in ${city.name}`;
  const description = `Weer ${city.name} — de komende 48 uur op de vierkante meter. KNMI HARMONIE + DWD ICON gecombineerd. Temperatuur, neerslag, wind. Geen 14-daagse ruis, gewoon de waarheid.`;

  return {
    title,
    description,
    keywords: [
      `weer ${city.name.toLowerCase()}`,
      `weerbericht ${city.name.toLowerCase()}`,
      `${city.name.toLowerCase()} weer vandaag`,
      `temperatuur ${city.name.toLowerCase()}`,
      `regen ${city.name.toLowerCase()}`,
      `weer ${city.name.toLowerCase()} morgen`,
      "weer nederland",
      "48 uur weer",
      "weerzone",
      "KNMI weer",
      "nauwkeurig weerbericht",
    ],
    openGraph: {
      title: `Weer ${city.name} nu — WEERZONE`,
      description,
      type: "website",
      locale: "nl_NL",
      url: `https://weerzone.nl/weer/${slug}`,
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title: `Weer ${city.name} — 48 uur | WEERZONE`,
      description: `Het weer in ${city.name}. KNMI HARMONIE + DWD ICON. Brutaal nauwkeurig.`,
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

  // FAQ structured data — boosts featured snippets in Google
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Wat is het weer in ${city.name} vandaag?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Bekijk het actuele weer in ${city.name} op WEERZONE. We combineren KNMI HARMONIE en DWD ICON voor de meest nauwkeurige 48-uurs voorspelling.`,
        },
      },
      {
        "@type": "Question",
        name: `Gaat het regenen in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Bekijk de live neerslagverwachting voor ${city.name} per uur op WEERZONE. Twee weermodellen tonen precies wanneer het droog of nat wordt.`,
        },
      },
      {
        "@type": "Question",
        name: `Hoe nauwkeurig is de weersverwachting voor ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `WEERZONE combineert twee toonaangevende weermodellen: KNMI HARMONIE (Nederlands) en DWD ICON (Duits). We voorspellen maximaal 48 uur vooruit — langer is wetenschappelijk onbetrouwbaar.`,
        },
      },
      {
        "@type": "Question",
        name: `Wat is de temperatuur in ${city.name} morgen?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De temperatuur voor morgen in ${city.name} vind je op WEERZONE, inclusief gevoelstemperatuur, wind en neerslagkans. Bijgewerkt elk uur.`,
        },
      },
    ],
  };

  // WebPage + breadcrumb structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Weer ${city.name} — WEERZONE`,
    description: `48 uur extreem nauwkeurig weer voor ${city.name}. KNMI HARMONIE + DWD ICON.`,
    url: `https://weerzone.nl/weer/${slug}`,
    dateModified: new Date().toISOString(),
    inLanguage: "nl",
    isPartOf: {
      "@type": "WebSite",
      name: "WEERZONE",
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
      name: "WEERZONE",
      url: "https://weerzone.nl",
      logo: "https://weerzone.nl/favicon-icon.png",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "WEERZONE",
        item: "https://weerzone.nl",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Weer",
        item: "https://weerzone.nl/weer",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: `https://weerzone.nl/weer/${slug}`,
      },
    ],
  };

  // Find 5 nearest other cities for internal linking
  const nearby = DUTCH_CITIES
    .filter(c => c.name !== city.name)
    .map(c => ({
      ...c,
      dist: Math.sqrt(Math.pow(c.lat - city.lat, 2) + Math.pow(c.lon - city.lon, 2)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <main>
        <WeatherDashboard initialCity={city} />
        <ZakelijkCTA cityName={city.name} />
        <NearbyLinks currentCity={city.name} cities={nearby} />
      </main>
    </>
  );
}
