"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MapPin, Thermometer, Wind, CloudRain, Zap, ShieldAlert, Layers } from "lucide-react";
import { loadWeather, loadWWS } from "@/lib/weatherCache";
import {
  DUTCH_CITIES,
  FRENCH_CITIES,
  GERMAN_CITIES,
  reverseGeocode,
  type City,
  type WeatherData,
  type WWSPayload,
} from "@/lib/types";
import type { KNMIWarningEnriched } from "@/lib/knmi-warnings";
import { persistCity } from "@/lib/persist-city";
import ReflectivityMap from "@/components/ReflectivityMap";
import LightningMap from "@/components/LightningMap";
import ReedExtremeCharts from "@/components/ReedExtremeCharts";
import { groupRiskPeriods, type RiskPeriod } from "@/lib/risk-analysis";

type Locale = "nl" | "de" | "fr" | "es";

const MADRID: City = { name: "Madrid", lat: 40.4168, lon: -3.7038 };

const COPY = {
  nl: {
    currentLocation: "Jouw locatie",
    locating: "Locatie bepalen...",
    loading: "We kijken wat er op je afkomt...",
    warnings: "Officiele Waarschuwingen",
    red: "Code Rood",
    orange: "Code Oranje",
    yellow: "Code Geel",
    expectedRain: "Verwachte regen",
    peakShower: "Hardste bui",
    around: "Rond",
    gusts: "Windstoten",
    rainIntensity: "Buien-intensiteit",
    next48: "Komende 48 uur",
    lightning: "Live Bliksem",
    rainWind: "Regen en windstoten",
    important: "BELANGRIJK BERICHT",
    mustKnow: "Wat je moet weten",
    current: "Actuele situatie",
    wind: "Windvlagen",
    feelsLike: "Gevoelstemperatuur",
    dashboard: "Dashboard",
    dateLocale: "nl-NL",
    expertHubTitle: "Expert Weerhub (Atmosferische Analyses)",
    expertHubSubtitle: "Gedetailleerde meteorologische parameters voor stormjagers en weeramateurs.",
  },
  de: {
    currentLocation: "Dein Standort",
    locating: "Standort wird ermittelt...",
    loading: "Wir prufen, was auf dich zukommt...",
    warnings: "Offizielle Wetterwarnungen (DWD/KNMI)",
    red: "Warnstufe Rot",
    orange: "Warnstufe Orange",
    yellow: "Warnstufe Gelb",
    expectedRain: "Erwarteter Regen",
    peakShower: "Starkster Schauer",
    around: "Gegen",
    gusts: "Windboen",
    rainIntensity: "Niederschlags-Intensitat",
    next48: "Kommende 48 Stunden",
    lightning: "Live Blitze",
    rainWind: "Regen und Windboen",
    important: "WICHTIGE MELDUNG",
    mustKnow: "Was du wissen musst",
    current: "Aktuelle Situation",
    wind: "Windboen",
    feelsLike: "Gefuhlte Temperatur",
    dashboard: "Dashboard",
    dateLocale: "de-DE",
    expertHubTitle: "Experten-Wetterhub (Atmosphärische Analysen)",
    expertHubSubtitle: "Detaillierte meteorologische Parameter für Sturmjäger und Wetteramateure.",
  },
  fr: {
    currentLocation: "Votre position",
    locating: "Localisation en cours...",
    loading: "Nous verifions ce qui vous attend...",
    warnings: "Avertissements officiels",
    red: "Alerte Rouge",
    orange: "Alerte Orange",
    yellow: "Alerte Jaune",
    expectedRain: "Pluie attendue",
    peakShower: "Averse la plus forte",
    around: "Vers",
    gusts: "Rafales",
    rainIntensity: "Intensite des precipitations",
    next48: "Prochaines 48 heures",
    lightning: "Foudre en direct",
    rainWind: "Pluie et rafales de vent",
    important: "MESSAGE IMPORTANT",
    mustKnow: "Ce qu'il faut savoir",
    current: "Situation actuelle",
    wind: "Rafales",
    feelsLike: "Temperature ressentie",
    dashboard: "Tableau de bord",
    dateLocale: "fr-FR",
    expertHubTitle: "Hub Météo Expert (Analyses Atmosphériques)",
    expertHubSubtitle: "Paramètres météorologiques détaillés pour les chasseurs de tempêtes et amateurs.",
  },
  es: {
    currentLocation: "Tu ubicacion",
    locating: "Buscando ubicacion...",
    loading: "Comprobamos lo que se acerca...",
    warnings: "Avisos oficiales (AEMET)",
    red: "Alerta Roja",
    orange: "Alerta Naranja",
    yellow: "Alerta Amarilla",
    expectedRain: "Lluvia prevista",
    peakShower: "Chubasco mas fuerte",
    around: "Hacia",
    gusts: "Rachas",
    rainIntensity: "Intensidad de lluvia",
    next48: "Proximas 48 horas",
    lightning: "Rayos en vivo",
    rainWind: "Lluvia y rachas de viento",
    important: "AVISO IMPORTANTE",
    mustKnow: "Lo que debes saber",
    current: "Situacion actual",
    wind: "Rachas",
    feelsLike: "Sensacion termica",
    dashboard: "Panel",
    dateLocale: "es-ES",
    expertHubTitle: "Centro Meteorológico Experto (Análisis Atmosféricos)",
    expertHubSubtitle: "Parámetros meteorológicos detallados para cazadores de tormentas y aficionados.",
  },
} as const;

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
      }
    }
  } catch {}
  return null;
}

