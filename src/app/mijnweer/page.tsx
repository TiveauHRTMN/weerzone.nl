import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import RainMap from "@/components/RainMap";
import KNMIClimateCard from "@/components/KNMIClimateCard";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData, fetchAirQuality, fetchMarineData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince, nearestProvinceSlug, PROVINCE_SLUG_TO_KNMI } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import LocateButton from "@/components/LocateButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PollenWidget from "@/components/PollenWidget";
import MarineWidget from "@/components/MarineWidget";
import PietDailyBriefing from "@/components/PietDailyBriefing";
import { fetchPietDailyBriefing } from "@/lib/piet-briefing";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "jouw locatie";
  const title = loc?.name
    ? `Mijn Weer voor ${place} - 48 uur vooruit`
    : "Mijn Weer - Hyperlokaal weerbericht";
  const description = loc?.name
    ? `Persoonlijk weerbericht voor ${place}. Je ziet wat de komende 48 uur betekenen voor regen, wind en planning.`
    : "Persoonlijk weerbericht voor de komende 48 uur op jouw locatie. In gewone taal, zonder reclame en zonder gokwerk over twee weken vooruit.";

  return {
    title,
    description,
    keywords: [
      "mijn weer",
      "persoonlijk weerbericht",
      "48 uur weer",
      "weer op locatie",
      "regen verwachting",
      "wind voorspelling",
      "weer vandaag",
    ],
    alternates: { canonical: "https://weerzone.nl/mijnweer" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "nl_NL",
      url: "https://weerzone.nl/mijnweer",
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
  name: "Mijn Weer",
  headline: "Piet - Hyperlokaal 48-uurs weerbericht",
  description:
    "De dagelijkse weeranalyse van Piet voor jouw GPS-locatie. Geen 14-daagse gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/mijnweer",
  inLanguage: "nl-NL",
  about: {
    "@type": "Thing",
    name: "Hyperlokaal weerbericht voor de komende 48 uur",
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

export default async function MijnWeerPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, allWarnings, provinceSlug, airQuality, marineData, pietBriefing] = await Promise.all([
    fetchWeatherData(lat, lon).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
    nearestProvinceSlug(lat, lon).catch(() => null),
    fetchAirQuality(lat, lon).catch(() => null),
    fetchMarineData(lat, lon).catch(() => null),
    fetchPietDailyBriefing().catch(() => null),
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
          beforeFooter={
            <div className="space-y-4 mt-8">
              <KNMIClimateCard lat={lat} lon={lon} />
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
                  Onze data komt rechtstreeks van de meest betrouwbare bronnen in Nederland. We vergelijken de beste weermodellen en tonen je het eerlijke resultaat — per uur, op jouw locatie.
                </p>              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Locatie</p>
                  <p className="font-black text-slate-900 mb-1">Hyperlokaal op 1×1 km</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Niet het weer voor de regio of de provincie — maar voor jouw specifieke postcode.
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Nauwkeurigheid</p>
                  <p className="font-black text-slate-900 mb-1">92–98% voor de komende 48 uur</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Voor de komende 24 uur zijn onze voorspellingen 95–98% nauwkeurig. Voor 24–48 uur
                    is dat 92–95%. Daarna neemt de betrouwbaarheid snel af — vandaar onze bewuste keuze
                    voor die tijdshorizon.
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
                  Met Reed ontvang je een bericht zodra het weer over jouw persoonlijke drempel gaat —
                  of dat nu zware neerslag, harde wind, hitte of onweer is. Je stelt zelf in wanneer
                  je gewaarschuwd wilt worden. Geen ruis, alleen meldingen die voor jou relevant zijn.
                </p>
              </div>
            </div>
          }
          topContent={
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                    Mijn Weer · 48 uur
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                  {greetingName !== "jou" ? `Hoi ${greetingName}, dit is jouw weer` : "Dit is jouw weer"}
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Hyperlokale 48-uurs voorspelling voor <strong className="text-slate-900">{activeLoc.name}</strong>
                  {provinceSlug && PROVINCE_SLUG_TO_KNMI[provinceSlug] && ` · ${PROVINCE_SLUG_TO_KNMI[provinceSlug]}`}.
                  Per uur bijgewerkt, in gewone taal.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <LocateButton compact label="Gebruik mijn GPS" className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    Niet de juiste plaats? Klik hierboven.
                  </span>
                </div>
              </div>

              {pietBriefing && <PietDailyBriefing data={pietBriefing} />}

              {provinceWarnings.length > 0 && (
                <KnmiWarningBanner warnings={provinceWarnings} />
              )}

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
