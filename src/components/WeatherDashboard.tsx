"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Sun, Users, Terminal, Droplets } from "lucide-react";
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

const DetailItem = ({ label, value, subValue, icon, unit }: { label: string, value: string | number, subValue?: string, icon: React.ReactNode, unit?: string }) => (
  <div className="flex flex-col group transition-all duration-300">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center text-text-muted group-hover:bg-black/[0.08] transition-colors">
        {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 14, strokeWidth: 3 })}
      </div>
      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <div className="text-4xl font-black text-text-primary tracking-tighter">{value}</div>
      {unit && <span className="text-lg font-black text-text-muted uppercase ml-0.5">{unit}</span>}
    </div>
    {subValue && (
      <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-md bg-black/[0.03] border border-black/5 w-fit">
        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none py-0.5">{subValue}</span>
      </div>
    )}
  </div>
);

export default function WeatherDashboard({ initialCity, initialWeather, beforeFooter, titleOverride }: DashboardProps) {
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [loading, setLoading] = useState(!initialWeather);
  const [error, setError] = useState(false);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");
  const [isLocating, setIsLocating] = useState(false);
  const { tier } = useSession();

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
    if (!tier) {
      window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
      return;
    }
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
          localStorage.setItem("wz_city", JSON.stringify(geoCity));
        }).catch(() => {});
      },
      () => setIsLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60000 }
    );
  };

  useEffect(() => {
    localStorage.setItem("wz_city", JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }));
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

  const narrative = wws?.piet_update?.content || weather.summaryVerdict || getMainCommentary(weather);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
        

        <div className="flex flex-col gap-6 animate-fade-in">
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
                  <div className="grid grid-cols-3 gap-4">
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
                { id: "bbq", label: "BBQ", score: getBbqScore(weather), emoji: "🍖" },
                { id: "pollen", label: "Hooikoorts", score: getHooikoortsScore(weather), emoji: "🤧" },
                { id: "strand", label: "Strand", score: getStrandScore(weather), emoji: "🏖️" },
                { id: "terras", label: "Terras", score: getTerrasScore(weather), emoji: "🍻" },
                { id: "fietsen", label: "Fietsen", score: getFietsScore(weather).score, emoji: "🚲" },
                { id: "wandelen", label: "Wandelen", score: getWandelScore(weather), emoji: "🥾" },
              ].map((item) => (
                <div key={item.id} className="relative aspect-square rounded-3xl border border-white/60 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center transition-transform hover:scale-105">
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 border-white/20 shadow-lg ${item.score >= 7 ? 'bg-accent-green text-white' : item.score >= 5 ? 'bg-accent-amber text-white' : 'bg-accent-red text-white'}`}>
                    {item.score}
                  </div>
                  <div className="text-6xl mb-3 drop-shadow-md">{item.emoji}</div>
                  <div className="text-[11px] font-black text-text-muted uppercase tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 sm:p-8 border-white/40 shadow-xl">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-10 px-1">Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-12 gap-x-8">
              <DetailItem label="Zon" value={`UV ${weather.uvIndex.toFixed(0)}`} icon={<Sun />} />
              <DetailItem label="Regen" value={weather.current.precipitation} unit="MM" icon={<CloudRain />} />
              <DetailItem label="Wind" value={weather.current.windSpeed} unit="KM/H" subValue={`BFT ${getWindBeaufort(weather.current.windSpeed).scale}`} icon={<Wind />} />
              <DetailItem label="Gevoel" value={weather.current.feelsLike} unit="°" icon={<Thermometer />} />
              <DetailItem label="Vocht" value={weather.current.humidity} unit="%" icon={<Droplets />} />
            </div>
          </div>

          <EmailSubscribe city={city} />
          <AffiliateCard weather={weather} placeName={city.name} />

          <PremiumGate>
            <div className="card p-4">
              {weather.minutely && weather.minutely.length > 0 && (
                <div className="mb-6 pb-6 border-b border-black/5">
                  <RainRadar data={weather.minutely} />
                </div>
              )}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Komende Uren</h3>
                <div className="flex items-center gap-1 bg-black/5 rounded-full p-0.5">
                  {[{ k: "temp", i: <Thermometer className="w-3.5 h-3.5" /> }, { k: "rain", i: <CloudRain className="w-3.5 h-3.5" /> }, { k: "wind", i: <Wind className="w-3.5 h-3.5" /> }].map(m => (
                    <button key={m.k} onClick={() => setHourlyMetric(m.k as any)} className={`w-7 h-7 rounded-full flex items-center justify-center ${hourlyMetric === m.k ? 'bg-white shadow-sm' : 'text-text-muted'}`}>{m.i}</button>
                  ))}
                </div>
              </div>
              <div className="horizontal-scroll no-scrollbar py-2 -mx-2 px-2 flex gap-3 overflow-x-auto snap-x snap-mandatory">
                {weather.hourly.slice(0, 16).map((hour, idx) => {
                  const h = new Date(hour.time).getHours();
                  return (
                    <div key={hour.time} className={`border rounded-2xl p-3 flex flex-col items-center justify-between min-w-[76px] h-[120px] snap-start ${idx === 0 ? 'bg-accent-orange/10 border-accent-orange/40' : 'bg-black/[0.03] border-black/5'}`}>
                      <div className="text-[10px] font-black text-text-muted uppercase">{idx === 0 ? 'Nu' : `${h}:00`}</div>
                      <div className="text-3xl">{getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}</div>
                      <div className="text-sm font-black">{hourlyMetric === "temp" ? hour.temperature + "°" : hourlyMetric === "rain" ? hour.precipitation.toFixed(1) + "mm" : hour.windSpeed + "km/h"}</div>
                      <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden"><div className={`h-full ${hour.confidence === "high" ? "bg-accent-green" : "bg-accent-amber"}`} style={{ width: '100%' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </PremiumGate>
        </div>
        {beforeFooter}
        <Footer />
        <AmazonStickyBar weather={weather} />
      </div>
    </div>
  );
}
