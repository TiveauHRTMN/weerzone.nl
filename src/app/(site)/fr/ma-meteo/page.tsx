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

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "votre position";
  const title = loc?.name
    ? `Ma Météo pour ${place} — 48 heures à l'avance`
    : "Ma Météo — Prévisions hyperlocales";
  const description = loc?.name
    ? `Bulletin météo personnel pour ${place}. Découvrez l'impact des prochaines 48 heures sur la pluie, le vent et vos plans.`
    : "Bulletin météo personnel pour les prochaines 48 heures à votre position. En texte clair, sans publicité et sans spéculation à deux semaines.";

  return {
    title,
    description,
    keywords: [
      "ma meteo",
      "bulletin meteo personnel",
      "meteo 48 heures",
      "meteo position",
      "prevision pluie",
      "prevision vent",
      "meteo aujourd'hui",
    ],
    alternates: {
      canonical: "https://weerzone.nl/fr/ma-meteo",
      languages: {
        "nl-NL": "https://weerzone.nl/piet",
        "de-DE": "https://weerzone.nl/de/mein-wetter",
        "fr-FR": "https://weerzone.nl/fr/ma-meteo",
        "x-default": "https://weerzone.nl/piet",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: "https://weerzone.nl/fr/ma-meteo",
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
  name: "Ma Météo",
  headline: "Piet — Bulletin météo hyperlocal à 48 heures",
  description:
    "L'analyse météo quotidienne de Piet pour votre position GPS. Pas de spéculation à 14 jours, juste les prochaines 48 heures en texte clair.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/fr/ma-meteo",
  inLanguage: "fr-FR",
  about: {
    "@type": "Thing",
    name: "Bulletin météo hyperlocal pour les prochaines 48 heures",
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "Pourquoi Ma Météo s'arrête-t-elle à 48 heures ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parce que cette période est la plus utile pour prendre des décisions concrètes et planifier d'heure en heure.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je changer ma position ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Utilisez le bouton GPS pour charger directement votre position actuelle, ou choisissez un autre lieu.",
      },
    },
  ],
};

function timeGreeting(): string {
  const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getHours();
  if (h >= 6 && h < 18) return "Bonjour";
  if (h >= 18 && h < 23) return "Bonsoir";
  return "Bonjour";
}

const paris = ALL_PLACES.find((p) => p.name === "Paris") ?? ALL_PLACES.find((p) => p.name === "Amsterdam") ?? ALL_PLACES[0];

export default async function MeinWetterPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || paris;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, airQuality, marineData, allWarnings, bundeslandSlug] = await Promise.all([
    fetchWeatherData(lat, lon, false, false, undefined, "fr").catch(() => undefined),
    fetchAirQuality(lat, lon, "fr").catch(() => null),
    fetchMarineData(lat, lon, "fr").catch(() => null),
    fetchDWDWarnings().catch(() => []),
    nearestBundeslandSlug(lat, lon).catch(() => null),
  ]);
  const bundeslandWarnings = bundeslandSlug ? warningsForBundesland(allWarnings, bundeslandSlug) : [];

  let greetingName = "vous";
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
          locale="fr"
          beforeFooter={
            <div className="space-y-4 mt-8">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Comment fonctionne Ma Météo
                </p>
                <h2 className="text-xl font-black text-slate-900 mb-3">
                  48 heures à l'avance — ni plus, ni moins
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  WEERZONE se concentre délibérément sur les 48 prochaines heures. C'est la période pendant laquelle les prévisions météo restent exploitables pour des décisions concrètes : étendre le linge, prendre la voiture ou planifier un rendez-vous en extérieur. Au-delà, c'est de la spéculation — et nous ne faisons pas de spéculation.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nos données proviennent directement des sources les plus fiables : le modèle AROME comme base principale, complété par des modèles européens. Nous comparons les meilleurs modèles météo et vous présentons un résultat honnête — heure par heure, pour votre position.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Position</p>
                  <p className="font-black text-slate-900 mb-1">Hyperlocal sur 1×1 km</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Ce n'est pas la météo de la région ou du département — mais celle de votre code postal précis. Il peut pleuvoir à deux kilomètres alors que vous restez au sec. WEERZONE met cette différence en évidence.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Pas de bruit</p>
                  <p className="font-black text-slate-900 mb-1">Seulement ce qui compte aujourd'hui</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pas de graphiques infinis ou de prévisions à 14 jours qui seront déjà fausses demain. Ma Météo affiche la température, les précipitations, le vent et les UV — par heure, en texte clair, sans publicité ni traçage.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Alertes météo</p>
                  <p className="font-black text-slate-900 mb-1">En haut en cas de danger</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Lorsqu'une alerte est émise pour votre région — tempête, orages, chaleur, verglas — vous la verrez directement en haut de Ma Météo. Pas besoin d'application ou de site web séparé.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Précision</p>
                  <p className="font-black text-slate-900 mb-1">92–98 % pour les 48 prochaines heures</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pour les 24 prochaines heures, nos prévisions sont exactes à 95-98 %. Pour les 24-48 heures, elles sont de 92-95 %. Ensuite, la fiabilité diminue rapidement — d'où notre choix délibéré de cet horizon temporel.
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Tirer le meilleur parti de Weerzone
                </p>
                <p className="text-slate-900 font-black text-lg mb-2">
                  Des alertes qui comptent vraiment
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Avec Reed, vous recevez un message dès que la météo franchit votre seuil personnel — qu'il s'agisse de fortes précipitations, de vents violents, de canicule ou d'orages. Vous définissez vous-même quand vous souhaitez être averti. Pas de bruit, seulement les messages qui vous concernent.
                </p>
              </div>
            </div>
          }
          topContent={
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">
                  Ma Météo
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] mb-4">
                  {greetingName !== "vous" ? (
                    <>{timeGreeting()}, {greetingName}.<br /><span className="text-[#3b7ff0]">Voici votre journée.</span></>
                  ) : (
                    <>{timeGreeting()}.<br /><span className="text-[#3b7ff0]">Voici votre journée.</span></>
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

              <RainMap lat={lat} lon={lon} locale="fr" />

              {airQuality && <PollenWidget data={airQuality} locale="fr" />}
              {marineData && <MarineWidget data={marineData} locale="fr" />}
            </div>
          }
        />
      </main>
    </>
  );
}
