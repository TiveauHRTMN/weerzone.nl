"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Sun, Users, Droplets, Zap } from "lucide-react";
import PremiumGate from "./PremiumGate";
import { useSession } from "@/lib/session-context";
import { loadWeather, loadWWS } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData, type WWSPayload } from "@/lib/types";
import {
  getMainCommentary,
  getFietsScore,
  getBbqScore,
  getStrandScore,
  getHooikoortsScore,
  getTerrasScore,
  getWandelScore,
} from "@/lib/commentary";
import { getWeatherEmoji, getWeatherDescription, getWindBeaufort } from "@/lib/weather";
import { motion, AnimatePresence } from "framer-motion";
import AffiliateCard from "./AffiliateCard";
import AmazonStickyBar from "./AmazonStickyBar";
import EmailSubscribe from "./EmailSubscribe";
import SupportBanner from "./SupportBanner";
import Footer from "./Footer";
import WeatherAdvice from "./WeatherAdvice";
import dynamic from "next/dynamic";
import WeatherBackground from "./WeatherBackground";
import { getKarlWeatherVerdict, getLucWeatherVerdict, getJuanWeatherVerdict } from "@/app/actions";
import type { Locale } from "@/config/locales";

const RainRadar = dynamic(() => import("./RainRadar"), {
  ssr: false,
  loading: () => <div className="card p-4 text-center text-xs text-text-secondary">Radar laadt…</div>,
});
interface DashboardProps {
  initialCity?: City;
  initialWeather?: WeatherData;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
  locale?: Locale;
  topContent?: React.ReactNode;
  beforeFooter?: React.ReactNode;
  titleOverride?: string;
  hideWeatherInfo?: boolean;
  slimMode?: boolean;
  showRainRadar?: boolean;
  initialNarrative?: string | null;
}


import { persistCity } from "@/lib/persist-city";

const TILE_PALETTE: Record<string, { tint: string; accent: string }> = {
  "Zon":    { tint: "rgba(245,158,11,0.10)",  accent: "#f59e0b" },
  "Regen":  { tint: "rgba(6,182,212,0.09)",   accent: "#06b6d4" },
  "Wind":   { tint: "rgba(100,116,139,0.09)", accent: "#64748b" },
  "Gevoel": { tint: "rgba(239,68,68,0.08)",   accent: "#f97316" },
  "Vocht":  { tint: "rgba(14,165,233,0.10)",  accent: "#0ea5e9" },
};

