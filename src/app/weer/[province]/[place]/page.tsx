import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_PLACES, findPlace, placeSlug, nearbyPlaces, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ZakelijkCTA from "@/components/ZakelijkCTA";
import { getLocationSEOContent } from "@/app/actions";
import { fetchWeatherData } from "@/lib/weather";
import Link from "next/link";

interface PageProps {
  params: Promise<{ province: string; place: string }>;
}

/** 
 * We laten deze leeg zodat we niet 7000+ pagina's tijdens de build hoeven te fetchen. 
 * Next.js genereert ze on-demand (ISR) zodra Google ze crawlt via de sitemap.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  if (!place) return {};

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const title = `Weer ${place.name} — Actueel weerbericht vandaag en morgen`;
  const description = `Weer in ${place.name} (${provLabel}). De enige weerdienst die niet gokt. Bekijk de 48-uurs voorspelling snoeihard op basis van KNMI HARMONIE. Temperatuur, regen, wind en UV — per uur bijgewerkt.`;

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

const TOP_CITIES = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven", 
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", 
  "Apeldoorn", "Enschede", "Haarlem", "Arnhem", "Amersfoort", 
  "Zwolle", "Zoetermeer", "Leiden", "Dordrecht", "'s-Hertogenbosch"
];

export default async function PlaceWeatherPage({ params }: PageProps) {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  if (!place) notFound();

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const nearby = nearbyPlaces(place, 12);
  const isTopCity = TOP_CITIES.includes(place.name);

  // Initial weather fetch on server for instant LCP & Disaster SEO
  const initialWeather = await fetchWeatherData(place.lat, place.lon).catch(() => undefined);

  // Hermes Disaster SEO: Dynamic Schema Injection
  let schemaTitle = `Weer ${place.name} — WEERZONE`;
  let schemaDesc = `48 uur nauwkeurig weer voor ${place.name}, ${provLabel}. Hardste data via KNMI HARMONIE.`;
  
  if (initialWeather) {
    const { getMisereScore } = await import("@/lib/commentary");
    const misery = getMisereScore(initialWeather);
    // If the weather is highly disruptive, hijack the SERP schema
    if (misery.score >= 8) {
      schemaTitle = `🚨 ALARM: Extreem Weer ${place.name} — WEERZONE`;
      schemaDesc = `WAARSCHUWING voor ${place.name}: ${misery.label}. Bekijk de exacte 48-uurs voorspelling en extremiteiten-index.`;
    }
  }

  // Structured data: WeatherForecast (voor Google rich results)
  const weatherForecastLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: schemaTitle,
    description: schemaDesc,
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

  // FAQ Schema voor Top Cities (SEO Boost)
  const faqLd = isTopCity ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Wat is de weersverwachting voor ${place.name} de komende 48 uur?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `In ${place.name} tonen wij een per uur bijgewerkte verwachting voor de komende 48 uur op basis van het messcherpe KNMI HARMONIE model. Bekijk temperatuur, wind en regen op de vierkante meter.`,
        },
      },
      {
        "@type": "Question",
        name: `Wanneer gaat het regenen in ${place.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De neerslagverwachting voor ${place.name} vind je per uur op WEERZONE. Onze data toont exact wanneer buien beginnen en eindigen.`,
        },
      },
    ],
  } : null;

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

  const city = { name: place.name, lat: place.lat, lon: place.lon };


  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify([
            weatherForecastLd,
            ...(faqLd ? [faqLd] : []),
            breadcrumbLd
          ]) 
        }} 
      />
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

        <WeatherDashboard initialCity={city} initialWeather={initialWeather} />

        {/* AI Programmatic SEO Content */}
        <section className="max-w-4xl mx-auto px-4 py-8 border-t border-white/5">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-accent-cyan">ℹ️</span> Weer in {place.name}: Lokaal karakter
            </h2>
            <div className="text-white/70 leading-relaxed italic">
              {await getLocationSEOContent(place.name, provLabel, place.character)}
            </div>
          </div>
        </section>

        <ZakelijkCTA cityName={place.name} />
        <NearbyLinks currentCity={place.name} places={nearbyPlaces(place, 8)} />
      </main>
    </>
  );
}
