import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NL_PLACES, findPlace, isNLProvince, nearbyPlaces, placeRouteSlug, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import { schemaCityWeatherPage, schemaBreadcrumb, schemaLd, schemaCityDataset } from "@/lib/schema";
import DayBriefing from "@/components/DayBriefing";
import NearbyLinks from "@/components/NearbyLinks";
import ProvinceTopCities from "@/components/ProvinceTopCities";
import LocalComparison from "@/components/LocalComparison";
import { getLocationSEOContent } from "@/app/actions";
import { buildAgentContext } from "@/lib/agents/context";
import { ALL_AGENT_PREFERENCES } from "@/lib/agents/preferences";
import { fetchAirQuality } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import Link from "next/link";
import { getLocationWeatherProfile } from "@/lib/location-profile";
import { venueMetaTitle } from "@/lib/venue-content";
import "../../../vandaag/vandaag-skin.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

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
  const locationProfile = getLocationWeatherProfile(place);

  // Bouw dezelfde premium agent-context als /vandaag, maar voor déze plaats.
  // buildAgentContext doet alleen cache/storage-reads met deadlines (geen LLM),
  // dus het is veilig voor de ~10k programmatische ISR-pagina's.
  const [ctx, airQuality, allWarnings, hermesSEO, seoContent] = await Promise.all([
    buildAgentContext({ name: place.name, lat: place.lat, lon: place.lon }).catch(() => null),
    fetchAirQuality(place.lat, place.lon).catch(() => null),
    fetchKNMIWarnings().catch(() => []),
    getHermesSEO(place.name, province).catch(() => null),
    getLocationSEOContent(place.name, provLabel, place.character, place.venueType).catch(() => ""),
  ]);
  const initialWeather = ctx?.weather;
  const provinceWarnings = warningsForProvince(allWarnings, province);

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
      <main className={`va-skin ${manrope.className}`}>
        <KnmiWarningBanner warnings={provinceWarnings} />

        {ctx ? (
          <DayBriefing
            ctx={ctx}
            preferences={ALL_AGENT_PREFERENCES}
            dayOffset={0}
            airQuality={airQuality}
            hideDayToggle
            appendedContent={
              <>
                {/* Lokaal karakter — premium kaart, cohesief met de briefing */}
                <section className="space-y-3">
                  <div className="va-section-head px-1">
                    <div>
                      <span className="va-onsky va-micro">In het kort</span>
                      <h2>Wat maakt het weer in {place.name} anders?</h2>
                    </div>
                  </div>
                  <article className="va-card p-5 sm:p-6">
                    <p className="text-[15px] leading-relaxed text-slate-700" data-speakable>
                      {hermesSEO?.geo_optimized_summary || locationProfile.summary || seoContent}
                    </p>
                    {locationProfile.factors.length > 0 && (
                      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {locationProfile.factors.map((factor) => (
                          <div key={factor} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                            <p className="va-micro mb-1 text-slate-400">Lokale factor</p>
                            <p className="text-[13px] font-semibold leading-snug text-slate-700">{factor}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {initialWeather && (
                      <div className="mt-5">
                        <LocalComparison cityName={place.name} province={province} localTemp={initialWeather.current.temperature} />
                      </div>
                    )}
                  </article>
                </section>

                <CityGeoBlock block={geoBlock} inLanguage="nl-NL" />

                {/* CTA: persoonlijk Weerzone-account voor deze plaats */}
                <Link
                  href={`/app/signup?city=${encodeURIComponent(place.name)}`}
                  className="group flex items-center justify-between gap-4 rounded-3xl bg-[var(--wz-sun)] p-6 text-slate-900 shadow-[0_18px_42px_-22px_rgba(180,140,0,0.7)] transition-transform hover:scale-[1.01]"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Elke ochtend, gratis voor {place.name}</p>
                    <p className="mt-1 text-lg font-black leading-tight tracking-tight">Je persoonlijke weerbericht →</p>
                  </div>
                  <span className="text-3xl" aria-hidden>📬</span>
                </Link>

                <ProvinceTopCities province={province} currentCity={place.name} />
                <NearbyLinks currentCity={place.name} places={nearby} />
              </>
            }
          />
        ) : (
          <div className="relative z-10 mx-auto max-w-[680px] px-4 py-14">
            <div className="va-card p-8 text-center">
              <h1 className="text-2xl font-extrabold text-slate-950">Het weer in {place.name} is even niet beschikbaar</h1>
              <p className="mt-2 text-sm text-slate-600">Probeer het over een moment opnieuw.</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
