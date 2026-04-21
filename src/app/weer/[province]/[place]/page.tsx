import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_PLACES, findPlace, placeSlug, nearbyPlaces, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ZakelijkCTA from "@/components/ZakelijkCTA";
import Link from "next/link";

interface PageProps {
  params: Promise<{ province: string; place: string }>;
}

export function generateStaticParams() {
  return ALL_PLACES.map((p) => ({
    province: p.province,
    place: placeSlug(p.name),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  if (!place) return {};

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const title = `Weer ${place.name} — Actueel weerbericht vandaag en morgen`;
  const description = `Weer in ${place.name} (${provLabel}). Bekijk de 48-uurs voorspelling op basis van KNMI HARMONIE en DWD ICON. Temperatuur, regen, wind en UV — per uur bijgewerkt.`;

  return {
    title,
    description,
    keywords: [
      `weer ${place.name.toLowerCase()}`,
      `weer ${place.name.toLowerCase()} vandaag`,
      `weer ${place.name.toLowerCase()} morgen`,
      `weerbericht ${place.name.toLowerCase()}`,
      `temperatuur ${place.name.toLowerCase()}`,
      `regen ${place.name.toLowerCase()}`,
      `onweer ${place.name.toLowerCase()}`,
      `weer ${provLabel.toLowerCase()}`,
      "weer nederland",
      "weerzone",
    ],
    openGraph: {
      title: `Weer ${place.name} — WEERZONE`,
      description,
      type: "website",
      locale: "nl_NL",
      url: `https://weerzone.nl/weer/${province}/${slug}`,
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title: `Weer ${place.name} — 48 uur | WEERZONE`,
      description: `Het weer in ${place.name}. Per uur bijgewerkt.`,
    },
    alternates: {
      canonical: `https://weerzone.nl/weer/${province}/${slug}`,
    },
  };
}

export default async function PlaceWeatherPage({ params }: PageProps) {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  if (!place) notFound();

  const provLabel = PROVINCE_LABELS[province as Province] || province;

  // Structured data: WeatherForecast (voor Google rich results)
  const weatherForecastLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Weer ${place.name} — WEERZONE`,
    description: `48 uur nauwkeurig weer voor ${place.name}, ${provLabel}. KNMI HARMONIE + DWD ICON.`,
    url: `https://weerzone.nl/weer/${province}/${slug}`,
    dateModified: new Date().toISOString(),
    inLanguage: "nl",
    isPartOf: {
      "@type": "WebSite",
      name: "WEERZONE",
      url: "https://weerzone.nl",
    },
    about: {
      "@type": "City",
      name: place.name,
      geo: {
        "@type": "GeoCoordinates",
        latitude: place.lat,
        longitude: place.lon,
      },
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: provLabel,
        containedInPlace: {
          "@type": "Country",
          name: "Nederland",
        },
      },
    },
    provider: {
      "@type": "Organization",
      name: "WEERZONE",
      url: "https://weerzone.nl",
      logo: "https://weerzone.nl/favicon-icon.png",
    },
  };

  // FAQ structured data — voor featured snippets
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Wat is het weer in ${place.name} vandaag?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Bekijk het actuele weer in ${place.name} op WEERZONE. Per uur bijgewerkt met data van KNMI HARMONIE en DWD ICON.`,
        },
      },
      {
        "@type": "Question",
        name: `Gaat het regenen in ${place.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De neerslagverwachting voor ${place.name} vind je per uur op WEERZONE. Twee weermodellen tonen wanneer het droog of nat wordt.`,
        },
      },
      {
        "@type": "Question",
        name: `Hoe warm wordt het in ${place.name} morgen?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De temperatuur voor morgen in ${place.name} vind je op WEERZONE, inclusief gevoelstemperatuur, wind en neerslagkans.`,
        },
      },
    ],
  };

  // Breadcrumb
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: provLabel, item: `https://weerzone.nl/weer/${province}` },
      { "@type": "ListItem", position: 4, name: place.name, item: `https://weerzone.nl/weer/${province}/${slug}` },
    ],
  };

  // Nearby places voor interne links
  const nearby = nearbyPlaces(place, 5).map((p) => ({
    name: p.name,
    lat: p.lat,
    lon: p.lon,
  }));

  const city = { name: place.name, lat: place.lat, lon: place.lon };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(weatherForecastLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main>
        {/* Breadcrumb navigatie */}
        <nav className="max-w-4xl mx-auto px-4 pt-4 text-xs text-white/50">
          <Link href="/" className="hover:text-white">WEERZONE</Link>
          <span className="mx-1.5">/</span>
          <Link href="/weer" className="hover:text-white">Weer</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/weer/${province}`} className="hover:text-white">{provLabel}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/80">{place.name}</span>
        </nav>

        <WeatherDashboard initialCity={city} />
        <ZakelijkCTA cityName={place.name} />
        <NearbyLinks currentCity={place.name} cities={nearby} />
      </main>
    </>
  );
}
