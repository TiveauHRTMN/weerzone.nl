import type { Metadata } from "next";
import { Suspense } from "react";
import WeatherDashboard from "@/components/WeatherDashboard";
import RainMap from "@/components/RainMap";
import KNMIForecastCard from "@/components/KNMIForecastCard";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData, fetchAirQuality, fetchMarineData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince, nearestProvinceSlug, PROVINCE_SLUG_TO_KNMI } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PollenWidget from "@/components/PollenWidget";
import MarineWidget from "@/components/MarineWidget";
import PietDailyBriefingLoader from "@/components/PietDailyBriefingLoader";
import PietDailyBriefingSkeleton from "@/components/PietDailyBriefingSkeleton";
import { hreflangCluster } from "@/lib/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "jouw locatie";
  const title = loc?.name
    ? `Piet voor ${place} - 48 uur vooruit`
    : "Piet - jouw dagelijkse heads-up";
  const description = loc?.name
    ? `Persoonlijk weerbericht voor ${place}. Je ziet wat de komende 48 uur betekenen voor regen, wind en planning.`
    : "Persoonlijk weerbericht voor de komende 48 uur op jouw locatie. In gewone taal, zonder reclame en zonder gokwerk over twee weken vooruit.";

  return {
    title,
    description,    alternates: {
      canonical: "https://weerzone.nl/piet",
      languages: hreflangCluster({
        nl: "/piet",
        de: "/de/mein-wetter",
        fr: "/fr/mon-meteo",
        es: "/es/mi-tiempo",
      }),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "nl_NL",
      url: "https://weerzone.nl/piet",
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Piet",
  headline: "Piet - 48 uur vooruit",
  description:
    "Een duidelijk weerbericht voor jouw locatie. Geen 14-daagse gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/piet",
  inLanguage: "nl-NL",
  about: {
    "@type": "Thing",
    name: "Weerbericht voor de komende 48 uur",
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "Waarom stopt Mijn Weer bij 48 uur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat die periode het meest bruikbaar is voor concrete keuzes en planning per uur.",
      },
    },
    {
      "@type": "Question",
      name: "Kan ik mijn locatie aanpassen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Gebruik de GPS-knop om direct je actuele locatie te laden of kies een andere plaats.",
      },
    },
  ],
};

function timeGreeting(): string {
  const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })).getHours();
  if (h >= 6 && h < 12) return "Goedemorgen";
  if (h >= 12 && h < 18) return "Goedemiddag";
  if (h >= 18 && h < 23) return "Goedenavond";
  return "Hoi";
}

export default async function PietPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, allWarnings, provinceSlug, airQuality, marineData] = await Promise.all([
    fetchWeatherData(lat, lon).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
    nearestProvinceSlug(lat, lon).catch(() => null),
    fetchAirQuality(lat, lon).catch(() => null),
    fetchMarineData(lat, lon).catch(() => null),
  ]);
  const provinceWarnings = provinceSlug ? warningsForProvince(allWarnings, provinceSlug) : [];

  let greetingName = "jou";
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile } = await supabase
        .from("user_profile")
        .select("full_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profile?.full_name) {
        greetingName = profile.full_name.split(" ")[0];
      }
    }
  } catch {
    // Default greeting
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={activeLoc}
          initialWeather={initialWeather}
          initialWeatherCode={initialWeather?.current.weatherCode}
          initialIsDay={initialWeather?.current.isDay}
          hideWeatherInfo={true}
          showRainRadar={true}
          beforeFooter={
            <div className="space-y-4 mt-8">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Hoe werkt Mijn Weer
                </p>
                <h2 className="text-xl font-black text-slate-900 mb-3">
                  48 uur vooruit — niet meer, niet minder
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  WEERZONE focust bewust op de komende 48 uur. Dat is de periode waarin een weersverwachting
                  nog bruikbaar is voor concrete beslissingen: of je de was buiten hangt, de auto meeneemt,
                  of een afspraak buiten plant. Verder vooruit wordt het giswerk — wij doen niet aan giswerk.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We gebruiken actuele gegevens en maken daar een eerlijk verhaal van: per uur, op jouw locatie,
                  zonder moeilijke termen om indruk te maken.
                </p>              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Locatie</p>
                  <p className="font-black text-slate-900 mb-1">Voor jouw buurt</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Niet alleen het weer voor de regio of provincie, maar zo dicht mogelijk bij jouw plek.
                    Regen kan twee kilometer verderop vallen terwijl het bij jou droog blijft.
                    WEERZONE maakt dat verschil zichtbaar.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Geen ruis</p>
                  <p className="font-black text-slate-900 mb-1">Alleen wat telt vandaag</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Geen eindeloze grafieken of 14-daagse voorspellingen die morgen al kloppen van geen
                    kanten. Mijn Weer toont temperatuur, neerslag, wind en UV — per uur, in gewone taal,
                    zonder reclame of tracking.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">KNMI-waarschuwingen</p>
                  <p className="font-black text-slate-900 mb-1">Direct bovenin bij gevaar</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Als het KNMI een waarschuwing uitgeeft voor jouw provincie — storm, onweer, hitte,
                    gladheid — zie je dat direct bovenin Mijn Weer. Geen aparte app of website nodig.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Betrouwbaarheid</p>
                  <p className="font-black text-slate-900 mb-1">Eerlijk over wat we weten</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    De komende 48 uur zijn meestal het meest bruikbaar voor echte keuzes. Verder vooruit
                    neemt de onzekerheid snel toe, daarom maken we daar geen grote beloftes over.
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Meer uit Weerzone halen
                </p>
                <p className="text-slate-900 font-black text-lg mb-2">
                  Waarschuwingen die er echt toe doen
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Je ontvangt een bericht zodra het weer over jouw persoonlijke drempel gaat —
                  of dat nu zware regen, harde wind, hitte of onweer is. Je stelt zelf in wanneer
                  je gewaarschuwd wilt worden. Geen ruis, alleen meldingen die voor jou relevant zijn.
                </p>
              </div>
            </div>
          }
          topContent={
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">
                  Mijn Weer
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] mb-4">
                  {greetingName !== "jou" ? (
                    <>{timeGreeting()}, {greetingName}.<br /><span className="text-[#3b7ff0]">Dit is jouw dag.</span></>
                  ) : (
                    <>{timeGreeting()}.<br /><span className="text-[#3b7ff0]">Dit is jouw dag.</span></>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700">{activeLoc.name}</span>
                  {provinceSlug && PROVINCE_SLUG_TO_KNMI[provinceSlug] && (
                    <span className="text-sm text-slate-400">· {PROVINCE_SLUG_TO_KNMI[provinceSlug]}</span>
                  )}
                </div>
              </div>

              <Suspense fallback={<PietDailyBriefingSkeleton />}>
                <PietDailyBriefingLoader />
              </Suspense>

              {provinceWarnings.length > 0 && (
                <KnmiWarningBanner warnings={provinceWarnings} />
              )}

              <KNMIForecastCard lat={lat} lon={lon} city={activeLoc.name} initialWeather={initialWeather} />

              <RainMap lat={lat} lon={lon} />

              {airQuality && <PollenWidget data={airQuality} />}
              {marineData && <MarineWidget data={marineData} />}
            </div>
          }
        />
      </main>
    </>
  );
}
