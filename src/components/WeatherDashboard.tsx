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
import { getKarlWeatherVerdict } from "@/app/actions";

const RainRadar = dynamic(() => import("./RainRadar"), {
  ssr: false,
  loading: () => <div className="card p-4 text-center text-xs text-text-secondary">Radar laadt…</div>,
});
interface DashboardProps {
  initialCity?: City;
  initialWeather?: WeatherData;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
  locale?: "nl" | "de";
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
  const [deNarrative, setDeNarrative] = useState<string | null>(initialNarrative ?? null);
  const { tier } = useSession();
  const hourlyScrollRef = useRef<HTMLDivElement>(null);
  const isDE = locale === "de";

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
  }, [isDE, locale]);


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

    if (!isDE) {
      loadWWS(targetCity.lat, targetCity.lon).then((wwsPayload) => {
        if (!cancelled) setWWS(wwsPayload);
      });
    }

    return () => { cancelled = true; };
  }, []);

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
    if (!isDE || !weather) return;
    let cancelled = false;
    if (initialNarrative) {
      setDeNarrative(initialNarrative);
      return;
    }
    getKarlWeatherVerdict(weather, city.name, "Deutschland")
      .then((text) => {
        if (!cancelled) setDeNarrative(text);
      })
      .catch(() => {
        if (!cancelled) setDeNarrative(null);
      });
    return () => {
      cancelled = true;
    };
  }, [city.name, initialNarrative, isDE, weather]);

  const handleLocationClick = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisional: City = { name: isDE ? "Dein Standort" : "Jouw locatie", lat, lon };
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
          {isDE ? "Verbindung fehlt" : "Oeps! Geen verbinding"}
        </h2>
        <p className="text-white/60 text-sm max-w-[280px] mb-6">
          {isDE
            ? `Wir können die Wetterdaten für ${city.name} gerade nicht laden.`
            : `We kunnen de weersgegevens voor ${city.name} momenteel niet ophalen.`}
        </p>
        <button 
          onClick={() => loadData(city)}
          className="btn btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isDE ? "Erneut versuchen" : "Probeer opnieuw"}
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
    ? (isDE
      ? deNarrative
      : wws?.piet_update?.content
        || (summaryWords >= 20 ? weather.summaryVerdict : null)
        || getMainCommentary(weather))
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
                  background: "linear-gradient(135deg, #ff8400 0%, #cbd5e1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {isDE ? <>Hyperlokales Wetter.<br />Heute und morgen.</> : <>Hyperlokaal weer.<br />Vandaag en morgen.</>}
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
                      {isDE ? "Aktuelles Wetter" : "Actueel weer"}
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
                     {isDE ? "Fühlt sich an wie" : "Voelt als"} {weather.current.feelsLike}°
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
                  {isDE ? "Karls Blick auf heute" : wws ? "Piet z'n kijk op vandaag" : "De essentie"}
                  </span>
              </div>
              <p className="text-base font-medium text-text-primary leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* CTA: Mijn Weer */}
          <Link href={isDE ? "/de/mein-wetter" : "/mijnweer"} className="block group">
            <div className="card p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">💬</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {isDE ? "Karl · Mein Wetter" : "Piet · Mijn Weer"}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">
                {isDE ? "Dein persönlicher Wetterbericht" : "Jouw persoonlijke weerbericht"}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {isDE
                  ? "Kleidungstipps, Tagesabschnitte, UV und heute versus morgen - direkt für deine Entscheidung."
                  : "Kledingadvies, terras- en fietsscore, dagdelen, pollen, UV-index en vandaag vs. morgen — precies wat je moet weten."}
              </p>
              <span className="inline-flex items-center text-sm font-black text-blue-600 group-hover:gap-3 gap-2 transition-all">
                {isDE ? "Mein Wetter ansehen" : "Bekijk Mijn Weer"} <span className="text-lg">→</span>
              </span>
            </div>
          </Link>

          {/* CTA: Waarschuwingen */}
          <Link href={isDE ? "/de/warnungen" : "/waarschuwingen"} className="block group">
          <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">⚡</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              {isDE ? "Reed · Warnungen" : "Reed · Waarschuwingen"}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">
            {isDE ? "Keine Überraschungen bei Extremwetter" : "Geen verrassingen bij extreem weer"}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {isDE
              ? "Wir beobachten die Lage rund um die Uhr. Von starken Böen bis zu nahendem Gewitter - du siehst es direkt für deinen Standort."
              : "We houden de horizon 24/7 voor je in de gaten. Van zware windstoten tot naderend onweer — je ziet het direct voor jouw locatie."}
          </p>
          <span className="inline-flex items-center text-sm font-black text-rose-500 group-hover:gap-3 gap-2 transition-all">
            {isDE ? "Warnungen ansehen" : "Bekijk Waarschuwingen"} <span className="text-lg">→</span>
          </span>
          </div>
          </Link>
          <EmailSubscribe city={city} locale={locale} />
          <WeatherAdvice 
            temperature={weather.current.temperature} 
            precipitation={weather.current.precipitation} 
            isFreezing={weather.current.temperature < 2} 
            locale={locale}
          />
          <AffiliateCard weather={weather} placeName={city.name} locale={locale} />
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
        {weather && <AmazonStickyBar weather={weather} />}
      </div>
    </div>
  );
}
