"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Sun, Users, Terminal, Droplets, Zap } from "lucide-react";
import PremiumGate from "./PremiumGate";
import { useSession } from "@/lib/session-context";
import LoadingScreen from "./LoadingScreen";
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
import PietInlineTip from "./PietInlineTip";
import EmailSubscribe from "./EmailSubscribe";
import SupportCard from "./SupportCard";
import Footer from "./Footer";
import dynamic from "next/dynamic";

const WeatherBackground = dynamic(() => import("./WeatherBackground"));
const RainRadar = dynamic(() => import("./RainRadar"), {
  ssr: false,
  loading: () => <div className="card p-4 text-center text-xs text-text-secondary">Radar laadt…</div>,
});

interface DashboardProps {
  initialCity?: City;
  initialWeather?: WeatherData;
  topContent?: React.ReactNode;
  beforeFooter?: React.ReactNode;
  titleOverride?: string;
  hideWeatherInfo?: boolean;
  slimMode?: boolean;
}

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

export default function WeatherDashboard({ initialCity, initialWeather, topContent, beforeFooter, titleOverride, hideWeatherInfo, slimMode }: DashboardProps) {
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [loading, setLoading] = useState(!initialWeather);
  const [error, setError] = useState(false);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");
  const [isLocating, setIsLocating] = useState(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const { tier } = useSession();
  const hourlyScrollRef = useRef<HTMLDivElement>(null);

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

  // Sync city from localStorage after mount.
  //
  // We overschrijven de SSR-initialCity altijd als er een opgeslagen city
  // is — zo zien gebruikers met een eerder gekozen plaats nooit per ongeluk
  // de SSR-fallback (De Bilt / Amsterdam) op pagina's als /mijnweer of
  // /waarschuwingen. De effect verderop schrijft direct ook cookies, dus
  // de volgende navigatie is meteen correct via SSR.
  useEffect(() => {
    const saved = getSavedCity();
    if (saved && (saved.name !== city.name || saved.lat !== city.lat || saved.lon !== city.lon)) {
      setCity(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        () => {}
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

    loadWWS(targetCity.lat, targetCity.lon).then(wwsPayload => {
      if (!cancelled) setWWS(wwsPayload);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanupPromise = loadData(city);
    const interval = setInterval(() => loadData(city), 15 * 60000);
    return () => {
      cleanupPromise.then(fn => fn && fn());
      clearInterval(interval);
    };
  }, [city, loadData]);

  const handleLocationClick = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisional: City = { name: "Jouw locatie", lat, lon };
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
    // persistCity() schrijft localStorage EN cookies — zodat SSR-pagina's
    // (/mijnweer, /waarschuwingen, /weer/[province]/[place]) op de juiste
    // locatie renderen na een navigatie. Voorheen werd alleen localStorage
    // gezet, waardoor SSR-routes terugvielen op de hardcoded default.
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

  if (error && !weather) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
          <AlertTriangle className="text-accent-orange w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Oeps! Geen verbinding</h2>
        <p className="text-white/60 text-sm max-w-[280px] mb-6">We kunnen de weersgegevens voor {city.name} momenteel niet ophalen.</p>
        <button 
          onClick={() => loadData(city)}
          className="btn btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Probeer opnieuw
        </button>
      </div>
    );
  }

  if (loading || !weather) {
    if (hideWeatherInfo) {
      return (
        <div className="min-h-screen relative overflow-x-hidden">
          <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
            {topContent}
            {beforeFooter}
            <Footer />
          </div>
        </div>
      );
    }
    return <LoadingScreen />;
  }

  const summaryWords = weather.summaryVerdict?.split(/\s+/).filter(Boolean).length ?? 0;
  const narrative = wws?.piet_update?.content
    || (summaryWords >= 20 ? weather.summaryVerdict : null)
    || getMainCommentary(weather);
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
        {topContent}

        <div className="flex flex-col gap-6 animate-fade-in">
          {!hideWeatherInfo && (
            <>
              {!slimMode && (<>

              {/* TAGLINE */}
              <div className="text-center py-6 sm:py-10">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-3" style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #3b82f6 40%, #06b6d4 70%, #10b981 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Hyperlokaal weer.<br />Vandaag en morgen.
                </h2>
              </div>

              {/* ACTUEEL SECTION: HERO SIZE */}
              <div className="card overflow-hidden relative group shadow-2xl border-white/40">
            <div className="p-8 sm:p-12 relative z-[2] pt-12 sm:pt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[12px] font-black uppercase tracking-[0.3em] text-black bg-black/5 px-3 py-1 rounded">Actueel weer</span>
                    {wws && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Synthese Live</span>
                        </div>
                    )}
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
                   <span className="text-4xl font-black text-text-primary">{getWeatherDescription(weather.current.weatherCode)}</span>
                   <span className="text-lg font-bold text-text-secondary bg-black/5 px-4 py-1.5 rounded-full shadow-inner">Voelt als {weather.current.feelsLike}°</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Narrative teaser */}
          {narrative && (
            <div className="card px-6 py-5 border-white/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {wws ? "Piet — Live Analyse" : "Wat betekent dit vandaag?"}
                </span>
              </div>
              <p className="text-base font-medium text-text-primary leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* CTA: Mijn Weer */}
          <Link href="/mijnweer" className="block group">
            <div className="card p-8 sm:p-10 border-white/40 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">💬</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Piet · Mijn Weer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">Jouw persoonlijke weerverhaal</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">Kledingadvies, terras- en fietsscore, dagdelen, pollen, UV-index en vandaag vs. morgen — alles voor jouw postcode.</p>
              <span className="inline-flex items-center text-sm font-black text-blue-600 group-hover:gap-3 gap-2 transition-all">Bekijk Mijn Weer <span className="text-lg">→</span></span>
            </div>
          </Link>

          {/* CTA: Waarschuwingen */}
          <Link href="/waarschuwingen" className="block group">
            <div className="card p-8 sm:p-10 border-white/40 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">⚡</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Reed · Waarschuwingen</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">Extreem weer? Wij zien het eerst.</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">Reflectiviteit, CAPE, windstoten en KNMI-waarschuwingen — real-time op jouw locatie. Harmonie, ICON-D2 en Arome.</p>
              <span className="inline-flex items-center text-sm font-black text-rose-500 group-hover:gap-3 gap-2 transition-all">Bekijk Waarschuwingen <span className="text-lg">→</span></span>
            </div>
          </Link>

          <SupportCard />
          <EmailSubscribe city={city} />
          <AffiliateCard weather={weather} placeName={city.name} />
              </>)}
          </>
          )}
        </div>
        {beforeFooter}
        <Footer />
        <AmazonStickyBar weather={weather} />
      </div>
    </div>
  );
}
