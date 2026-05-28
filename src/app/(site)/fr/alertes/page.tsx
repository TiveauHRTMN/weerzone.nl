import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
// Météo-France warnings could be added in the future, for now we keep the layout simple
import { getSavedLocationServer } from "@/lib/location-cookies";
import { FRENCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { fetchEstofexBeneluxSummary, summarizeEstofexFR } from "@/lib/estofex";
import LocateButton from "@/components/LocateButton";
import { Check, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Alertes — Avertissements de conditions extrêmes",
  description:
    "Weerzone avertit des tempêtes, orages, vagues de chaleur, gel et fortes précipitations. Seulement quand quelque chose approche vraiment — pas de bruit.",
  alternates: {
    canonical: "https://weerzone.nl/fr/alertes",
    languages: {
      "nl-NL": "https://weerzone.nl/reed",
      "de-DE": "https://weerzone.nl/de/warnungen",
      "fr-FR": "https://weerzone.nl/fr/alertes",
      "x-default": "https://weerzone.nl/reed",
    },
  },
  openGraph: {
    title: "Alertes conditions extrêmes | WEERZONE",
    description:
      "Alertes actuelles pour les tempêtes, orages, chaleur, gel et fortes pluies. Uniquement les messages qui comptent vraiment.",
    type: "website",
    locale: "fr_FR",
    url: "https://weerzone.nl/fr/alertes",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alertes conditions extrêmes",
    description: "Alertes actuelles pour votre région, sans bruit inutile.",
  },
};

const paris = FRENCH_CITIES.find((p) => p.name === "Paris") ?? FRENCH_CITIES[0];

export default async function AlertesPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || paris;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, estofex] = await Promise.all([
    fetchWeatherData(lat, lon, false, true, undefined, "fr").catch(() => undefined),
    fetchEstofexBeneluxSummary(2).catch(() => null),
  ]);

  const estofexSummary = estofex ? summarizeEstofexFR(estofex) : null;

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather}
        initialWeatherCode={initialWeather?.current.weatherCode}
        initialIsDay={initialWeather?.current.isDay}
        hideWeatherInfo={true}
        locale="fr"
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full bg-emerald-500`} />
                <span className={`text-xs font-black uppercase tracking-widest text-emerald-700 px-2 py-0.5 rounded bg-emerald-50`}>
                  Code Vert
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Alertes pour votre région
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Actuellement calme — pas d'alertes actives.{" "}
                <span className="text-slate-400">
                  Nous signalons uniquement les tempêtes, orages, chaleur, gel ou fortes précipitations — pas de bruit.
                </span>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <LocateButton
                  compact
                  label="Autre région ? Utilisez le GPS"
                  className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200"
                />
                <span className="text-[11px] text-slate-400 font-medium">
                  Emplacement: <strong className="text-slate-700">{activeLoc.name}</strong>
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-400/30 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-none">
                <Check className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-emerald-100 mb-1">Pas d'alertes actives</p>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Actuellement, il n'y a aucune alerte en cours pour votre région. Dès que cela changera,
                  vous recevrez directement une notification (si activée).
                </p>
              </div>
            </div>

            {estofex && estofexSummary && (
              <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    Perspectives Européennes
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      estofex.maxLevel >= 3
                        ? "bg-rose-500/30 text-rose-100"
                        : estofex.maxLevel >= 2
                        ? "bg-orange-500/30 text-orange-100"
                        : "bg-yellow-500/30 text-yellow-100"
                    }`}
                  >
                    Niveau {estofex.maxLevel}
                  </span>
                </div>
                <p className="text-sm text-white/85 leading-relaxed">{estofexSummary}</p>
                <p className="text-[10px] text-white/40 mt-3">
                  Source: ESTOFEX (European Storm Forecast Experiment) · mis à jour 1–2× par jour
                </p>
              </div>
            )}

            <PremiumGate tierRequired="reed">
              <ReedExtended initialCity={loc || undefined} locale="fr" />
            </PremiumGate>
          </div>
        }
      />
    </main>
  );
}