function getDefaultCity(locale: Locale): City {
  if (locale === "es") return MADRID;
  if (locale === "fr") return FRENCH_CITIES[0];
  if (locale === "de") return GERMAN_CITIES[0];
  return DUTCH_CITIES.find((city) => city.name === "De Bilt") || DUTCH_CITIES[0];
}

function formatPeriodRange(start: string, end: string, dateLocale: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startDay = startDate.toLocaleDateString(dateLocale, { weekday: "long" });
  const endDay = endDate.toLocaleDateString(dateLocale, { weekday: "long" });
  
  const startHM = startDate.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const endHM = endDate.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  
  if (startDay === endDay) {
    const capitalizedDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
    return `${capitalizedDay} van ${startHM} tot ${endHM}`;
  } else {
    const capitalizedStartDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
    const capitalizedEndDay = endDay.charAt(0).toUpperCase() + endDay.slice(1);
    return `${capitalizedStartDay} ${startHM} tot ${capitalizedEndDay} ${endHM}`;
  }
}

interface ReedProps {
  initialWeather?: WeatherData | null;
  initialCity?: City;
  locale?: Locale;
  includeExternalAiWeather?: boolean;
}

export default function ReedExtended({ initialWeather, initialCity, locale = "nl", includeExternalAiWeather = false }: ReedProps) {
  const copy = COPY[locale];
  const [city, setCity] = useState<City>(() => initialCity || getSavedCity() || getDefaultCity(locale));
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [knmiWarnings, setKnmiWarnings] = useState<KNMIWarningEnriched[]>([]);
  const [loading, setLoading] = useState(!initialWeather);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!weather) setLoading(true);

    fetch(`/api/knmi-warnings?lat=${city.lat}&lon=${city.lon}&enrich=1`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setKnmiWarnings(data.warnings ?? []);
      })
      .catch(() => {});

    loadWeather(city.lat, city.lon, () => {}, (fresh) => {
      if (!cancelled) {
        setWeather(fresh);
        setLoading(false);
      }
    }, undefined, true, locale, includeExternalAiWeather)
      .then((nextWeather) => {
        if (cancelled) return;
        setWeather(nextWeather);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    loadWWS(city.lat, city.lon)
      .then((wwsPayload) => {
        if (!cancelled) setWWS(wwsPayload);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [city, includeExternalAiWeather, locale]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisionalCity: City = { name: copy.currentLocation, lat, lon };
        setCity(provisionalCity);
        persistCity(provisionalCity);
        setLocating(false);
        reverseGeocode(lat, lon, locale)
          .then((resolvedCity) => {
            setCity(resolvedCity);
            persistCity(resolvedCity);
            window.location.reload();
          })
          .catch(() => {
            window.location.reload();
          });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60 * 1000 },
    );
  };

  const hasExtreme = wws?.reed_alert?.active || false;
  const alert = wws?.reed_alert;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white text-sm font-bold hover:bg-white/20 transition-all disabled:opacity-60"
        >
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? copy.locating : city.name}
        </button>
      </div>

      {loading && !weather && (
        <div className="card !p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-text-secondary" />
          <p className="text-sm font-bold text-text-secondary">{copy.loading}</p>
        </div>
      )}

      {knmiWarnings.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted">{copy.warnings}</p>
          {knmiWarnings.map((warning) => {
            const accent =
              warning.severity === "RED"
                ? { line: "border-l-rose-500", bg: "bg-rose-500/5", text: "text-rose-500", chip: copy.red }
                : warning.severity === "ORANGE"
                  ? { line: "border-l-orange-500", bg: "bg-orange-500/5", text: "text-orange-500", chip: copy.orange }
                  : { line: "border-l-amber-400", bg: "bg-amber-400/5", text: "text-amber-400", chip: copy.yellow };
            const fmtTime = (iso: string | null) => {
              if (!iso) return "-";
              const date = new Date(iso);
              return date.toLocaleString(copy.dateLocale, { weekday: "short", hour: "2-digit", minute: "2-digit" });
            };

            return (
              <div key={warning.key} className={`card !p-5 border-l-4 ${accent.line} ${accent.bg}`}>
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${accent.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>
                        {accent.chip} - {warning.type}
                      </span>
                      <span className="text-[10px] text-text-muted">- {warning.province}</span>
                      {warning.validFrom && warning.validUntil && (
                        <span className="text-[10px] font-bold text-text-secondary">
                          - {fmtTime(warning.validFrom)} to {fmtTime(warning.validUntil)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-snug whitespace-pre-line">{warning.description}</p>
                    {warning.enriched && (() => {
                      const warningTypeLower = warning.type.toLowerCase();
                      const isThunderWarning = warningTypeLower.includes("onweer");
                      const isRainWarning = warningTypeLower.includes("regen") || warningTypeLower.includes("water") || warningTypeLower.includes("neerslag") || warningTypeLower.includes("sneeuw") || warningTypeLower.includes("hagel");
                      const isWindWarning = warningTypeLower.includes("wind") || warningTypeLower.includes("storm") || warningTypeLower.includes("orkaan");

                      const showDirectWeatherImpact =
                        isRainWarning ||
                        isWindWarning ||
                        isThunderWarning ||
                        warning.enriched.precipitationTotalMm > 0 ||
                        warning.enriched.windPeakKmh > 30;

                      const showThunderDynamics =
                        warning.enriched.capeMaxJkg !== undefined;

                      if (!showDirectWeatherImpact && !showThunderDynamics) return null;

                      const gridClass = showDirectWeatherImpact && showThunderDynamics
                        ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                        : "grid grid-cols-1 gap-4";

                      return (
                        <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">
                              Weerzone Detail-Analyse
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Modelanalyse op locatie
                            </span>
                          </div>

                          <div className={gridClass}>
                            {/* Column 1: Direct Weather Impact (Rain & Wind) */}
                            {showDirectWeatherImpact && (
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-text-muted/80 tracking-wider">
                                  Directe Weerimpact
                                </h4>
                                <div className="space-y-2.5">
                                  {/* Expected Rain */}
                                  {(isRainWarning || isThunderWarning || warning.enriched.precipitationTotalMm > 0) && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                        <CloudRain className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-text-muted/80">{copy.expectedRain}</p>
                                        <p className="text-sm font-black text-text-primary mt-0.5">
                                          {warning.enriched.precipitationTotalMm} mm totaal
                                        </p>
                                        {warning.enriched.precipitationPeakMm > 0 && (
                                          <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                                            Piek: <span className="font-bold text-text-primary">{warning.enriched.precipitationPeakMm} mm</span> {copy.around} {fmtTime(warning.enriched.precipitationPeakHour)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Wind Gusts */}
                                  {(isWindWarning || isThunderWarning || warning.enriched.windPeakKmh > 30) && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                                        <Wind className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-text-muted/80">{copy.gusts}</p>
                                        <p className="text-sm font-black text-text-primary mt-0.5">
                                          {warning.enriched.windPeakKmh} km/h
                                        </p>
                                        <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                                          {warning.enriched.windPeakKmh >= 75 ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-medium">Gevaar voor omwaaiende takken/voorwerpen</span>
                                          ) : (
                                            <span>Geen extreem windrisico verwacht</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Column 2: Atmospheric Dynamics (Storm ingredients) */}
                            {showThunderDynamics && (
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-text-muted/80 tracking-wider">
                                  Onweerspotentie & Dynamiek
                                </h4>

                                <div className="p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/15 space-y-3.5">
                                  {/* 1. Fuel / Energy */}
                                  <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                                      <Zap className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex justify-between items-baseline gap-2">
                                        <h5 className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-300">1. Brandstof (Energie)</h5>
                                        <span className="text-[10px] font-mono font-bold text-text-muted shrink-0">
                                          {warning.enriched.capeMaxJkg} J/kg
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                                        {warning.enriched.capeMaxJkg === 0 ? (
                                          <span>
                                            <strong className="text-text-muted">Stabiel:</strong> Geen directe energie (CAPE: 0) berekend op deze locatie. Onweersbuien kunnen echter van elders binnentrekken.
                                          </span>
                                        ) : warning.enriched.capeMaxJkg > 1000 ? (
                                          <span>
                                            <strong className="text-orange-600 dark:text-orange-400">Zeer onstabiel:</strong> Broeierige lucht (dauwpunt {warning.enriched.dewPointMaxC !== undefined ? `${warning.enriched.dewPointMaxC}°C` : 'hoog'}). Veel energie voor zwaar onweer.
                                          </span>
                                        ) : warning.enriched.capeMaxJkg > 500 ? (
                                          <span>
                                            <strong className="text-amber-600 dark:text-amber-400">Matig onstabiel:</strong> Voldoende energie voor actieve buien met kans op ontladingen.
                                          </span>
                                        ) : (
                                          <span>
                                            <strong className="text-text-muted">Lichte onstabiliteit:</strong> Beperkte energie; ontladingen zijn mogelijk maar waarschijnlijk zwak.
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* 2. Lid / Cap */}
                                  {warning.enriched.cinMaxJkg !== undefined && (
                                    <div className="flex items-start gap-3 border-t border-black/5 dark:border-white/5 pt-3">
                                      <div className="p-1.5 bg-red-500/10 rounded-lg text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-baseline gap-2">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-300">2. De Deksel (CIN-Rem)</h5>
                                          <span className="text-[10px] font-mono font-bold text-text-muted shrink-0">
                                            {warning.enriched.cinMaxJkg} J/kg
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                                          {warning.enriched.cinMaxJkg > 100 ? (
                                            <span>
                                              <strong className="text-rose-600 dark:text-rose-400">Sterke rem:</strong> Hoge deksel onderdrukt buienvorming. Grote kans dat het droog blijft, tenzij er een sterke trigger komt.
                                            </span>
                                          ) : warning.enriched.cinMaxJkg > 30 ? (
                                            <span>
                                              <strong className="text-amber-600 dark:text-amber-400">Matige deksel:</strong> Buien hebben een duidelijke trigger nodig (zoals windvlagen of een koufront) om door te breken.
                                            </span>
                                          ) : (
                                            <span>
                                              <strong className="text-emerald-600 dark:text-emerald-400">Geen deksel:</strong> Buien kunnen ongehinderd en snel ontstaan zodra de zon de grond opwarmt.
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 3. Storm Organization */}
                                  {warning.enriched.windShearMaxKmh !== undefined && (
                                    <div className="flex items-start gap-3 border-t border-black/5 dark:border-white/5 pt-3">
                                      <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                                        <Layers className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-baseline gap-2">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">3. Stormstructuur (Windschering)</h5>
                                          <span className="text-[10px] font-mono font-bold text-text-muted shrink-0">
                                            {warning.enriched.windShearMaxKmh} km/h
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                                          {warning.enriched.windShearMaxKmh >= 35 ? (
                                            <span>
                                              <strong className="text-purple-600 dark:text-purple-400">Georganiseerde stormen:</strong> Sterke windschering. Kans op grotere hagel en zware windstoten door georganiseerde buienlijnen.
                                            </span>
                                          ) : (
                                            <span>
                                              <strong className="text-text-muted">Losstaande buien:</strong> Zwakke windschering. Buien zijn kortstondig en storten snel in op hun eigen regenval.
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 4. Stability (Lifted Index) */}
                                  {warning.enriched.liftedIndexMinC !== undefined && (
                                    <div className="flex items-start gap-3 border-t border-black/5 dark:border-white/5 pt-3">
                                      <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                        <Thermometer className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-baseline gap-2">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">4. Stabiliteit (Lifted Index)</h5>
                                          <span className="text-[10px] font-mono font-bold text-text-muted shrink-0">
                                            {warning.enriched.liftedIndexMinC} °C
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                                          {warning.enriched.liftedIndexMinC <= -6 ? (
                                            <span>
                                              <strong className="text-rose-600 dark:text-rose-400">Extreem onstabiel:</strong> Zeer sterke stijgstromen mogelijk. Kans op zware onweersbuien met hagel en windstoten.
                                            </span>
                                          ) : warning.enriched.liftedIndexMinC < 0 ? (
                                            <span>
                                              <strong className="text-amber-600 dark:text-amber-400">Onstabiel:</strong> Atmosfeer is gevoelig voor buienvorming en onweer.
                                            </span>
                                          ) : (
                                            <span>
                                              <strong className="text-emerald-600 dark:text-emerald-400">Stabiel:</strong> Warme lucht stijgt niet makkelijk op. De kans op actieve onweersbuien is klein.
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && weather && (
        <div className="space-y-6 animate-fade-in mb-6">
          {/* Model-Synthese & Risico-Analyse */}
          <div className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                Model-Synthese & Risico-Analyse
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Live Kansberekening
              </span>
            </div>

            {(() => {
              const periods = groupRiskPeriods(weather.hourly, knmiWarnings);
              if (periods.length === 0) {
                return (
                  <div className="card p-6 border border-emerald-500/25 bg-emerald-500/5 text-center rounded-3xl">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mb-1">
                      Geen verhoogd onweers- of regenrisico
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      De komende 48 uur laten geen noemenswaardige atmosferische instabiliteit of zware neerslagsignalen zien voor {city.name}. Het blijft overwegend rustig.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {periods.map((period, idx) => {
                    const timeLabel = formatPeriodRange(period.startHour, period.endHour, copy.dateLocale);
                    return (
                      <div key={idx} className="card p-5 sm:p-6 border border-black/5 dark:border-white/5 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-blue-500/5 blur-2xl pointer-events-none rounded-full" />
                        
                        <div className="flex flex-col gap-4 relative z-10">
                          {/* Header / Timing */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Risicoperiode #{idx + 1}</span>
                              <h4 className="text-base font-black text-text-primary mt-0.5">{timeLabel}</h4>
                            </div>
                            <div className="flex gap-2">
                              {period.maxThunderstormChance >= 30 && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                  Onweer
                                </span>
                              )}
                              {period.maxPrecipitation >= 2.0 && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Zware Regen
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Probability Gauges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-1">
                            {/* Thunderstorm Probability */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs font-black text-text-secondary flex items-center gap-1">
                                  ⚡ Kans op onweer
                                </span>
                                <span className={`text-sm font-black ${
                                  period.maxThunderstormChance >= 60 ? "text-rose-500" :
                                  period.maxThunderstormChance >= 30 ? "text-orange-500" :
                                  "text-text-muted"
                                }`}>
                                  {period.maxThunderstormChance}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                    period.maxThunderstormChance >= 60 ? "from-orange-500 to-rose-500" :
                                    period.maxThunderstormChance >= 30 ? "from-yellow-400 to-orange-500" :
                                    "from-yellow-300 to-amber-400"
                                  }`}
                                  style={{ width: `${period.maxThunderstormChance}%` }}
                                />
                              </div>
                            </div>

                            {/* Rain Probability */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs font-black text-text-secondary flex items-center gap-1">
                                  🌧️ Kans op regen
                                </span>
                                <span className={`text-sm font-black ${
                                  period.maxRainChance >= 70 ? "text-blue-500" :
                                  "text-text-muted"
                                }`}>
                                  {period.maxRainChance}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-blue-500"
                                  style={{ width: `${period.maxRainChance}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Atmospheric Badges */}
                          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                            <span className="px-2 py-1 rounded-lg bg-orange-500/5 text-orange-600 dark:text-orange-300 border border-orange-500/10">
                              Piek CAPE: {Math.round(period.maxCape)} J/kg
                            </span>
                            {period.minLiftedIndex < 99 && (
                              <span className="px-2 py-1 rounded-lg bg-blue-500/5 text-blue-600 dark:text-blue-300 border border-blue-500/10">
                                Lifted Index: {period.minLiftedIndex}°C
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-lg bg-red-500/5 text-red-600 dark:text-red-300 border border-red-500/10">
                              Remming (CIN): {Math.round(period.maxCin)} J/kg
                            </span>
                            {period.maxPrecipitation > 0 && (
                              <span className="px-2 py-1 rounded-lg bg-cyan-500/5 text-cyan-600 dark:text-cyan-300 border border-cyan-500/10">
                                Piek intensiteit: {period.maxPrecipitation.toFixed(1)} mm/h
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-lg bg-purple-500/5 text-purple-600 dark:text-purple-300 border border-purple-500/10">
                              Gem. Schering: {period.avgWindShear} km/h
                            </span>
                          </div>

                          {/* Narrative Explanation */}
                          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 mt-1">
                            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                              __html: period.narrative
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{copy.rainIntensity}</h3>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{copy.next48}</span>
            </div>
            <ReflectivityMap hourly={weather.hourly} locale={locale} />
          </div>
          <div className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{copy.lightning}</h3>
            </div>
            <LightningMap lat={city.lat} lon={city.lon} locale={locale} />
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-end justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{copy.expertHubTitle}</h3>
              </div>
              <p className="text-[11px] text-text-secondary leading-normal">
                {copy.expertHubSubtitle}
              </p>
            </div>
            <ReedExtremeCharts hourly={weather.hourly} locale={locale} />
          </div>
        </div>
      )}

      {(!loading || weather) && hasExtreme && alert && (
        <div className="space-y-4">
          <div className={`card !p-8 border-l-8 ${alert.severity === "RED" ? "border-l-rose-500 bg-rose-500/5" : alert.severity === "ORANGE" ? "border-l-orange-500 bg-orange-500/5" : "border-l-amber-500 bg-amber-500/5"}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className={`w-6 h-6 ${alert.severity === "RED" ? "text-rose-500" : alert.severity === "ORANGE" ? "text-orange-500" : "text-amber-500"}`} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">
                {copy.important} - {alert.severity}
              </span>
            </div>
            <h2 className="text-4xl font-black text-text-primary leading-tight mb-2">{alert.type.join(" & ")}</h2>
            <p className="text-xl font-bold text-text-secondary mb-6">
              {alert.location} - {alert.timing}
            </p>
            <div className="bg-black/5 rounded-2xl p-6 border border-black/5">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{copy.mustKnow}</p>
              <p className="text-lg font-medium text-text-primary italic">"{alert.instruction}"</p>
              <p className="text-[10px] text-text-muted mt-4 uppercase">WEERZONE</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weather?.current && (
              <div className="card !p-6">
                <p className="text-[10px] font-black text-text-muted uppercase mb-4">{copy.current}</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-bold text-text-secondary">{copy.wind}</span>
                    </div>
                    <span className="text-lg font-black text-text-primary">{weather.current.windGusts} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-bold text-text-secondary">{copy.feelsLike}</span>
                    </div>
                    <span className="text-lg font-black text-text-primary">{weather.current.feelsLike} deg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <Link href="/" className="text-sm text-white/40 hover:text-white underline font-bold tracking-tight">
          &larr; {copy.dashboard}
        </Link>
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
