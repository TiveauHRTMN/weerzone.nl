import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import { PROVINCE_LABELS, Province, ALL_PLACES, placeSlug } from "@/lib/places-data";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ZakelijkCTA from "@/components/ZakelijkCTA";
import { getLocationSEOContent, getProvinceVerdict } from "@/app/actions";
import { fetchWeatherData } from "@/lib/weather";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findCity(slug: string) {
  return DUTCH_CITIES.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug
  );
}

const VALID_PROVINCES = Object.keys(PROVINCE_LABELS);

// ============================================================
// METADATA
// ============================================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // 1. Check if City
  const city = findCity(slug);
  if (city) {
    const title = `Weer ${city.name} — De komende 48 uur weersverwachting`;
    const description = `Actueel weer in ${city.name}. Bekijk de meest nauwkeurige 48-uurs voorspelling (KNMI HARMONIE) op de 2,5 km² nauwkeurig. Geen 14-daagse gokwerk, gewoon de feiten voor ${city.name}.`;
    return {
      title,
      description,
      alternates: { canonical: `https://weerzone.nl/weer/${slug}` },
      openGraph: {
        title: `Weer ${city.name} nu — WEERZONE`,
        description,
        type: "website",
        locale: "nl_NL",
        url: `https://weerzone.nl/weer/${slug}`,
        siteName: "WEERZONE",
      },
    };
  }

  // 2. Check if Province
  if (VALID_PROVINCES.includes(slug)) {
    const label = PROVINCE_LABELS[slug as Province];
    return {
      title: `Weer ${label} — Alle plaatsen | WEERZONE`,
      description: `Het weer in ${label}. Bekijk de actuele weersverwachting voor alle steden en dorpen in ${label}.`,
      alternates: { canonical: `https://weerzone.nl/weer/${slug}` },
    };
  }

  return {};
}

// ============================================================
// STATIC PARAMS
// ============================================================
export function generateStaticParams() {
  // Prerender alleen de top 30 steden om build-tijd te beheersen
  const cityParams = DUTCH_CITIES.slice(0, 30).map((city) => ({
    slug: city.name.toLowerCase().replace(/\s+/g, "-"),
  }));
  const provinceParams = VALID_PROVINCES.map((province) => ({
    slug: province,
  }));
  return [...cityParams, ...provinceParams];
}

// ============================================================
// PAGE
// ============================================================
export default async function MergedSlugPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Try City
  const city = findCity(slug);
  if (city) {
    // FAQ structured data
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
      ],
    };

    const nearby = DUTCH_CITIES
      .filter(c => c.name !== city.name)
      .map(c => ({
        ...c,
        dist: Math.sqrt(Math.pow(c.lat - city.lat, 2) + Math.pow(c.lon - city.lon, 2)),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);

    // Initial weather fetch on server for instant LCP
    const initialWeather = await fetchWeatherData(city.lat, city.lon).catch(() => undefined);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        <main>
          <WeatherDashboard initialCity={city} initialWeather={initialWeather} />

          {/* AI Programmatic SEO Content */}
          <section className="max-w-4xl mx-auto px-4 py-8 border-t border-white/5">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-accent-cyan">ℹ️</span> Weer in {city.name}: Lokaal karakter
              </h2>
              <div className="text-white/70 leading-relaxed italic">
                {await getLocationSEOContent(city.name, "Nederland")}
              </div>
            </div>
          </section>

          <ZakelijkCTA cityName={city.name} />
          <NearbyLinks currentCity={city.name} cities={nearby} />
        </main>
      </>
    );
  }

  // 2. Try Province
  if (VALID_PROVINCES.includes(slug)) {
    const label = PROVINCE_LABELS[slug as Province];
    const places = ALL_PLACES
      .filter((p) => p.province === slug)
      .sort((a, b) => a.name.localeCompare(b.name, "nl"));

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WEERZONE</Link>
            <span className="mx-2">/</span>
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{label}</span>
          </nav>
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">Weer in {label}</h1>
            <p className="text-white/70 text-lg mb-4">Overzicht van het weer in alle {places.length} plaatsen in {label}.</p>
            <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-sm italic">
              &ldquo;{await getProvinceVerdict(label)}&rdquo;
            </div>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {places.map((p) => (
              <Link
                key={p.name}
                href={`/weer/${slug}/${placeSlug(p.name)}`}
                className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all"
              >
                Weer {p.name}
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  notFound();
}
