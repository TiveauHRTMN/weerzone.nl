"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Sun, Users } from "lucide-react";
import { LogoFull } from "./Logo";
import PersonaBadge from "./PersonaBadge";
import PremiumGate from "./PremiumGate";
import { useSession } from "@/lib/session-context";
import LoadingScreen from "./LoadingScreen";
import { loadWeather } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData } from "@/lib/types";
import {
  getMainCommentary,
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
import { temuUrl } from "@/lib/affiliates";
import EmailSubscribe from "./EmailSubscribe";
import NavBar from "./NavBar";
import AdSlot from "./AdSlot";
import NLPulse from "./NLPulse";
import LeadRescue from "./LeadRescue";
import Footer from "./Footer";
import NeuralInsights from "./NeuralInsights";
import { getNeuralInsights } from "@/lib/weather";
import dynamic from "next/dynamic";

// Lazy-load zware visuele componenten — scheelt initial JS
const WeatherBackground = dynamic(() => import("./WeatherBackground"));
const RainRadar = dynamic(() => import("./RainRadar"), {
  ssr: false,
  loading: () => <div className="card p-4 text-center text-xs text-text-secondary">Radar laadt…</div>,
});

// AdSense ad slot IDs — vul deze via env vars in Vercel
// NEXT_PUBLIC_ADSENSE_SLOT_TOP / _MID / _BOTTOM
// AdSense nog niet goedgekeurd → fallback leeg zodat AdSlot null rendert.
const AD_SLOT_TOP = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || "";
const AD_SLOT_MID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID || "";
const AD_SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || "";

interface DashboardProps {
  initialCity?: City;
  initialWeather?: WeatherData;
  /** Optionele content die nét vóór de footer gerenderd wordt (bijv. HomePitch op /). */
  beforeFooter?: React.ReactNode;
  /** Optionele H1 override voor SEO (ninja-style) */
  titleOverride?: string;
}

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Support custom GPS-based cities (have lat/lon stored)
      if (parsed.name && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
      }
      return DUTCH_CITIES.find(c => c.name === parsed.name) || null;
    }
  } catch {}
  return null;
}