const DASHBOARD_COPY: Record<Locale, {
  connectionTitle: string;
  connectionBody: (city: string) => string;
  retry: string;
  locationName: string;
  tagline: React.ReactNode;
  currentWeather: string;
  feelsLike: string;
  narrativeLabel: string;
  ctaHref: string;
  ctaKicker: string;
  ctaTitle: string;
  ctaBody: string;
  ctaAction: string;
  warningsHref: string;
  warningsKicker: string;
  warningsTitle: string;
  warningsBody: string;
  warningsAction: string;
}> = {
  nl: {
    connectionTitle: "Oeps! Geen verbinding",
    connectionBody: (city) => `We kunnen de weersgegevens voor ${city} momenteel niet ophalen.`,
    retry: "Probeer opnieuw",
    locationName: "Jouw locatie",
    tagline: <>Hyperlokaal weer.<br />Vandaag en morgen.</>,
    currentWeather: "Actueel weer",
    feelsLike: "Voelt als",
    narrativeLabel: "Piet z'n kijk op vandaag",
    ctaHref: "/mijnweer",
    ctaKicker: "Piet · Mijn Weer",
    ctaTitle: "Jouw persoonlijke weerbericht",
    ctaBody: "Kledingadvies, terras- en fietsscore, dagdelen, pollen, UV-index en vandaag vs. morgen - precies wat je moet weten.",
    ctaAction: "Bekijk Mijn Weer",
    warningsHref: "/waarschuwingen",
    warningsKicker: "Reed · Waarschuwingen",
    warningsTitle: "Geen verrassingen bij extreem weer",
    warningsBody: "We houden de horizon 24/7 voor je in de gaten. Van zware windstoten tot naderend onweer - je ziet het direct voor jouw locatie.",
    warningsAction: "Bekijk Waarschuwingen",
  },
  de: {
    connectionTitle: "Verbindung fehlt",
    connectionBody: (city) => `Wir koennen die Wetterdaten fuer ${city} gerade nicht laden.`,
    retry: "Erneut versuchen",
    locationName: "Dein Standort",
    tagline: <>Hyperlokales Wetter.<br />Heute und morgen.</>,
    currentWeather: "Aktuelles Wetter",
    feelsLike: "Fuehlt sich an wie",
    narrativeLabel: "Karls Blick auf heute",
    ctaHref: "/de/mein-wetter",
    ctaKicker: "Karl · Mein Wetter",
    ctaTitle: "Dein persoenlicher Wetterbericht",
    ctaBody: "Kleidungstipps, Tagesabschnitte, UV und heute versus morgen - direkt fuer deine Entscheidung.",
    ctaAction: "Mein Wetter ansehen",
    warningsHref: "/de/warnungen",
    warningsKicker: "Reed · Warnungen",
    warningsTitle: "Keine Ueberraschungen bei Extremwetter",
    warningsBody: "Wir beobachten die Lage rund um die Uhr. Von starken Boeen bis zu nahendem Gewitter - du siehst es direkt fuer deinen Standort.",
    warningsAction: "Warnungen ansehen",
  },
  fr: {
    connectionTitle: "Connexion indisponible",
    connectionBody: (city) => `Les donnees meteo pour ${city} ne chargent pas pour le moment.`,
    retry: "Reessayer",
    locationName: "Votre position",
    tagline: <>Meteo hyperlocale.<br />Aujourd'hui et demain.</>,
    currentWeather: "Meteo actuelle",
    feelsLike: "Ressenti",
    narrativeLabel: "Le regard de Luc aujourd'hui",
    ctaHref: "/fr/mon-meteo",
    ctaKicker: "Luc · Ma Meteo",
    ctaTitle: "Votre meteo personnelle",
    ctaBody: "Un bulletin clair pour ta ville: pluie, vent, soleil et le bon conseil pour les prochaines 48 heures.",
    ctaAction: "Voir Ma Meteo",
    warningsHref: "/fr/alertes",
    warningsKicker: "Reed · Alertes",
    warningsTitle: "Pas de surprise en cas de temps violent",
    warningsBody: "Vent, pluie, orages ou chaleur: les seuils importants sont traduits en decisions simples pour votre lieu.",
    warningsAction: "Voir les alertes",
  },
  es: {
    connectionTitle: "Sin conexion",
    connectionBody: (city) => `No podemos cargar ahora los datos del tiempo para ${city}.`,
    retry: "Intentar de nuevo",
    locationName: "Tu ubicacion",
    tagline: <>Tiempo hiperlocal.<br />Hoy y manana.</>,
    currentWeather: "Tiempo actual",
    feelsLike: "Sensacion",
    narrativeLabel: "La lectura de Juan para hoy",
    ctaHref: "/es/mi-tiempo",
    ctaKicker: "Juan · Mi tiempo",
    ctaTitle: "Tu parte personal del tiempo",
    ctaBody: "Juan traduce las proximas 48 horas a decisiones concretas para tu calle, costa, isla, sierra o ciudad.",
    ctaAction: "Ver Mi tiempo",
    warningsHref: "/es/alertas",
    warningsKicker: "Reed · Alertas",
    warningsTitle: "Sin sorpresas con tiempo extremo",
    warningsBody: "Lluvia, viento, tormenta, calor o frio: las alertas se explican para tu ubicacion y tus limites.",
    warningsAction: "Ver alertas",
  },
};

const DetailItem = ({ label, value, subValue, icon, unit, fillPct }: {
  label: string; value: string | number; subValue?: string;
  icon: React.ReactNode; unit?: string; fillPct?: number;
}) => {
  const { tint, accent } = TILE_PALETTE[label] ?? { tint: "rgba(0,0,0,0.04)", accent: "#64748b" };
  return (
    <div
      className="flex flex-col rounded-3xl border border-white/60 overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
      style={{ background: tint, backdropFilter: "blur(8px)" }}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}22` }}>
            {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number; color?: string }>, {
              size: 15, strokeWidth: 2.5, color: accent,
            })}
          </div>
          <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 leading-none">
          <span className="text-3xl sm:text-4xl font-black text-text-primary tracking-tighter">{value}</span>
          {unit && <span className="text-sm font-black uppercase ml-0.5" style={{ color: accent }}>{unit}</span>}
        </div>
        {subValue && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-lg w-fit" style={{ background: `${accent}18` }}>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>{subValue}</span>
          </div>
        )}
      </div>
      {fillPct !== undefined && (
        <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(fillPct, 100)}%`, background: accent }} />
        </div>
      )}
    </div>
  );
};

