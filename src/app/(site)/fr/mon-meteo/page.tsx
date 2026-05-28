import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import RainMap from "@/components/RainMap";
import PollenWidget from "@/components/PollenWidget";
import MarineWidget from "@/components/MarineWidget";
import DwdForecastCard from "@/components/DwdForecastCard";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { FRENCH_CITIES } from "@/lib/types";
import { fetchWeatherData, fetchAirQuality, fetchMarineData } from "@/lib/weather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "votre position";
  const title = loc?.name
    ? `Ma Météo pour ${place} — 48 heures à l'avance`
    : "Ma Météo — Prévisions météo hyperlocales";
  const description = loc?.name
    ? `Bulletin météo personnel pour ${place}. Découvrez ce que les prochaines 48 heures vous réservent en termes de pluie, vent et planification.`
    : "Bulletin météo personnel pour les 48 prochaines heures à votre emplacement. En langage clair, sans publicité et sans spéculations à deux semaines.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://weerzone.nl/fr/mon-meteo",
      languages: {
        "nl-NL": "https://weerzone.nl/piet",
        "de-DE": "https://weerzone.nl/de/mein-wetter",
        "fr-FR": "https://weerzone.nl/fr/mon-meteo",
        "x-default": "https://weerzone.nl/piet",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: "https://weerzone.nl/fr/mon-meteo",
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
  headline: "Bulletin météo hyperlocal à 48 heures",
  description:
    "Votre analyse météo quotidienne pour votre position GPS. Pas de spéculation à 14 jours, juste les prochaines 48 heures en texte clair.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/fr/mon-meteo",
  inLanguage: "fr-FR",
  about: {
    "@type": "Thing",
    name: "Prévisions météo hyperlocales pour les 48 prochaines heures",
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "Pourquoi Ma Météo s'arrête-t-elle à 48 heures ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parce que cette période est la plus utile pour prendre des décisions concrètes et planifier heure par heure.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je changer mon emplacement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Utilisez le bouton GPS pour charger directement votre emplacement actuel, ou choisissez une autre ville.",
      },
    },
  ],
};

function timeGreeting(): string {
  const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getHours();
  if (h >= 6 && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  if (h >= 18 && h < 23) return "Bonsoir";
  return "Salut";
}

const paris = FRENCH_CITIES.find((p) => p.name === "Paris") ?? FRENCH_CITIES[0];

export default async function MonMeteoPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || paris;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, airQuality, marineData] = await Promise.all([
    fetchWeatherData(lat, lon, false, false, undefined, "fr").catch(() => undefined),
    fetchAirQuality(lat, lon, "fr").catch(() => null),
    fetchMarineData(lat, lon, "fr").catch(() => null),
  ]);

  let greetingName = "à vous";
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
                  WEERZONE se concentre délibérément sur les prochaines 48 heures. C'est la période où
                  les prévisions météorologiques sont encore utiles pour prendre des décisions concrètes :
                  étendre le linge dehors, prendre la voiture, ou planifier un rendez-vous en plein air.
                  Au-delà, cela devient de la spéculation — et nous ne faisons pas de spéculation.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  WEERZONE rassemble les meilleures donnees disponibles et les traduit en une reponse simple:
                  heure par heure, pour votre emplacement, sans jargon inutile.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Emplacement</p>
                  <p className="font-black text-slate-900 mb-1">Pour votre quartier</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pas la météo de la région ou du département — mais celle de votre code postal précis.
                    Il peut pleuvoir à deux kilomètres de là alors qu'il fait sec chez vous.
                    WEERZONE rend cette différence visible.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Pas de bruit</p>
                  <p className="font-black text-slate-900 mb-1">Seulement ce qui compte aujourd'hui</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Fini les graphiques interminables ou les prévisions à 14 jours qui sont déjà fausses
                    demain. Ma Météo affiche la température, les précipitations, le vent et les UV — par heure,
                    en langage clair, sans publicité ni suivi.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Avertissements</p>
                  <p className="font-black text-slate-900 mb-1">Directement en haut en cas de danger</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    En cas de conditions extrêmes — tempête, orage, chaleur, verglas — vous le verrez
                    directement en haut de Ma Météo. Pas besoin d'application ou de site web séparé.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Précision</p>
                  <p className="font-black text-slate-900 mb-1">92–98% pour les prochaines 48 heures</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pour les prochaines 24 heures, nos prévisions sont précises à 95–98%. Pour 24–48 heures,
                    c'est 92–95%. Au-delà, la fiabilité diminue rapidement — d'où notre choix délibéré
                    de cet horizon temporel.
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
                  Avec Reed, vous recevez un message dès que la météo dépasse votre seuil personnel —
                  qu'il s'agisse de fortes précipitations, de vents violents, de chaleur ou d'orages.
                  Vous décidez vous-même quand vous souhaitez être averti. Pas de bruit, uniquement
                  des alertes pertinentes pour vous.
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
                  {greetingName !== "à vous" ? (
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

              {/* TODO: Add Meteo-France warnings here in the future */}

              <DwdForecastCard lat={lat} lon={lon} city={activeLoc.name} initialWeather={initialWeather} locale="fr" />

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
