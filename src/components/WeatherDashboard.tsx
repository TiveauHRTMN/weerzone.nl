"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Sun, Users } from "lucide-react";
import Logo from "./Logo";
import PersonaBadge from "./PersonaBadge";
import PremiumGate from "./PremiumGate";
import { useSession } from "@/lib/session-context";
import LoadingScreen from "./LoadingScreen";
import { loadWeather } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData } from "@/lib/types";
import {
  getMainCommentary,
  getDayProgression,
  getMisereScore,
  getFietsScore,
  getOutfitAdvice,
  getWindComment,
  getUvLabel,
  getBbqScore,
  getStrandScore,
  getHooikoortsScore,
  getTerrasScore,
  getWandelScore,
} from "@/lib/commentary";
import { getWeatherEmoji, getWeatherDescription, getWindBeaufort } from "@/lib/weather";
import { getTemperatureComparison } from "@/lib/climate";
import { motion, AnimatePresence } from "framer-motion";
import AffiliateCard from "./AffiliateCard";
import AmazonStickyBar from "./AmazonStickyBar";
import PietInlineTip from "./PietInlineTip";
import EmailSubscribe from "./EmailSubscribe";
import NavBar from "./NavBar";
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

export default function WeatherDashboard({ initialCity, initialWeather, beforeFooter, titleOverride }: DashboardProps) {
  const [city, setCity] = useState<City>(initialCity || getSavedCity() || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [loading, setLoading] = useState(!initialWeather);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");
  const [isLocating, setIsLocating] = useState(false);
  const { tier } = useSession();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await loadWeather(
        city.lat,
        city.lon,
        (verdict) => {
          if (!cancelled) setWeather((prev) => (prev ? { ...prev, summaryVerdict: verdict } : prev));
        },
        (fresh) => {
          if (!cancelled) setWeather(fresh);
        },
        () => {}
      );
      if (!cancelled) {
        setWeather(data);
        setLoading(false);
      }
    }
    setLoading(true);
    load();
    const interval = setInterval(load, 10 * 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [city]);

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

  if (loading || !weather) return <LoadingScreen />;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6">
        
        <header className="flex flex-col items-center mb-6 sm:mb-10 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="sm:hidden">
              <Logo size={56} />
            </div>
            <div className="hidden sm:block">
              <Logo size={104} />
            </div>
            {tier && <PersonaBadge tier={tier} />}
          </div>
        </header>

        <NavBar activeCity={city.name} isLocating={isLocating} />

        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="card overflow-hidden relative group shadow-2xl border-white/40">
            <div className="p-7 sm:p-9 relative z-[2] pt-10 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black bg-black/5 px-2 py-0.5 rounded">Actueel</span>
                  </div>
                  <h1 className="text-xl font-bold uppercase tracking-widest text-text-secondary mb-2">{city.name}</h1>
                  <div className="flex items-start">
                    <span className="text-8xl sm:text-9xl font-black tracking-tighter leading-none text-text-primary">{weather.current.temperature}</span>
                    <span className="text-4xl sm:text-5xl font-black mt-3 ml-1 text-text-primary leading-none">°</span>
                  </div>
                </div>
                
                <div className="text-8xl sm:text-9xl flex items-center justify-center drop-shadow-2xl animate-float">
                  {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-8">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl font-black text-text-primary">{getWeatherDescription(weather.current.weatherCode)}</span>
                   <span className="text-sm font-bold text-text-secondary bg-black/5 px-2 py-0.5 rounded-full">Voelt als {weather.current.feelsLike}°</span>
                 </div>
              </div>


              <div className="pt-6 border-t border-black/5">
                <p className="font-bold text-lg sm:text-xl text-text-primary leading-[1.4]">
                  {weather.summaryVerdict || getMainCommentary(weather)}
                </p>
                <PietInlineTip weather={weather} />
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6 border-white/40 shadow-xl">
            <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-6 px-1">Korte Termijn</h3>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full aspect-[4/3] rounded-2xl border border-white/60 bg-white/5 backdrop-blur-md flex items-center justify-center">
                    <span className="text-6xl">{getWeatherEmoji(weather.daily[i].weatherCode, true)}</span>
                  </div>
                  <div className="px-1 flex justify-between items-baseline">
                    <span className="text-[11px] font-black uppercase">{i === 0 ? "Vandaag" : "Morgen"}</span>
                    <span className="text-lg font-black">{weather.daily[i].tempMax}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-6 border-white/40 shadow-xl">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 px-1">Activiteiten</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: "bbq", label: "BBQ", score: getBbqScore(weather), emoji: "🍖" },
                { id: "pollen", label: "Hooikoorts", score: getHooikoortsScore(weather), emoji: "🤧" },
                { id: "strand", label: "Strand", score: getStrandScore(weather), emoji: "🏖️" },
                { id: "terras", label: "Terras", score: getTerrasScore(weather), emoji: "🍻" },
                { id: "fietsen", label: "Fietsen", score: getFietsScore(weather).score, emoji: "🚲" },
                { id: "wandelen", label: "Wandelen", score: getWandelScore(weather), emoji: "🥾" },
              ].map((item) => (
                <div key={item.id} className="relative aspect-square rounded-2xl border border-white/60 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center">
                  <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border border-white/10 ${item.score >= 7 ? 'text-accent-green' : item.score >= 5 ? 'text-accent-amber' : 'text-accent-red'}`}>
                    {item.score}
                  </div>
                  <div className="text-5xl mb-1">{item.emoji}</div>
                  <div className="absolute bottom-2 text-[8px] font-black text-text-muted uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-6 border-white/40 shadow-xl">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 px-1">Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">☀️ Zon</span><div className="text-2xl font-black">UV {weather.uvIndex.toFixed(0)}</div></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">🌧️ Regen</span><div className="text-2xl font-black">{weather.current.precipitation} MM</div></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">🌬️ Wind</span><div className="text-2xl font-black">{weather.current.windSpeed}</div><p className="text-[9px] font-black uppercase mt-1">BFT {getWindBeaufort(weather.current.windSpeed).scale}</p></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">🌡️ Gevoel</span><div className="text-2xl font-black">{weather.current.feelsLike}°</div></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">💧 Vocht</span><div className="text-2xl font-black">{weather.current.humidity}%</div></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-text-muted uppercase mb-2">🌍 Klimaat</span><div className="text-2xl font-black">{(() => { const climate = getTemperatureComparison(weather.current.temperature, new Date().getMonth()); return `${climate.diff > 0 ? '+' : ''}${climate.diff}°`; })()}</div></div>
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
                  {[{ k: "temp", i: <Thermometer className="w-3 h-3" /> }, { k: "rain", i: <CloudRain className="w-3 h-3" /> }, { k: "wind", i: <Wind className="w-3 h-3" /> }].map(m => (
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
                      <div className="text-sm font-black">{hourlyMetric === "temp" ? hour.temperature + "°" : hourlyMetric === "rain" ? hour.precipitation.toFixed(1) : hour.windSpeed}</div>
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