export default function WeatherDashboard({
  initialCity,
  initialWeather,
  initialWeatherCode,
  initialIsDay,
  locale = "nl",
  topContent,
  beforeFooter,
  titleOverride,
  hideWeatherInfo,
  slimMode,
  showRainRadar,
  initialNarrative,
}: DashboardProps) {
  const needsWeatherData = !hideWeatherInfo || !!showRainRadar;
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [loading, setLoading] = useState(needsWeatherData && !initialWeather);
  const [error, setError] = useState(false);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");
  const [isLocating, setIsLocating] = useState(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [personaNarrative, setPersonaNarrative] = useState<string | null>(initialNarrative ?? null);
  const { tier } = useSession();
  const hourlyScrollRef = useRef<HTMLDivElement>(null);
  const copy = DASHBOARD_COPY[locale];
  const isNL = locale === "nl";

  useEffect(() => {
    const el = hourlyScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // al horizontaal
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);


  const loadData = useCallback(async (targetCity: City) => {
    let cancelled = false;
    setError(false);
    
    try {
      const dataPromise = loadWeather(
        targetCity.lat,
        targetCity.lon,
        (verdict) => {
          if (!cancelled) setWeather((prev) => (prev ? { ...prev, summaryVerdict: verdict } : prev));
        },
        (fresh) => {
          if (!cancelled) {
            setWeather(fresh);
            setLoading(false);
          }
        },
        () => {},
        false,
        locale
      );

      const data = await dataPromise;
      if (!cancelled) {
        if (!data) {
          setError(true);
        } else {
          setWeather(data);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("loadData error:", err);
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    if (isNL) {
      loadWWS(targetCity.lat, targetCity.lon).then((wwsPayload) => {
        if (!cancelled) setWWS(wwsPayload);
      });
    }

    return () => { cancelled = true; };
  }, [isNL, locale]);

  useEffect(() => {
    if (!needsWeatherData) {
      setLoading(false);
      return;
    }

    const cleanupPromise = loadData(city);
    const interval = setInterval(() => loadData(city), 15 * 60000);
    return () => {
      cleanupPromise.then(fn => fn && fn());
      clearInterval(interval);
    };
  }, [city, loadData, needsWeatherData]);

  useEffect(() => {
    if (isNL || !weather) return;
    let cancelled = false;
    if (initialNarrative) {
      setPersonaNarrative(initialNarrative);
      return;
    }
    const contextCity = city as City & { character?: string; province?: string };
    const verdictPromise = locale === "de"
      ? getKarlWeatherVerdict(weather, city.name, "Deutschland")
      : locale === "fr"
        ? getLucWeatherVerdict(weather, city.name, contextCity.province || "France", contextCity.character)
        : getJuanWeatherVerdict(weather, city.name, contextCity.province || "Espana", contextCity.character);

    verdictPromise
      .then((text) => {
        if (!cancelled) setPersonaNarrative(text);
      })
      .catch(() => {
        if (!cancelled) setPersonaNarrative(null);
      });
    return () => {
      cancelled = true;
    };
  }, [city, initialNarrative, isNL, locale, weather]);

  const handleLocationClick = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisional: City = { name: copy.locationName, lat, lon };
        setCity(provisional);
        setIsLocating(false);
        reverseGeocode(lat, lon).then((geoCity) => {
          setCity(geoCity);
          persistCity(geoCity);
          window.dispatchEvent(new CustomEvent("wz:city-updated"));
        }).catch(() => {});
      },
      () => setIsLocating(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60 * 60000 }
    );
  };

  useEffect(() => {
    persistCity({ name: city.name, lat: city.lat, lon: city.lon });
    window.dispatchEvent(new CustomEvent("wz:city-updated"));
  }, [city]);

  const locateRef = useRef(handleLocationClick);
  locateRef.current = handleLocationClick;
  useEffect(() => {
    const fn = () => locateRef.current();
    window.addEventListener("wz:locate", fn);
    return () => window.removeEventListener("wz:locate", fn);
  }, []);

  if (needsWeatherData && error && !weather) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
          <AlertTriangle className="text-accent-orange w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">
          {copy.connectionTitle}
        </h2>
        <p className="text-white/60 text-sm max-w-[280px] mb-6">
          {copy.connectionBody(city.name)}
        </p>
        <button 
          onClick={() => loadData(city)}
          className="btn btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {copy.retry}
        </button>
      </div>
    );
  }

  if (needsWeatherData && (loading || !weather)) {
    const wCode = initialWeather?.current.weatherCode ?? initialWeatherCode ?? 2;
    const isD = initialWeather?.current.isDay ?? initialIsDay ?? true;
    
    return (
      <div className="min-h-screen relative overflow-x-hidden">
        <WeatherBackground weatherCode={wCode} isDay={isD} />
        <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
          {topContent}
          {beforeFooter}
        </div>
      </div>
    );
  }

  const summaryWords = weather?.summaryVerdict?.split(/\s+/).filter(Boolean).length ?? 0;
  const narrative = weather
    ? (isNL
      ? wws?.piet_update?.content
        || (summaryWords >= 20 ? weather.summaryVerdict : null)
        || getMainCommentary(weather)
      : personaNarrative
        || (summaryWords >= 20 ? weather.summaryVerdict : null))
    : null;
  const backgroundWeatherCode = weather?.current.weatherCode ?? initialWeatherCode ?? 2;
  const backgroundIsDay = weather?.current.isDay ?? initialIsDay ?? true;
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={backgroundWeatherCode} isDay={backgroundIsDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
        <SupportBanner locale={locale} />
        {topContent}

        <div className="flex flex-col gap-6 animate-fade-in">
          {!hideWeatherInfo && weather && (
            <>
              {!slimMode && (<>

              {/* TAGLINE */}
              <div className="text-center py-6 sm:py-10">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-3" style={{
                  background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {copy.tagline}
                </h2>
              </div>

              {/* ACTUEEL SECTION: HERO SIZE */}
              <div className="card relative group">
            <div className="p-8 sm:p-12 relative z-[2] pt-12 sm:pt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                <div className="flex flex-col items-start">
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span
                      className="text-[12px] font-black uppercase tracking-[0.3em] text-white px-3 py-1.5 rounded-[10px] shadow-sm"
                      style={{ background: "#3b7ff0" }}
                    >
                      {copy.currentWeather}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-text-secondary mb-3">{city.name}</h1>
                  <div className="flex items-start">
                    <span className="text-[9rem] sm:text-[11rem] font-black tracking-tighter leading-none text-text-primary">{weather.current.temperature}</span>
                    <span className="text-5xl sm:text-6xl font-black mt-5 ml-1 text-text-primary leading-none">°</span>
                  </div>
                </div>
                
                <div className="text-[9rem] sm:text-[11rem] flex items-center justify-center drop-shadow-2xl animate-float">
                  {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                 <div className="flex flex-wrap items-center gap-5">
                   <span className="text-4xl font-black text-text-primary">{getWeatherDescription(weather.current.weatherCode, locale)}</span>
                   <span className="text-lg font-bold text-text-secondary bg-[var(--wz-blue)]/5 px-4 py-1.5 rounded-full shadow-inner border border-[var(--wz-blue)]/10">
                     {copy.feelsLike} {weather.current.feelsLike}°
                   </span>
                 </div>
               </div>
            </div>
          </div>

          {/* Narrative teaser */}
          {narrative && (
            <div className="card px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {copy.narrativeLabel}
                  </span>
              </div>
              <p className="text-base font-medium text-text-primary leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* CTA: Mijn Weer */}
          <Link href={copy.ctaHref} className="block group">
            <div className="card p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">💬</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {copy.ctaKicker}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">
                {copy.ctaTitle}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {copy.ctaBody}
              </p>
              <span className="inline-flex items-center text-sm font-black text-blue-600 group-hover:gap-3 gap-2 transition-all">
                {copy.ctaAction} <span className="text-lg">-&gt;</span>
              </span>
            </div>
          </Link>

          {/* CTA: Waarschuwingen */}
          <Link href={copy.warningsHref} className="block group">
          <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">⚡</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              {copy.warningsKicker}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">
            {copy.warningsTitle}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {copy.warningsBody}
          </p>
          <span className="inline-flex items-center text-sm font-black text-rose-500 group-hover:gap-3 gap-2 transition-all">
            {copy.warningsAction} <span className="text-lg">-&gt;</span>
          </span>
          </div>
          </Link>
          <EmailSubscribe city={city} locale={locale} />
          {(locale === "nl" || locale === "de") && (
            <>
              <WeatherAdvice
                temperature={weather.current.temperature}
                precipitation={weather.current.precipitation}
                isFreezing={weather.current.temperature < 2}
                locale={locale}
              />
              <AffiliateCard weather={weather} placeName={city.name} locale={locale} />
            </>
          )}
              </>)}
          </>
          )}
        </div>
        {showRainRadar && weather && weather.minutely && weather.minutely.length > 0 && (
          <div className="card p-5 sm:p-6">
            <RainRadar data={weather.minutely} locale={locale} />
          </div>
        )}
        {beforeFooter}
        {weather && locale === "nl" && <AmazonStickyBar weather={weather} />}
      </div>
    </div>
  );
}
