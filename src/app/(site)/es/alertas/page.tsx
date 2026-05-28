import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
import LocateButton from "@/components/LocateButton";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Alertas — Avisos de tiempo extremo en España",
  description:
    "Weerzone avisa de tormentas, calor extremo, lluvia torrencial, viento fuerte y frio en España. Solo cuando algo se acerca de verdad — sin spam, sin ruido.",
  alternates: {
    canonical: "https://weerzone.nl/es/alertas",
    languages: {
      "nl-NL": "https://weerzone.nl/reed",
      "de-DE": "https://weerzone.nl/de/warnungen",
      "fr-FR": "https://weerzone.nl/fr/alertes",
      "es-ES": "https://weerzone.nl/es/alertas",
      "x-default": "https://weerzone.nl/reed",
    },
  },
  openGraph: {
    title: "Alertas de tiempo extremo | WEERZONE Espana",
    description:
      "Avisos para DANA, tormentas, calor extremo, viento fuerte y frio en tu zona. Solo cuando hace falta.",
    type: "website",
    locale: "es_ES",
    url: "https://weerzone.nl/es/alertas",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alertas de tiempo extremo",
    description: "Avisos para tu zona, sin ruido innecesario.",
  },
};

const madrid =
  ALL_PLACES.find((place) => place.province === "spanje" && place.name === "Madrid") ??
  ALL_PLACES.find((place) => place.province === "spanje") ??
  ALL_PLACES[0];

const RISKS = [
  {
    label: "DANA y lluvia torrencial",
    text: "Episodios de gota fria en el Mediterraneo y el Levante. Avisamos cuando se prevee acumulado fuerte en pocas horas en tu codigo postal.",
  },
  {
    label: "Calor extremo",
    text: "Olas de calor en la meseta y el sur. Reed te avisa cuando la maxima de tu zona pasa tu umbral personal, sin contar cada dia de verano.",
  },
  {
    label: "Viento (cierzo, levante, terral)",
    text: "Vientos regionales que cambian el plan: cierzo en el valle del Ebro, levante en el Estrecho, terral en la costa malaguena. Aviso solo si afecta a tu zona.",
  },
  {
    label: "Tormentas de verano en la sierra",
    text: "Pirineos, Sistema Central, Picos de Europa. Si subes a la sierra y se forma tormenta tarde, Reed te toca antes de que salgas.",
  },
];

export default async function AlertasPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || madrid;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const initialWeather = await fetchWeatherData(lat, lon, false, true, undefined, "es").catch(() => undefined);

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather}
        initialWeatherCode={initialWeather?.current.weatherCode}
        initialIsDay={initialWeather?.current.isDay}
        hideWeatherInfo={true}
        locale="es"
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 px-2 py-0.5 rounded bg-emerald-50">
                  Codigo verde
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Alertas para tu zona
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                De momento todo tranquilo, sin avisos activos.{" "}
                <span className="text-slate-400">
                  Solo te avisamos de DANA, tormentas, calor extremo, viento fuerte o lluvia torrencial — sin ruido.
                </span>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <LocateButton
                  compact
                  label="Otra zona? Usa el GPS"
                  className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200"
                />
                <span className="text-[11px] text-slate-400 font-medium">
                  Ubicacion: <strong className="text-slate-700">{activeLoc.name}</strong>
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-400/30 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-none">
                <Check className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-emerald-100 mb-1">Sin alertas activas</p>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Ahora mismo no hay avisos para tu zona. En cuanto algo cambie, te llega un mensaje
                  directo (si tienes las notificaciones activas).
                </p>
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                Que vigilamos en Espana
              </p>
              <h2 className="text-xl font-black text-slate-900 mb-4">
                Solo lo que cambia tu plan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RISKS.map((risk) => (
                  <div key={risk.label} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {risk.label}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{risk.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-5 leading-relaxed">
                AEMET sigue siendo la referencia oficial para avisos en Espana. Weerzone no la sustituye:
                te lo contamos en lenguaje normal cuando algo afecta concretamente a tu codigo postal.
              </p>
            </div>

            <PremiumGate tierRequired="reed">
              <ReedExtended initialCity={loc || undefined} locale="es" />
            </PremiumGate>
          </div>
        }
      />
    </main>
  );
}
