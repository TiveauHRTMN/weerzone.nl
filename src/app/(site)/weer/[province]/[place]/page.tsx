import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NL_PLACES, findPlace, isNLProvince, nearbyPlaces, placeRouteSlug, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import { schemaCityWeatherPage, schemaBreadcrumb, schemaLd, schemaCityDataset } from "@/lib/schema";
import WeatherDashboard from "@/components/WeatherDashboard";
import NearbyLinks from "@/components/NearbyLinks";
import ProvinceTopCities from "@/components/ProvinceTopCities";
import LocalComparison from "@/components/LocalComparison";
import { getLocationSEOContent } from "@/app/actions";
import { fetchWeatherData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import Link from "next/link";
import { getLocationWeatherProfile } from "@/lib/location-profile";
import { venueH1, venueMetaTitle } from "@/lib/venue-content";

interface PageProps {
  params: Promise<{ province: string; place: string }>;
}

const KOOS_PRERENDERED_PLACE_NAMES = new Set([
  "Amsterdam",
  "Rotterdam",
  "Utrecht",
  "Den Haag",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Breda",
  "Nijmegen",
  "Texel",
  "Vlieland",
  "Terschelling",
  "Ameland",
  "Schiermonnikoog",
  "Griend",
  "Giethoorn",
  "Zandvoort",
  "Maastricht",
  "Middelburg",
  "Leiden Centraal",
  "Den Haag Centraal",
  "Arnhem Centraal",
  "Nationaal Park Veluwezoom",
  "Nationaal Park De Hoge Veluwe",
  "Nationaal Park De Biesbosch",
  "Camping De Lakens",
  "Camping Bakkum",
  "Camping De Krim",
  "Camping Stortemelk",
  "Camping Lauwersoog",
  "Camping Beerze Bulten",
  "Camping De Leistert",
]);

/** 
 * We laten deze leeg zodat we niet 7000+ pagina's tijdens de build hoeven te fetchen. 
 * Next.js genereert ze on-demand (ISR) zodra Google ze crawlt via de sitemap.
 */
export function generateStaticParams() {
  return NL_PLACES
    .filter((p) => KOOS_PRERENDERED_PLACE_NAMES.has(p.name) || (p.population ?? 0) >= 100_000)
    .map((p) => ({
      province: p.province,
      place: placeRouteSlug(p),
    }));
  // We pre-renderen de belangrijkste steden (pop > 10.000) voor razendsnelle initiële indexering.
  // De overige 10.000+ worden on-demand (ISR) gegenereerd.
}

import { getHermesSEO } from "@/lib/seo";
import { hreflangSelf } from "@/lib/hreflang";
import { buildCityGeoBlock } from "@/lib/geo-blocks";
import CityGeoBlock from "@/components/CityGeoBlock";
import MarianaSeoUpdate from "@/components/MarianaSeoUpdate";
import OracleSeoUpdate from "@/components/OracleSeoUpdate";

export const revalidate = 43200;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province, place: slug } = await params;
  if (!isNLProvince(province)) return {};
  const place = findPlace(province, slug);
  if (!place) return {};

  const provLabel = PROVINCE_LABELS[province as Province] || province;
  const hermesSEO = await getHermesSEO(place.name, province);
  const locationProfile = getLocationWeatherProfile(place);

  const title = place.venueType
    ? venueMetaTitle(place.name, place.venueType)
    : `Weer ${place.name} | 10x nauwkeuriger op straatniveau`;
  const description = hermesSEO?.meta_description || `${locationProfile.summary} Bekijk het weer in ${place.name} (${provLabel}) per uur: temperatuur, regen, wind en lokale context.`;

  const nlPath = `/weer/${province}/${slug}`;
  const languages: Record<string, string> = { ...hreflangSelf("nl", nlPath) };

  // Cross-locale equivalenten: plaatsen die ook in een andere taal-host bestaan
  // (Duitse/Franse/Spaanse/Luxemburgse plaatsen leven onder hun eigen provincie
  // in NL én onder hun locale-route). Voeg hreflang toe zodat Google ze koppelt.
  return {
    title,
    description,
    robots: { index: true, follow: true },
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
      languages,
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
  if (!isNLProvince(province)) notFound();
  let place = findPlace(province, slug);

  // Bot-detectie via headers() is weggehaald — was dynamisch-renderen forceren
  // zonder echt effect. fetchWeatherData hieronder geeft forceHighRes=false,
  // waardoor de isBot-vlag intern alsnog nergens gelezen werd. Nu kan deze
  // pagina via revalidate=300 cachebaar zijn.

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
  const nearby = nearbyPlaces(place, 24).filter((nearbyPlace) => isNLProvince(nearbyPlace.province)).slice(0, 12);
  const isTopCity = TOP_CITIES.includes(place.name);
  const locationProfile = getLocationWeatherProfile(place);

  // Fetch weather, KNMI warnings, and SEO data all in parallel
  const [initialWeather, allWarnings, hermesSEO, seoContent] = await Promise.all([
    fetchWeatherData(place.lat, place.lon, false, true, place, "nl", true).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
    getHermesSEO(place.name, province).catch(() => null),
    getLocationSEOContent(place.name, provLabel, place.character, place.venueType).catch(() => ""),
  ]);
  const provinceWarnings = warningsForProvince(allWarnings, province);

  // Hermes Disaster SEO: Dynamic Schema Injection
  let schemaTitle = `Weer ${place.name} — WEERZONE`;
  let schemaDesc = `De nauwkeurigste 48-uurs weersvoorspelling voor ${place.name}, ${provLabel}. Op 1 bij 1 kilometer precies.`;

  if (initialWeather) {
    const { getMisereScore } = await import("@/lib/commentary");
    const misery = getMisereScore(initialWeather);
    if (misery.score >= 8) {
      schemaTitle = `🚨 ALARM: Extreem Weer ${place.name} — WEERZONE`;
      schemaDesc = `WAARSCHUWING voor ${place.name}: ${misery.label}. Bekijk de exacte 48-uurs voorspelling en extremiteiten-index.`;
    }
  }

  // Freshness signal for Google: rounded to the current hour
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const dateModified = now.toISOString();

  const weatherPageLd = schemaCityWeatherPage({
    placeName: place.name,
    lat: place.lat,
    lon: place.lon,
    province,
    slug,
    venueType: place.venueType,
  });
  
  // Override the default dateModified from schema helper with our stable hourly one
  weatherPageLd.dateModified = dateModified;

  const datasetLd = schemaCityDataset({ placeName: place.name, url: `https://weerzone.nl/weer/${province}/${slug}` });
  datasetLd.temporalCoverage = `${dateModified.split('T')[0]}/${new Date(now.getTime() + 48 * 3600 * 1000).toISOString().split('T')[0]}`;

  const breadcrumbLd = schemaBreadcrumb([
    { name: "WEERZONE", item: "https://weerzone.nl" },
    { name: "Weer", item: "https://weerzone.nl/weer" },
    { name: provLabel, item: `https://weerzone.nl/weer/${province}` },
    { name: place.name, item: `https://weerzone.nl/weer/${province}/${slug}` },
  ]);

  const city = { name: place.name, lat: place.lat, lon: place.lon };

  const geoBlock = buildCityGeoBlock({
    place,
    regionLabel: provLabel,
    profile: locationProfile,
    weather: initialWeather,
    locale: "nl",
    dateModified: now,
  });

  return (
    <>
      <script {...schemaLd([
            weatherPageLd,
            breadcrumbLd,
            datasetLd,
            ...(hermesSEO?.json_ld ? [hermesSEO.json_ld] : []),
          ])}
      />
      <main>
        <KnmiWarningBanner warnings={provinceWarnings} />

        <WeatherDashboard
          initialCity={place}
          initialWeather={initialWeather}
          titleOverride={place.venueType ? venueH1(place.name, place.venueType) : undefined}
          beforeFooter={
            <div className="space-y-6 pt-10">
              <CityGeoBlock block={geoBlock} inLanguage="nl-NL" />
              <MarianaSeoUpdate weather={initialWeather} placeName={place.name} locale="nl" />
              <OracleSeoUpdate weather={initialWeather} placeName={place.name} locale="nl" />

              {/* CTA: persoonlijk Weerzone-account voor deze plaats */}
              <Link
                href={`/app/signup?city=${encodeURIComponent(place.name)}`}
                className="group flex flex-col items-center justify-center p-8 rounded-[32px] bg-accent-orange text-slate-900 shadow-xl hover:scale-[1.02] transition-all text-center border border-white/20"
              >
                <span className="text-3xl mb-3">📬</span>
                <span className="font-black text-sm uppercase tracking-tight leading-none mb-1">Je persoonlijke weerbericht</span>
                <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest italic">Elke ochtend, gratis voor {place.name}</span>
              </Link>

              {/* Lokaal Karakter */}
              <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 shadow-2xl">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-accent-cyan">ℹ️</span> Weer in {place.name}: Lokaal karakter
                </h2>
                <div className="text-white/60 text-xs leading-relaxed italic mb-6" data-speakable>
                  {hermesSEO?.geo_optimized_summary || locationProfile.summary || seoContent}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {locationProfile.factors.map((factor) => (
                    <div key={factor} className="rounded-2xl bg-white/8 border border-white/10 p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">Lokale factor</p>
                      <p className="text-xs font-bold leading-relaxed text-white/70">{factor}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-semibold leading-relaxed text-white/45 mb-6">
                  {locationProfile.marianaContext}
                </p>

                {initialWeather && (
                  <LocalComparison 
                    cityName={place.name} 
                    province={province} 
                    localTemp={initialWeather.current.temperature} 
                  />
                )}
              </div>

              <ProvinceTopCities province={province} currentCity={place.name} />
              <NearbyLinks currentCity={place.name} places={nearby} />
            </div>
          }
        />
      </main>
    </>
  );
}
