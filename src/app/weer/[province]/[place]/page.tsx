import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_PLACES, findPlace, placeSlug, nearbyPlaces, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ProvinceTopCities from "@/components/ProvinceTopCities";
import LocalComparison from "@/components/LocalComparison";
import ZakelijkCTA from "@/components/ZakelijkCTA";
import { getLocationSEOContent } from "@/app/actions";
import { fetchWeatherData } from "@/lib/weather";
import { getWeatherDescription } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import Link from "next/link";

interface PageProps {
  params: Promise<{ province: string; place: string }>;
}

/** 
 * We laten deze leeg zodat we niet 7000+ pagina's tijdens de build hoeven te fetchen. 
 * Next.js genereert ze on-demand (ISR) zodra Google ze crawlt via de sitemap.
 */
export function generateStaticParams() {
  // We pre-renderen alleen de top 20 steden voor razendsnelle initiële indexering.
  // De overige 9.000+ worden on-demand (ISR) gegenereerd.
  return ALL_PLACES
    .filter(p => TOP_CITIES.includes(p.name))
    .map((p) => ({ 
      province: p.province, 
      place: placeSlug(p.name) 
    }));
}

import { getHermesSEO } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  if (!place) return {};

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const hermesSEO = await getHermesSEO(place.name, province);

  const title = `Weer ${place.name} | 10x Nauwkeuriger op Straatniveau | WeerZone`;
  const description = hermesSEO?.meta_description || `Weer in ${place.name} (${provLabel}). De nauwkeurigste 48-uurs weersvoorspelling van Nederland, op 1 bij 1 kilometer. Temperatuur, regen, wind en UV — per uur bijgewerkt.`;

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

import { headers } from "next/headers";

export default async function PlaceWeatherPage({ params }: PageProps) {
  const { province, place: slug } = await params;
  let place = findPlace(province, slug);
  
  // Bot detectie voor besparen API limits
  const headersList = await headers();
  const userAgent = headersList.get("user-agent")?.toLowerCase() || "";
  const isBot = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(userAgent);

  // Als niet in statische lijst, check DB (OpenClaw's vondsten)
  if (!place) {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("discovered_places")
        .select("*")
        .eq("province", province)
        .ilike("name", slug.replace(/-/g, " ")) // Simpele fallback match
        .maybeSingle();
      
      if (data) {
        place = {
          name: data.name,
          province: data.province,
          lat: data.lat,
          lon: data.lon,
          character: "inland"
        };
      }
    }
  }

  if (!place) notFound();

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const nearby = nearbyPlaces(place, 12);
  const isTopCity = TOP_CITIES.includes(place.name);

  // Initial weather fetch on server for instant LCP & Disaster SEO
  // Bij bots skippen we de zware modellen om API limits (429) te voorkomen
  const [initialWeather, allWarnings] = await Promise.all([
    fetchWeatherData(place.lat, place.lon, isBot).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
  ]);
  const provinceWarnings = warningsForProvince(allWarnings, province);

  // Hermes Disaster SEO: Dynamic Schema Injection
  let schemaTitle = `Weer ${place.name} — WEERZONE`;
  let schemaDesc = `De nauwkeurigste 48-uurs weersvoorspelling voor ${place.name}, ${provLabel}. Op 1 bij 1 kilometer precies.`;
  
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
    "@type": "WeatherForecast",
    "name": `Weersverwachting ${place.name}`,
    "url": `https://weerzone.nl/weer/${province}/${slug}`,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "contentLocation": {
      "@type": "City",
      "name": place.name,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": place.lat,
        "longitude": place.lon,
      }
    },
    "currentWeather": initialWeather ? {
      "@type": "PropertyValue",
      "name": "Temperatuur",
      "value": `${initialWeather.current.temperature}°C`,
      "description": getWeatherDescription(initialWeather.current.weatherCode)
    } : undefined,
    "forecast": initialWeather?.daily.slice(0, 3).map(d => ({
      "@type": "PropertyValue",
      "name": d.date,
      "value": `${d.tempMax}°C / ${d.tempMin}°C`,
      "description": getWeatherDescription(d.weatherCode)
    })),
    "provider": {
      "@type": "Organization",
      "name": "WEERZONE",
      "url": "https://weerzone.nl",
      "logo": "https://weerzone.nl/weerzone-icon.png",
    },
  };

  // FAQ Schema voor ALLE locaties (SEO Boost)
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Wat is de weersverwachting voor ${place.name} de komende 48 uur?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `In ${place.name} tonen wij een per uur bijgewerkte verwachting voor de komende 48 uur, op 1 bij 1 kilometer precies. Bekijk temperatuur, wind en regen voor uw exacte locatie.`,
        },
      },
      {
        "@type": "Question",
        name: `Wanneer gaat het regenen in ${place.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De neerslagverwachting voor ${place.name} vind je per uur op WEERZONE. Onze data toont exact wanneer buien beginnen en eindigen op straatniveau.`,
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

  const city = { name: place.name, lat: place.lat, lon: place.lon };
  const hermesSEO = await getHermesSEO(place.name, province);
  const seoContent = await getLocationSEOContent(place.name, provLabel, place.character);


  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify([
            weatherForecastLd,
            ...(faqLd ? [faqLd] : []),
            breadcrumbLd,
            ...(hermesSEO?.json_ld ? [hermesSEO.json_ld] : [])
          ]) 
        }} 
      />
      <main>
        {/* Breadcrumb navigatie */}
        <nav className="max-w-4xl mx-auto px-4 pt-4 text-xs text-white/50">
          <Link href="/weer" className="hover:text-white">Weer</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/weer/${province}`} className="hover:text-white">{provLabel}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/80">{place.name}</span>
        </nav>

        <KnmiWarningBanner warnings={provinceWarnings} />

        <WeatherDashboard
          initialCity={place} 
          initialWeather={initialWeather} 
          beforeFooter={
            <div className="space-y-6 pt-10">
              {/* Action Grid: Piet & Zakelijk side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link 
                  href={`/app/signup?tier=piet&city=${encodeURIComponent(place.name)}`}
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-accent-orange text-slate-900 shadow-xl hover:scale-[1.02] transition-all text-center border border-white/20"
                >
                  <span className="text-3xl mb-3">📬</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">Activeer Piet's brief</span>
                  <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest italic">Gratis voor {place.name}</span>
                </Link>

                <Link 
                  href="/zakelijk"
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-white/5 border border-white/10 text-white shadow-xl hover:scale-[1.02] transition-all text-center backdrop-blur-sm"
                >
                  <span className="text-3xl mb-3">💼</span>
                  <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">Zakelijk weerrapport</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">Planning voor bedrijven</span>
                </Link>
              </div>

              {/* Lokaal Karakter */}
              <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 shadow-2xl">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-accent-cyan">ℹ️</span> Weer in {place.name}: Lokaal karakter
                </h2>
                <div className="text-white/60 text-xs leading-relaxed italic mb-6">
                  {seoContent}
                </div>

                {initialWeather && (
                  <LocalComparison 
                    cityName={place.name} 
                    province={province} 
                    localTemp={initialWeather.current.temperature} 
                  />
                )}
              </div>

              <ProvinceTopCities province={province} currentCity={place.name} />
              <NearbyLinks currentCity={place.name} places={nearbyPlaces(place, 12)} />
            </div>
          }
        />
      </main>
    </>
  );
}
