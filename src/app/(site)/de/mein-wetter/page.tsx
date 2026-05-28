import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import RainMap from "@/components/RainMap";
import PollenWidget from "@/components/PollenWidget";
import MarineWidget from "@/components/MarineWidget";
import DwdForecastCard from "@/components/DwdForecastCard";
import DwdWarningBanner from "@/components/DwdWarningBanner";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData, fetchAirQuality, fetchMarineData } from "@/lib/weather";
import { fetchDWDWarnings, warningsForBundesland, nearestBundeslandSlug } from "@/lib/dwd-warnings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hreflangCluster } from "@/lib/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "deinem Standort";
  const title = loc?.name
    ? `Mein Wetter für ${place} — 48 Stunden voraus`
    : "Mein Wetter — Hyperlokale Wettervorhersage";
  const description = loc?.name
    ? `Persönlicher Wetterbericht für ${place}. Du siehst, was die nächsten 48 Stunden für Regen, Wind und Planung bedeuten.`
    : "Persönlicher Wetterbericht für die nächsten 48 Stunden an deinem Standort. In Klartext, ohne Werbung und ohne Spekulation über zwei Wochen voraus.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://weerzone.nl/de/mein-wetter",
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
      locale: "de_DE",
      url: "https://weerzone.nl/de/mein-wetter",
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
  name: "Mein Wetter",
  headline: "Karl — Hyperlokaler 48-Stunden-Wetterbericht",
  description:
    "Die tägliche Wetteranalyse von Karl für deinen GPS-Standort. Keine 14-Tage-Spekulation, nur die nächsten 48 Stunden in Klartext.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/de/mein-wetter",
  inLanguage: "de-DE",
  about: {
    "@type": "Thing",
    name: "Hyperlokaler Wetterbericht für die nächsten 48 Stunden",
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "Warum stoppt Mein Wetter bei 48 Stunden?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Weil dieser Zeitraum für konkrete Entscheidungen und stündliche Planung am nützlichsten ist.",
      },
    },
    {
      "@type": "Question",
      name: "Kann ich meinen Standort ändern?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Nutze die GPS-Taste, um direkt deinen aktuellen Standort zu laden, oder wähle einen anderen Ort.",
      },
    },
  ],
};

function timeGreeting(): string {
  const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })).getHours();
  if (h >= 6 && h < 12) return "Guten Morgen";
  if (h >= 12 && h < 18) return "Guten Tag";
  if (h >= 18 && h < 23) return "Guten Abend";
  return "Hallo";
}

const berlin = ALL_PLACES.find((p) => p.name === "Berlin") ?? ALL_PLACES[0];

export default async function MeinWetterPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || berlin;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, airQuality, marineData, allWarnings, bundeslandSlug] = await Promise.all([
    fetchWeatherData(lat, lon, false, false, undefined, "de").catch(() => undefined),
    fetchAirQuality(lat, lon, "de").catch(() => null),
    fetchMarineData(lat, lon, "de").catch(() => null),
    fetchDWDWarnings().catch(() => []),
    nearestBundeslandSlug(lat, lon).catch(() => null),
  ]);
  const bundeslandWarnings = bundeslandSlug ? warningsForBundesland(allWarnings, bundeslandSlug) : [];

  let greetingName = "dich";
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
          locale="de"
          beforeFooter={
            <div className="space-y-4 mt-8">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  So funktioniert Mein Wetter
                </p>
                <h2 className="text-xl font-black text-slate-900 mb-3">
                  48 Stunden voraus — nicht mehr, nicht weniger
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  WEERZONE konzentriert sich bewusst auf die nächsten 48 Stunden. Das ist der Zeitraum,
                  in dem eine Wettervorhersage für konkrete Entscheidungen noch brauchbar ist: ob du
                  die Wäsche draußen aufhängst, das Auto nimmst oder einen Termin draußen planst.
                  Weiter voraus wird es Spekulation — und Spekulation machen wir nicht.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Wir nutzen aktuelle Daten und machen daraus eine ehrliche Ansage: pro Stunde, an deinem
                  Standort, ohne Fachsprache nur für den Eindruck.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Standort</p>
                  <p className="font-black text-slate-900 mb-1">Für deine Umgebung</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Nicht das Wetter für die Region oder das Bundesland — sondern für deine genaue Postleitzahl.
                    Regen kann zwei Kilometer entfernt fallen, während es bei dir trocken bleibt.
                    WEERZONE macht diesen Unterschied sichtbar.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Kein Rauschen</p>
                  <p className="font-black text-slate-900 mb-1">Nur was heute zählt</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Keine endlosen Grafiken oder 14-Tage-Vorhersagen, die morgen schon nicht mehr
                    stimmen. Mein Wetter zeigt Temperatur, Niederschlag, Wind und UV — pro Stunde,
                    in Klartext, ohne Werbung oder Tracking.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">DWD-Warnungen</p>
                  <p className="font-black text-slate-900 mb-1">Direkt oben bei Gefahr</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Wenn der Deutsche Wetterdienst eine Warnung für dein Bundesland ausgibt — Sturm,
                    Gewitter, Hitze, Glätte — siehst du das direkt oben in Mein Wetter. Keine separate
                    App oder Website nötig.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Genauigkeit</p>
                  <p className="font-black text-slate-900 mb-1">92–98% für die nächsten 48 Stunden</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Für die nächsten 24 Stunden sind unsere Vorhersagen 95–98% genau. Für 24–48 Stunden
                    sind es 92–95%. Danach nimmt die Verlässlichkeit schnell ab — daher unsere bewusste
                    Wahl dieses Zeithorizonts.
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Mehr aus Weerzone herausholen
                </p>
                <p className="text-slate-900 font-black text-lg mb-2">
                  Warnungen, die wirklich zählen
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mit Reed bekommst du eine Nachricht, sobald das Wetter über deine persönliche Schwelle
                  geht — egal ob schwerer Niederschlag, starker Wind, Hitze oder Gewitter. Du legst selbst
                  fest, wann du gewarnt werden willst. Kein Rauschen, nur Meldungen, die für dich
                  relevant sind.
                </p>
              </div>
            </div>
          }
          topContent={
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">
                  Mein Wetter
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] mb-4">
                  {greetingName !== "dich" ? (
                    <>{timeGreeting()}, {greetingName}.<br /><span className="text-[#3b7ff0]">Das ist dein Tag.</span></>
                  ) : (
                    <>{timeGreeting()}.<br /><span className="text-[#3b7ff0]">Das ist dein Tag.</span></>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700">{activeLoc.name}</span>
                </div>
              </div>

              {bundeslandWarnings.length > 0 && (
                <DwdWarningBanner warnings={bundeslandWarnings} />
              )}

              <DwdForecastCard lat={lat} lon={lon} city={activeLoc.name} initialWeather={initialWeather} />

              <RainMap lat={lat} lon={lon} locale="de" />

              {airQuality && <PollenWidget data={airQuality} locale="de" />}
              {marineData && <MarineWidget data={marineData} locale="de" />}
            </div>
          }
        />
      </main>
    </>
  );
}
