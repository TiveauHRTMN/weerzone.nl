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
  beforeFooter?: React.ReactNode;
  titleOverride?: string;
  hideWeatherInfo?: boolean;
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

export default function WeatherDashboard({ initialCity, initialWeather, beforeFooter, titleOverride, hideWeatherInfo }: DashboardProps) {
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

  // Fix hydration mismatch: Sync city from localStorage after mount
  useEffect(() => {
    const saved = getSavedCity();
    if (saved && !initialCity) {
      setCity(saved);
    }
  }, [initialCity]);

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
    localStorage.setItem("wz_city", JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }));
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

  if (loading || !weather) return <LoadingScreen />;

  const summaryWords = weather.summaryVerdict?.split(/\s+/).filter(Boolean).length ?? 0;
  const narrative = wws?.piet_update?.content
    || (summaryWords >= 20 ? weather.summaryVerdict : null)
    || getMainCommentary(weather);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
        

        <div className="flex flex-col gap-6 animate-fade-in">
          {!hideWeatherInfo && (
            <>
              {/* ACTUEEL SECTION: HERO SIZE */}
              <div className="card overflow-hidden relative group shadow-2xl border-white/40">
            <div className="p-8 sm:p-12 relative z-[2] pt-12 sm:pt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[12px] font-black uppercase tracking-[0.3em] text-black bg-black/5 px-3 py-1 rounded">Actueel</span>
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

          {/* Narrative: Piet-commentaar of algemene samenvatting */}
          {narrative && (
            <div className="card px-6 py-5 border-white/40 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {wws ? "Piet — Live Analyse" : "Samenvatting"}
                </span>
              </div>
              <p className="text-base font-medium text-text-primary leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* WWS Micro-Dossier (indien beschikbaar) */}
          {wws && (
              <div className="card p-5 bg-slate-900 border-slate-800 overflow-hidden relative">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">1KM Meta-Grid</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/20 uppercase">Model consensus: {wws.api_grid_1km.divergence_delta === 0 ? 'Optimal' : 'Divergent'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {wws.api_grid_1km.forecast.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex flex-col">
                              <span className="text-[9px] font-black text-white/30 uppercase mb-1">{new Date(f.time).getHours()}:00</span>
                              <div className="flex items-baseline gap-1.5">
                                  <span className="text-xl font-black text-white">{f.temp_c}°</span>
                                  <span className="text-[10px] font-bold text-white/40">{f.precip_mm}mm</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* KORTE TERMIJN SECTION: LARGER CARDS */}
          <div className="card p-6 sm:p-10 border-white/40 shadow-xl">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-8 px-1">Korte Termijn</h3>
            <div className="grid grid-cols-2 gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="w-full aspect-square rounded-[32px] border border-white/60 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-inner transition-transform hover:scale-105">
                    <span className="text-8xl sm:text-9xl drop-shadow-xl">{getWeatherEmoji(weather.daily[i].weatherCode, true)}</span>
                  </div>
                  <div className="px-2 flex justify-between items-center">
                    <span className="text-sm sm:text-base font-black uppercase tracking-widest text-text-secondary">{i === 0 ? "Vandaag" : "Morgen"}</span>
                    <span className="text-3xl sm:text-4xl font-black text-text-primary">{weather.daily[i].tempMax}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 sm:p-8 border-white/40 shadow-xl">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-8 px-1">Activiteiten</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { id: "bbq", label: "BBQ", score: getBbqScore(weather), emoji: "🍖", hint: "Temperatuur, wind en regen gecombineerd." },
                { id: "pollen", label: "Hooikoorts", score: getHooikoortsScore(weather), emoji: "🤧", hint: "Risico op pollenklachten vandaag." },
                { id: "strand", label: "Strand", score: getStrandScore(weather), emoji: "🏖️", hint: "Zon, temperatuur en wind aan zee." },
                { id: "terras", label: "Terras", score: getTerrasScore(weather), emoji: "🍻", hint: "Droog, warm en niet te winderig." },
                { id: "fietsen", label: "Fietsen", score: getFietsScore(weather).score, emoji: "🚲", hint: "Wind, regen en zicht voor fietsers." },
                { id: "wandelen", label: "Wandelen", score: getWandelScore(weather), emoji: "🥾", hint: "Droog pad, aangenaam en niet te warm." },
              ].map((item) => {
                const label = item.score >= 8 ? "Uitstekend" : item.score >= 6 ? "Goed" : item.score >= 4 ? "Matig" : "Slecht";
                const isOpen = activeActivity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveActivity(isOpen ? null : item.id)}
                    onMouseEnter={() => setActiveActivity(item.id)}
                    onMouseLeave={() => setActiveActivity(null)}
                    className="relative aspect-square rounded-3xl border border-white/60 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none"
                  >
                    <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 border-white/20 shadow-lg ${item.score >= 7 ? 'bg-accent-green text-white' : item.score >= 5 ? 'bg-accent-amber text-white' : 'bg-accent-red text-white'}`}>
                      {item.score}
                    </div>
                    <div className="text-6xl mb-3 drop-shadow-md">{item.emoji}</div>
                    <div className="text-[11px] font-black text-text-muted uppercase tracking-widest">{item.label}</div>
                    {isOpen && (
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-40 z-10 px-3 py-2 rounded-2xl text-center pointer-events-none"
                        style={{ background: "rgba(15,26,44,0.88)", backdropFilter: "blur(8px)" }}>
                        <p className="text-[11px] font-black text-white leading-none mb-1">{label}</p>
                        <p className="text-[10px] text-white/60 leading-snug">{item.hint}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5 sm:p-7 border-white/40 shadow-xl">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-4 px-1">Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailItem
                label="Zon"
                value={`UV ${weather.uvIndex.toFixed(0)}`}
                icon={<Sun />}
                fillPct={(weather.uvIndex / 11) * 100}
              />
              <DetailItem
                label="Regen"
                value={weather.current.precipitation}
                unit="MM"
                icon={<CloudRain />}
                fillPct={Math.min((Number(weather.current.precipitation) / 10) * 100, 100)}
              />
              <DetailItem
                label="Wind"
                value={weather.current.windSpeed}
                unit="KM/H"
                subValue={`BFT ${getWindBeaufort(weather.current.windSpeed).scale}`}
                icon={<Wind />}
                fillPct={(getWindBeaufort(weather.current.windSpeed).scale / 12) * 100}
              />
              <DetailItem
                label="Gevoel"
                value={weather.current.feelsLike}
                unit="°"
                icon={<Thermometer />}
              />
              <DetailItem
                label="Vocht"
                value={weather.current.humidity}
                unit="%"
                icon={<Droplets />}
                fillPct={Number(weather.current.humidity)}
              />
            </div>
          </div>

          <EmailSubscribe city={city} />
          <AffiliateCard weather={weather} placeName={city.name} />

          {/* PIET GATE: GRID & RADAR */}
          <PremiumGate tierRequired="piet">
            <div className="space-y-6">
              {/* Rain radar */}
              {weather.minutely && weather.minutely.length > 0 && (
                <div className="card p-5 border-white/40 shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Live Regen-Precisie</h3>
                  </div>
                  <RainRadar data={weather.minutely} />
                </div>
              )}

              {/* Hourly forecast */}
              <div className="card p-5 sm:p-6 border-white/40 shadow-xl">
                <div className="flex justify-between items-center mb-6 px-1">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Uur-voor-uur Details</h3>
                  <div className="flex items-center gap-0.5 rounded-2xl border border-white/60 p-0.5" style={{ background: "rgba(255,255,255,0.3)" }}>
                    {[
                      { k: "temp", i: <Thermometer className="w-3.5 h-3.5" /> },
                      { k: "rain", i: <CloudRain className="w-3.5 h-3.5" /> },
                      { k: "wind", i: <Wind className="w-3.5 h-3.5" /> },
                    ].map(m => (
                      <button
                        key={m.k}
                        onClick={() => setHourlyMetric(m.k as "temp" | "rain" | "wind")}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: hourlyMetric === m.k ? "rgba(255,255,255,0.85)" : "transparent",
                          color: hourlyMetric === m.k ? "var(--text-primary)" : "var(--text-muted)",
                          boxShadow: hourlyMetric === m.k ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        }}
                      >
                        {m.i}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                <div ref={hourlyScrollRef} className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                  {(() => {
                    const nowHour = new Date()
                      .toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" })
                      .slice(0, 13).replace(" ", "T"); 
                    const startIdx = Math.max(0, weather.hourly.findIndex(h => h.time >= nowHour));
                    return weather.hourly.slice(startIdx, startIdx + 16);
                  })().map((hour, idx) => {
                    const h   = new Date(hour.time).getHours();
                    const isNow = idx === 0;
                    return (
                      <div
                        key={hour.time}
                        className="flex flex-col items-center gap-2 rounded-2xl border px-2.5 py-3 snap-start shrink-0 w-[72px] transition-all"
                        style={{
                          background: isNow ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.10)",
                          borderColor: isNow ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                          boxShadow: isNow ? "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
                        }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: isNow ? "#f59e0b" : "var(--text-muted)" }}>
                          {isNow ? "Nu" : `${h}:00`}
                        </span>
                        <span className="text-3xl leading-none">{getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}</span>
                        <div className="flex items-baseline gap-0.5 leading-none">
                          <span className="text-sm font-black text-text-primary">
                            {hourlyMetric === "temp" ? hour.temperature : hourlyMetric === "rain" ? hour.precipitation.toFixed(1) : hour.windSpeed}
                          </span>
                          <span className="text-[9px] font-black text-text-muted">
                            {hourlyMetric === "temp" ? "°" : hourlyMetric === "rain" ? "mm" : "km"}
                          </span>
                        </div>
                        <div className="w-full h-0.5 rounded-full overflow-hidden bg-black/[0.06]">
                          <div className={`h-full rounded-full ${hour.confidence === "high" ? "bg-accent-green" : "bg-accent-amber"}`} style={{ width: "100%" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute inset-y-0 right-0 w-10 pointer-events-none rounded-r-2xl"
                  style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.85))" }} />
                </div>
              </div>
            </div>
          </PremiumGate>

          {/* REED GATE: EXTREMITIES & CAPE */}
          <PremiumGate tierRequired="reed">
            {(() => {
              const cape = weather.hourly[0]?.cape ?? 0;
              const precip = weather.current.precipitation;
              const lightningRisk = weather.neuralData?.lightningRisk ?? 0;

              const capeLabel = cape === 0 ? "Geen onweer" : cape < 500 ? "Licht onweer mogelijk" : cape < 1500 ? "Onweer mogelijk" : "Zwaar onweer";
              const precipLabel = precip === 0 ? "Droog" : precip < 1 ? "Lichte regen" : precip < 5 ? "Matige regen" : "Zware regen";

              const isAlert = cape > 1500 || precip > 5 || lightningRisk > 60;
              const statusLabel = isAlert ? "Verhoogde dreiging" : "Alles rustig";
              const reedVerdict = isAlert
                ? `Let op: verhoogde weeractivity bij ${city.name}. Blijf de situatie volgen.`
                : `Geen gevaarlijke condities bij ${city.name}.`;

              return (
                <div className="card p-6 border-white/40 shadow-xl">
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Reed</span>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAlert ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      <span className="text-2xl font-black text-text-primary">{statusLabel}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed pl-[22px] text-text-secondary">
                      {reedVerdict}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap pl-[22px]">
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/5 text-text-secondary">
                      ⚡ {capeLabel}
                    </span>
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/5 text-text-secondary">
                      🌧 {precipLabel}
                    </span>
                  </div>
                </div>
              );
            })()}
          </PremiumGate>
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