export default function WeatherDashboard({ initialCity, initialWeather, beforeFooter, titleOverride }: DashboardProps = {}) {
  const [city, setCity] = useState<City>(initialCity || getSavedCity() || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [loading, setLoading] = useState(!initialWeather);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");

  const handleShare = async () => {
    if (typeof navigator.share !== 'undefined') {
      try {
        const text = `Check WEERZONE.nl 🌪️ 48 uur vooruit. De rest is ruis. Eindelijk weer-data die wel klopt. Piet en Reed houden je scherp. 🚀`;
        await navigator.share({
          title: `WEERZONE | 48 uur vooruit. De rest is ruis.`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share skipped/failed", err);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Cache-first: als we dit al hebben binnen TTL → instant render
      const data = await loadWeather(
        city.lat,
        city.lon,
        (verdict) => {
          if (!cancelled) setWeather((prev) => (prev ? { ...prev, aiVerdict: verdict } : prev));
        },
        (fresh) => {
          if (!cancelled) setWeather(fresh);
        },
        (neural) => {
          if (!cancelled) setWeather((prev) => (prev ? { ...prev, neuralData: neural } : prev));
        }
      );
      if (!cancelled) {
        setWeather(data);
        setLoading(false);
      }
    }
    setLoading(true);
    load();
    const interval = setInterval(load, 10 * 60000); // 10 min refresh
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [city]);

  const [isLocating, setIsLocating] = useState(false);

  const { tier } = useSession();

  const handleLocationClick = () => {
    // GPS is een betaalde feature — non-subs krijgen de persona-modal.
    if (!tier) {
      window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
      return;
    }
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Start weer-fetch METEEN met coördinaten — reverseGeocode mag
        // parallel lopen en update de naam zodra hij binnen is.
        const provisional: City = { name: "Jouw locatie", lat, lon };
        setCity(provisional);
        localStorage.setItem("wz_city", JSON.stringify(provisional));
        setIsLocating(false);

        // Naam ophalen op de achtergrond — blokkeert niks.
        reverseGeocode(lat, lon)
          .then((geoCity) => {
            setCity(geoCity);
            localStorage.setItem("wz_city", JSON.stringify(geoCity));
          })
          .catch(() => { /* provisional naam blijft staan — geen drama */ });
      },
      (err) => {
        console.error("GPS Error:", err);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60 * 60 * 1000,
      }
    );
  };

  // Persist city choice
  useEffect(() => {
    localStorage.setItem("wz_city", JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }));
  }, [city]);

  // Navbar "Locatie"-knop vuurt dit event af
  const locateRef = useRef(handleLocationClick);
  locateRef.current = handleLocationClick;
  useEffect(() => {
    const fn = () => locateRef.current();
    window.addEventListener("wz:locate", fn);
    return () => window.removeEventListener("wz:locate", fn);
  }, []);

  if (loading || !weather) {
    return <LoadingScreen />;
  }

  const { score: misereScore, label: misereLabel, emoji: misereEmoji } = getMisereScore(weather);
  const { score: fietsScore, label: fietsLabel } = getFietsScore(weather);
  const { emoji: outfitEmoji, advice: outfitAdvice } = getOutfitAdvice(weather);
  const uvInfo = getUvLabel(weather.uvIndex);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6" style={{ isolation: "isolate" }}>
      {/* Header — puur logo, groot en prominent bovenaan */}
      <header className="animate-fade-in flex flex-col items-center mb-8 sm:mb-10 pt-2">
        <div className="relative flex items-center justify-center">
          <LogoFull height={72} className="drop-shadow-[0_2px_16px_rgba(0,0,0,0.18)] sm:hidden max-w-full h-auto" />
          <LogoFull height={112} className="drop-shadow-[0_2px_16px_rgba(0,0,0,0.18)] hidden sm:block" />
          {tier && <PersonaBadge tier={tier} />}
        </div>
      </header>

      {/* NavBar — één grote glass-bar in kaartstijl */}
      <NavBar activeCity={city.name} isLocating={isLocating} />

      {/* NL Pulse — Perfectly aligned with boxes */}
      <NLPulse />

      {/* EMERGENCY ALERTS SECTION (Always visible if serious) */}
      {(weather.current.windGusts > 75 || weather.uvIndex > 7 || weather.current.precipitation > 5) && (
        <a 
          href="https://www.knmi.nl/nederland-nu/weer/waarschuwingen" 
          target="_blank"
          className="card p-4 border-accent-red/30 bg-accent-red/5 flex items-center gap-4 group animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center text-white shrink-0">
             <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-accent-red uppercase tracking-widest">Actuele Waarschuwing</h4>
            <p className="text-[11px] font-bold text-text-primary mt-0.5">
              {weather.current.windGusts > 75 ? "Zware windstoten gedetecteerd. " : ""}
              {weather.uvIndex > 7 ? "Extreme zonkracht (UV 8+). " : ""}
              {weather.current.precipitation > 5 ? "Hevige neerslag verwacht. " : ""}
              Check KNMI voor details →
            </p>
          </div>
        </a>
      )}

      {/* ===== MAIN DASHBOARD CONTENT — Unified Gap-6 Spacing ===== */}
      <div className="flex flex-col gap-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        
        {/* HERO SECTION */}
        <div className="card overflow-hidden relative group shadow-2xl border-white/40">
        <div className="absolute top-0 left-0 w-full h-40 sm:h-48 overflow-hidden z-[1] bg-white/5 backdrop-blur-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/four-seasons.png" 
            alt="Vier seizoenen" 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10" />
        </div>

        <div className="p-7 sm:p-9 relative z-[2] pt-32 sm:pt-40">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {city.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-25"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
                Actueel
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex flex-col">
              <div className="flex items-start">
                <span className="text-8xl sm:text-9xl font-black tracking-tighter leading-none text-text-primary drop-shadow-xl">{weather.current.temperature}</span>
                <span className="text-4xl sm:text-5xl font-black mt-3 ml-1 text-text-primary leading-none">°</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                 <span className="text-xl font-black text-text-primary">{getWeatherDescription(weather.current.weatherCode)}</span>
                 <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                 <span className="text-base font-bold text-text-secondary">Voelt als {weather.current.feelsLike}°</span>
              </div>
            </div>
            
            <div className="text-8xl sm:text-9xl leading-none drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-default">
              {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
            </div>
          </div>
          
          {/* Intelligence Briefing — Integrated directly in Hero card */}
          <div className="mt-8 pt-6 border-t border-black/5">
            <p className="font-bold text-lg sm:text-xl text-text-primary leading-[1.4] mb-4">
              {weather.aiVerdict || getMainCommentary(weather)}
            </p>
            <PietInlineTip weather={weather} />
          </div>
          
        </div>
      </div>

      <NeuralInsights weather={weather} tier={tier} />

      
      {/* ===== 1. FORECAST CLUSTER — Today & Tomorrow ===== */}
      <div className="card p-4 sm:p-6 border-white/40 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-6 relative z-10 px-1">
          <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">Korte Termijn</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Vandaag */}
          <div className="flex flex-col gap-3 group/item">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/60 shadow-lg bg-white/5 backdrop-blur-md transition-transform hover:scale-[1.02] flex items-center justify-center">
              <span className="text-6xl drop-shadow-2xl">{getWeatherEmoji(weather.daily[0].weatherCode, true)}</span>
            </div>
            <div className="px-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-black text-text-primary uppercase">Vandaag</span>
                <span className="text-lg font-black text-text-primary">{weather.daily[0].tempMax}°</span>
              </div>
              <p className="text-[10px] font-black text-text-secondary uppercase mt-0.5">{getWeatherDescription(weather.daily[0].weatherCode)}</p>
            </div>
          </div>

          {/* Morgen */}
          <div className="flex flex-col gap-3 group/item">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/60 shadow-lg bg-white/5 backdrop-blur-md transition-transform hover:scale-[1.02] flex items-center justify-center">
              <span className="text-6xl drop-shadow-2xl">{getWeatherEmoji(weather.daily[1].weatherCode, true)}</span>
            </div>
            <div className="px-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-black text-text-primary uppercase">Morgen</span>
                <span className="text-lg font-black text-text-primary">{weather.daily[1].tempMax}°</span>
              </div>
              <p className="text-[10px] font-black text-text-secondary uppercase mt-0.5">{getWeatherDescription(weather.daily[1].weatherCode)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. LIFESTYLE CLUSTER — Scores (BBQ, Hooikoorts, etc.) ===== */}
      <div className="card p-4 sm:p-6 border-white/40 shadow-xl">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Activiteiten & Scores</h3>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
             <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Optimale Match</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { id: "bbq", label: "BBQ Weer", score: getBbqScore(weather), emoji: "🍖" },
            { id: "pollen", label: "Hooikoorts", score: getHooikoortsScore(weather), emoji: "🤧" },
            { id: "strand", label: "Strand", score: getStrandScore(weather), emoji: "🏖️" },
            { id: "terras", label: "Terrasje", score: getTerrasScore(weather), emoji: "🍻" },
            { id: "fietsen", label: "Fietsen", score: getFietsScore(weather).score, emoji: "🚲" },
            { id: "wandelen", label: "Wandelen", score: getWandelScore(weather), emoji: "🥾" },
          ].map((item) => (
            <div key={item.id} className="relative aspect-square rounded-2xl border border-white/60 bg-white/5 backdrop-blur-md transition-all hover:scale-105 shadow-xl flex flex-col items-center justify-center group/score">
              {/* Score Badge — Top Right */}
              <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border border-white/20 shadow-inner ${
                item.score >= 7 ? 'bg-accent-green/20 text-accent-green' : 
                item.score >= 5 ? 'bg-accent-amber/20 text-accent-amber' : 
                'bg-accent-red/20 text-accent-red'
              }`}>
                {item.score}
              </div>
              
              {/* Emoji — Centered */}
              <div className="text-5xl mb-1 drop-shadow-lg">
                {item.emoji}
              </div>
              
              {/* Label — Bottom */}
              <div className="absolute bottom-2 left-0 w-full text-center">
                <span className="text-[8px] font-black text-text-muted uppercase tracking-wider opacity-80">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3. ATMOSPHERE CLUSTER — Metrics (UV, Wind, Regen, etc.) ===== */}
      <div className="card p-4 sm:p-6 border-white/40 shadow-xl">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Atmosferische Details</h3>
          <span className="text-[9px] font-bold text-text-muted opacity-40 uppercase">Real-time KNMI Sensors</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
          {/* UV Card */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase mb-2">☀️ UV & Zon</span>
            <div className="text-2xl font-black text-text-primary">UV {weather.uvIndex.toFixed(0)}</div>
            <p className="text-[9px] font-bold text-text-muted uppercase mt-1">Huidig Risico</p>
          </div>
          
          {/* Regen Card */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase mb-2">🌧️ Neerslag</span>
            <div className="text-2xl font-black text-text-primary">{weather.current.precipitation} <span className="text-xs">MM</span></div>
            <p className="text-[9px] font-bold text-text-muted uppercase mt-1">{weather.current.precipitation > 0 ? 'Actieve Neerslag' : 'Geen Regen'}</p>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-primary uppercase mb-2">🌬️ Wind</span>
            <div className="text-2xl font-black text-text-primary">{weather.current.windSpeed} <span className="text-xs">KM/H</span></div>
            <p className="text-[9px] font-black text-text-secondary uppercase mt-1">BFT {getWindBeaufort(weather.current.windSpeed).scale} · {weather.current.windDirection}</p>
          </div>

          {/* Gevoel Card */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-primary uppercase mb-2">🌡️ Gevoel</span>
            <div className="text-2xl font-black text-text-primary">{weather.current.feelsLike}°</div>
            <p className="text-[9px] font-black text-text-secondary uppercase mt-1">Lucht {weather.current.temperature}°</p>
          </div>

          {/* Vocht Card */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase mb-2">💧 Vocht</span>
            <div className="text-2xl font-black text-text-primary">{weather.current.humidity}%</div>
            <p className="text-[9px] font-bold text-text-muted uppercase mt-1">Luchtvochtigheid</p>
          </div>

          {/* Klimaat Card */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase mb-2">🌍 Klimaat</span>
            <div className="text-2xl font-black text-text-primary">
              {(() => {
                const climate = getTemperatureComparison(weather.current.temperature, new Date().getMonth());
                return `${climate.diff > 0 ? '+' : ''}${climate.diff}°`;
              })()}
            </div>
            <p className="text-[9px] font-bold text-text-muted uppercase mt-1">vs Maandgemiddelde</p>
          </div>
        </div>
      </div>

      </div>

      {/* Email Promo — Moved below weather core */}
      <div className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <EmailSubscribe city={city} />
      </div>

      {/* ===== PAPERCLIP: Hyper-Local Affiliate Injection ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <AffiliateCard weather={weather} placeName={city.name} />
      </div>

      {/* ===== PREMIUM GATE START ===== */}
      <PremiumGate>
      {/* Rain Radar & Hourly moved here */}
      <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        {weather.minutely && weather.minutely.length > 0 && (
          <div className="mb-6 pb-6 border-b border-black/5">
            <RainRadar data={weather.minutely} />
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Komende Uren</h3>
            <div className="flex items-center gap-1 bg-black/5 rounded-full p-0.5 border border-black/5">
              {([
                { key: "temp" as const, icon: <Thermometer className="w-3 h-3" />, label: "°C" },
                { key: "rain" as const, icon: <CloudRain className="w-3 h-3" />, label: "mm" },
                { key: "wind" as const, icon: <Wind className="w-3 h-3" />, label: "km/h" },
              ]).map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setHourlyMetric(key)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${hourlyMetric === key ? 'bg-white text-text-primary shadow-sm ring-1 ring-black/5' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="horizontal-scroll no-scrollbar py-2 -mx-2 px-2">
            {weather.hourly.slice(0, 16).map((hour, idx) => {
              const h = new Date(hour.time).getHours();
              const isNow = idx === 0;
              const maxPrecip = Math.max(...weather.hourly.slice(0, 16).map(hr => hr.precipitation), 1);
              const confidenceColor = hour.confidence === "high" ? "bg-accent-green" : hour.confidence === "medium" ? "bg-accent-amber" : "bg-accent-red";
              
              return (
                <div
                  key={hour.time}
                  className={`border rounded-2xl p-3 flex flex-col items-center justify-between min-w-[76px] h-[120px] transition-all hover:scale-105 active:scale-95 ${isNow ? 'bg-accent-orange/10 border-accent-orange/40' : 'bg-black/[0.03] border-black/5'}`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-wider ${isNow ? 'text-accent-orange' : 'text-text-muted'}`}>
                    {isNow ? 'Nu' : `${h.toString().padStart(2, '0')}:00`}
                  </div>
                  <div className="text-3xl drop-shadow-sm">
                    {getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}
                  </div>
                  
                  {hourlyMetric === "temp" && <span className="text-sm font-black text-text-primary leading-none">{hour.temperature}°</span>}
                  {hourlyMetric === "rain" && <span className="text-[10px] font-black text-accent-cyan leading-none">{hour.precipitation.toFixed(1)}</span>}
                  {hourlyMetric === "wind" && <span className="text-[10px] font-black text-text-primary leading-none">{hour.windSpeed}</span>}

                  <div className="w-full h-1 bg-black/5 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${confidenceColor}`} style={{ width: hour.confidence === "high" ? "100%" : hour.confidence === "medium" ? "60%" : "30%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </PremiumGate>

      <Footer />
      <AmazonStickyBar weather={weather} />
      </div>
    </div>
  );
}
