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
import dynamic from "next/dynamic";

// Lazy-load zware visuele componenten — scheelt initial JS
const WeatherBackground = dynamic(() => import("./WeatherBackground"), { ssr: false });
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
    <>
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

      {/* NL Pulse — Dynamische ticker voor alle landelijke meetstations */}
      <div className="min-h-[29px] overflow-hidden">
        <NLPulse />
      </div>

      {/* NavBar — één grote glass-bar in kaartstijl, GPS zit in "Locatie"-pill */}
      <div className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
        <NavBar activeCity={city.name} isLocating={isLocating} />
      </div>

      {/* Email Promo — Prominent direct onder de nav voor maximale conversie */}
      <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <EmailSubscribe city={city} />
      </div>

      {/* ===== 1. Main Weather Card — Kerninformatie ===== */}
      <div className="card overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="p-7 relative z-[2]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-orange mb-1">
                Hyper Fidelity Weather
              </span>
              <h1 className="text-sm font-black text-text-primary flex items-center gap-2">
                {titleOverride || `Weer in ${city.name}`}
                <span className="w-1 h-1 rounded-full bg-text-muted" />
                <span className="font-medium text-text-secondary">{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </h1>
            </div>
            <div className="px-2.5 py-1 rounded bg-black text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
              OFFICIAL
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <div className="flex items-start">
              <span className="text-7xl sm:text-8xl font-black tracking-tighter leading-none font-brand">{weather.current.temperature}</span>
              <span className="text-3xl sm:text-4xl font-black mt-2 font-brand">°C</span>
            </div>
            
            <div className="text-6xl sm:text-7xl leading-none">
              {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
            </div>
          </div>
          
          <div id="piet" className="mt-8 bg-accent-orange/15 border-l-4 border-accent-orange p-4 rounded-r-lg relative overflow-hidden scroll-mt-24">
            <p className="font-semibold text-lg text-text-primary break-words leading-snug relative z-10 mb-3">
              {weather.aiVerdict || getMainCommentary(weather)}
            </p>
            <PietInlineTip weather={weather} />
            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-80">
                📊 {new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} — KNMI bevestigt dit.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
            <span className="badge bg-black/5 border border-black/10 font-normal px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs">
              Voelt als <strong className="ml-1 text-text-primary">{weather.current.feelsLike}°</strong>
            </span>
            <span className="badge bg-black/5 border border-black/10 font-normal px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs">
              {getWeatherDescription(weather.current.weatherCode)}
            </span>
            <span className="badge bg-black/5 border border-black/10 font-normal px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs">
              Vocht <strong className="ml-1 text-text-primary">{weather.current.humidity}%</strong>
            </span>
            {(() => {
              const climate = getTemperatureComparison(weather.current.temperature, new Date().getMonth());
              const isWarm = climate.diff > 0;
              return Math.abs(climate.diff) >= 1 ? (
                <span className={`badge font-normal px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs ${isWarm ? 'bg-orange-100/80 border border-orange-200/60 text-orange-700' : 'bg-blue-100/80 border border-blue-200/60 text-blue-700'}`}>
                  {climate.emoji} {isWarm ? '+' : ''}{climate.diff}° vs normaal
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* ===== 2. Weermodel Verificatie — Waarom dit klopt ===== */}
      {/* ===== 14. Zon & UV — compact ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.18s" }}>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1 text-[9px] sm:text-[10px]">Zonlicht</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🌅</span>
                    <span className="text-xs font-bold text-text-primary truncate">
                      {new Date(weather.sunrise).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🌇</span>
                    <span className="text-xs font-bold text-text-primary truncate">
                      {new Date(weather.sunset).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col border-l border-black/5 pl-4 sm:pl-6">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1 text-[9px] sm:text-[10px]">Zonuren</span>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-accent-orange" />
                  <span className="text-xs font-bold text-text-primary whitespace-nowrap">{weather.daily[0].sunHours} uur</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1 text-right text-[9px] sm:text-[10px]">Straling</span>
              <span className="badge text-[9px] sm:text-[10px] whitespace-nowrap" style={{ backgroundColor: `${uvInfo.color}20`, color: uvInfo.color, border: `1px solid ${uvInfo.color}40` }}>
                UV {weather.uvIndex.toFixed(0)} — {uvInfo.label.split("—")[0].trim()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. Data Bron — Waarom dit klopt ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-accent-cyan" />
              </div>
              <div>
                <div className="text-[11px] font-black text-text-primary uppercase tracking-wider">
                  KNMI HARMONIE LIVE
                </div>
                <div className="text-[10px] text-text-secondary">
                  Gedetailleerde polderdata • 2.5km resolutie
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-accent-green/10 rounded font-bold text-accent-green text-[10px] uppercase tracking-tighter border border-accent-green/20">
              Geverifieerd
            </div>
          </div>
        </div>
      </div>

      {/* Mails & Ads moved below alerts */}

      {/* Mails & Ads moved below alerts */}

      {/* ===== PREMIUM GATE START — alles hieronder is voor Piet/Reed/Steve ===== */}
      <PremiumGate>
      {/* ===== 2. Rain Radar & Komende Uren (Samengevoegd in 1 box) ===== */}
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
                  aria-label={`Toon ${label}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${hourlyMetric === key ? 'bg-white text-text-primary shadow-sm ring-1 ring-black/5' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="horizontal-scroll pb-2">
            {weather.hourly.slice(0, 12).map((hour, idx) => {
              const h = new Date(hour.time).getHours();
              const isNow = idx === 0;
              const maxPrecip = Math.max(...weather.hourly.slice(0, 12).map(hr => hr.precipitation), 1);
              const maxWind = Math.max(...weather.hourly.slice(0, 12).map(hr => hr.windSpeed), 1);
              const rainBarH = Math.max(2, (hour.precipitation / maxPrecip) * 24);
              const windBarH = Math.max(2, (hour.windSpeed / maxWind) * 24);
              const confidenceColor = hour.confidence === "high" ? "bg-accent-green" : hour.confidence === "medium" ? "bg-accent-amber" : "bg-accent-red";
              return (
                <div
                  key={hour.time}
                  className={`border border-black/5 rounded-2xl p-3 flex flex-col items-center justify-between min-w-[70px] gap-1 ${isNow ? 'bg-accent-orange/10 border-accent-orange/30' : 'bg-black/[0.02]'}`}
                >
                  <div className={`text-xs font-semibold ${isNow ? 'text-accent-orange' : 'text-text-secondary'}`}>
                    {isNow ? 'Nu' : `${h.toString().padStart(2, '0')}:00`}
                  </div>
                  <div className="text-2xl my-1">
                    {getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}
                  </div>
                  {hourlyMetric === "temp" && (
                    <div className="text-sm font-bold text-text-primary">{hour.temperature}°</div>
                  )}
                  {hourlyMetric === "rain" && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 flex items-end justify-center" style={{ height: 24 }}>
                        <div className="w-full rounded-t bg-accent-cyan/80" style={{ height: rainBarH }} />
                      </div>
                      <span className="text-[10px] font-bold text-accent-cyan">{hour.precipitation > 0 ? hour.precipitation.toFixed(1) : '0'}</span>
                    </div>
                  )}
                  {hourlyMetric === "wind" && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 flex items-end justify-center" style={{ height: 24 }}>
                        <div className="w-full rounded-t bg-black/20" style={{ height: windBarH }} />
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary">{hour.windSpeed}</span>
                    </div>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full ${confidenceColor}`} title={`Vertrouwen: ${hour.confidence}`} />
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center gap-4 mt-1 px-1">
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-green" /><span className="text-[10px] whitespace-nowrap text-text-muted">Zeker</span></div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-amber" /><span className="text-[10px] whitespace-nowrap text-text-muted">Redelijk</span></div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-red" /><span className="text-[10px] whitespace-nowrap text-text-muted">Onzeker</span></div>
          </div>
        </div>
      </div>


      {/* ===== Extremiteiten-index ===== */}
      {(() => {
        const allHours = weather.hourly;
        const today = weather.daily[0];
        const tomorrow = weather.daily[1];

        // Bereken risico's als 0-3 score
        const thunderHours = allHours.filter(h => h.weatherCode >= 95).length;
        const onweerScore = thunderHours >= 4 ? 3 : thunderHours >= 1 ? 2 : 0;

        const maxPrecip = Math.max(today.precipitationSum, tomorrow.precipitationSum);
        const regenScore = maxPrecip >= 20 ? 3 : maxPrecip >= 8 ? 2 : maxPrecip >= 2 ? 1 : 0;

        const maxWind = Math.max(today.windSpeedMax, tomorrow.windSpeedMax);
        const stormScore = maxWind >= 75 ? 3 : maxWind >= 50 ? 2 : maxWind >= 35 ? 1 : 0;

        const maxTemp = Math.max(today.tempMax, tomorrow.tempMax);
        const minTemp = Math.min(today.tempMin, tomorrow.tempMin);
        const hitteScore = maxTemp >= 35 ? 3 : maxTemp >= 30 ? 2 : maxTemp >= 27 ? 1 : 0;
        const vorstScore = minTemp <= -10 ? 3 : minTemp <= -3 ? 2 : minTemp <= 0 ? 1 : 0;
        const extremeScore = Math.max(hitteScore, vorstScore);

        const uvScore = weather.uvIndex >= 8 ? 3 : weather.uvIndex >= 6 ? 2 : weather.uvIndex >= 4 ? 1 : 0;

        const items = [
          { icon: "⛈️", label: "Onweer", score: onweerScore, detail: thunderHours > 0 ? `${thunderHours}u kans` : "Geen" },
          { icon: "🌧️", label: "Neerslag", score: regenScore, detail: maxPrecip > 0 ? `${maxPrecip.toFixed(0)}mm` : "Droog" },
          { icon: "💨", label: "Storm", score: stormScore, detail: `${maxWind} km/h` },
          { icon: extremeScore === hitteScore && hitteScore > 0 ? "🔥" : "❄️", label: extremeScore === hitteScore && hitteScore > 0 ? "Hitte" : "Vorst", score: extremeScore, detail: extremeScore === hitteScore && hitteScore > 0 ? `${maxTemp}°` : extremeScore > 0 ? `${minTemp}°` : "Geen" },
        ];

        // Alleen tonen als er daadwerkelijk een extremiteit (score >= 1) aanwezig is
        if (items.every(item => item.score === 0)) return null;

        const scoreColor = (s: number) => s === 3 ? "text-accent-red" : s === 2 ? "text-amber-500" : s === 1 ? "text-accent-amber" : "text-text-muted/50";
        const scoreDot = (s: number, i: number) => (
          <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < s ? (s === 3 ? "bg-accent-red" : s === 2 ? "bg-amber-500" : "bg-accent-amber") : "bg-black/10"}`} />
        );

        return (
          <div className="animate-fade-in" style={{ animationDelay: "0.28s" }}>
            <div className="flex justify-between items-end mb-2 px-1">
              <h3 className="section-title">Extremiteiten-index</h3>
              <span className="text-[10px] text-white/60">48 uur vooruit</span>
            </div>
            <div className="card p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {items.map(({ icon, label, score, detail }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <span className="text-xl leading-none">{icon}</span>
                    <div className="flex gap-0.5">{[0,1,2].map(i => scoreDot(score, i))}</div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${scoreColor(score)}`}>{label}</span>
                    <span className="text-[10px] text-text-muted leading-tight">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Extreem Weer Alerts */}
      {(() => {
        type Alert = { icon: string; title: string; detail: string; severity: "orange" | "red" };
        const alerts: Alert[] = [];
        const allHours = weather.hourly;
        const today = weather.daily[0];
        const tomorrow = weather.daily[1];

        const maxWindHour = allHours.reduce((max, h) => h.windSpeed > max.windSpeed ? h : max, allHours[0]);
        if (maxWindHour.windSpeed >= 75) {
          const t = new Date(maxWindHour.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "🌪️", title: "Stormachtig", detail: `Windstoten tot ${maxWindHour.windSpeed} km/h verwacht rond ${t}.`, severity: "red" });
        } else if (maxWindHour.windSpeed >= 50) {
          const t = new Date(maxWindHour.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "💨", title: "Krachtige wind", detail: `Wind tot ${maxWindHour.windSpeed} km/h rond ${t}. Fietsen wordt avontuurlijk.`, severity: "orange" });
        }

        if (today.tempMax >= 35 || tomorrow.tempMax >= 35) {
          const day = today.tempMax >= 35 ? "vandaag" : "morgen";
          const temp = today.tempMax >= 35 ? today.tempMax : tomorrow.tempMax;
          alerts.push({ icon: "🔥", title: "Extreme hitte", detail: `${temp}° verwacht ${day}. Blijf hydrateren. Serieus.`, severity: "red" });
        } else if (today.tempMax >= 30 || tomorrow.tempMax >= 30) {
          const day = today.tempMax >= 30 ? "vandaag" : "morgen";
          const temp = today.tempMax >= 30 ? today.tempMax : tomorrow.tempMax;
          alerts.push({ icon: "☀️", title: "Tropisch warm", detail: `${temp}° verwacht ${day}. Smeer je in en zoek schaduw.`, severity: "orange" });
        }

        if (today.tempMin <= -10 || tomorrow.tempMin <= -10) {
          alerts.push({ icon: "🥶", title: "Strenge vorst", detail: `Tot ${Math.min(today.tempMin, tomorrow.tempMin)}°. Alles bevriest. Leidingen beschermen.`, severity: "red" });
        } else if (today.tempMin <= -5 || tomorrow.tempMin <= -5) {
          alerts.push({ icon: "❄️", title: "Vorst", detail: `Minimaal ${Math.min(today.tempMin, tomorrow.tempMin)}°. Gladheid op de weg.`, severity: "orange" });
        }

        const thunderHours = allHours.filter(h => h.weatherCode >= 95);
        if (thunderHours.length > 0) {
          const firstT = new Date(thunderHours[0].time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "⛈️", title: "Onweer verwacht", detail: `Onweer mogelijk vanaf ${firstT}. Blijf uit de buurt van open water en bomen.`, severity: thunderHours.length > 3 ? "red" : "orange" });
        }

        if (today.precipitationSum >= 25 || tomorrow.precipitationSum >= 25) {
          const day = today.precipitationSum >= 25 ? "vandaag" : "morgen";
          const mm = today.precipitationSum >= 25 ? today.precipitationSum : tomorrow.precipitationSum;
          alerts.push({ icon: "🌊", title: "Zware neerslag", detail: `${mm}mm verwacht ${day}. Wateroverlast mogelijk.`, severity: "red" });
        } else if (today.precipitationSum >= 15 || tomorrow.precipitationSum >= 15) {
          const day = today.precipitationSum >= 15 ? "vandaag" : "morgen";
          const mm = today.precipitationSum >= 15 ? today.precipitationSum : tomorrow.precipitationSum;
          alerts.push({ icon: "🌧️", title: "Veel regen", detail: `${mm}mm verwacht ${day}. Paraplu is niet optioneel.`, severity: "orange" });
        }

        const snowHours = allHours.filter(h => h.weatherCode >= 71 && h.weatherCode <= 77);
        if (snowHours.length > 0) {
          alerts.push({ icon: "🌨️", title: "Sneeuw verwacht", detail: `Sneeuw in de komende 48 uur. Pas op voor gladheid.`, severity: "orange" });
        }

        const fogHours = allHours.filter(h => h.weatherCode >= 45 && h.weatherCode <= 48);
        if (fogHours.length >= 3) {
          alerts.push({ icon: "🌫️", title: "Aanhoudende mist", detail: `Mist verwacht de komende uren. Zicht sterk verminderd. Rij voorzichtig.`, severity: "orange" });
        }

        if (weather.uvIndex >= 8) {
          alerts.push({ icon: "☀️", title: "Extreme UV-straling", detail: `UV-index ${weather.uvIndex.toFixed(1)}. Binnenblijven tussen 12:00–15:00 of SPF50+. Geen discussie.`, severity: "red" });
        } else if (weather.uvIndex >= 6) {
          alerts.push({ icon: "🧴", title: "Hoge UV-straling", detail: `UV-index ${weather.uvIndex.toFixed(1)}. Insmeren verplicht. Elke 2 uur opnieuw.`, severity: "orange" });
        }

        const iceRisk = allHours.some(h => h.precipitation > 0 && h.temperature <= 0);
        if (iceRisk) {
          alerts.push({ icon: "🧊", title: "IJzel mogelijk", detail: `Regen bij vriestemperatuur. Extreem glad op de weg. Blijf thuis als het kan.`, severity: "red" });
        }

        if (alerts.length === 0) {
          // Lege Reed-sectie zodat #reed anchor altijd bestaat en de navbar-knop werkt
          return (
            <div id="reed" className="animate-fade-in scroll-mt-24" style={{ animationDelay: "0.3s" }}>
              <div className="card p-4 flex items-center gap-3 border border-green-500/30 bg-green-50/70">
                <div className="text-2xl shrink-0">✅</div>
                <div>
                  <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Reed — geen extremen</p>
                  <p className="text-sm text-text-primary mt-0.5">Geen storm, onweer, hitte of vorst op komst. Rustig weekje.</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div id="reed" className="animate-fade-in space-y-2 scroll-mt-24" style={{ animationDelay: "0.3s" }}>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`card p-4 flex items-start gap-3 border ${
                  alert.severity === "red"
                    ? "border-accent-red/40 bg-red-50/80"
                    : "border-accent-amber/40 bg-amber-50/80"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  alert.severity === "red" ? "bg-accent-red/15" : "bg-accent-amber/15"
                }`}>
                  {alert.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${
                      alert.severity === "red" ? "text-accent-red" : "text-accent-amber"
                    }`} />
                    <span className={`text-[10px] xs:text-xs font-bold uppercase tracking-wider ${
                      alert.severity === "red" ? "text-accent-red" : "text-amber-600"
                    }`}>
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary mt-1 break-words leading-normal">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}


      {/* ===== AdSense Top ===== */}
      {AD_SLOT_TOP && (
        <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <AdSlot slot={AD_SLOT_TOP} format="auto" responsive minHeight={280} />
        </div>
      )}

      {/* ===== Affiliate Spot 1 — prominent boven de vouw ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div
          className="rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-accent-orange/40"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,180,0,0.18) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-full mb-1">
                Vandaag nodig in {city.name}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-text-primary leading-tight">
                Het weer zegt: nú kopen
              </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">
              Amazon · affiliate
            </span>
          </div>
          <AffiliateCard weather={weather} />
        </div>
      </div>



      {/* ===== TEMU MOBILE SNIPER — Alleen bij warm/mooi weer (Impulskoopjes) ===== */}
      {weather.current.temperature > 15 && weather.current.precipitation < 1 && (
        <div className="animate-fade-in sm:hidden" style={{ animationDelay: "0.25s" }}>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg border border-orange-400/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <span className="text-4xl">🎁</span>
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Temu Daily Steal</span>
              <h3 className="text-white font-black text-lg leading-tight mt-1">
                {weather.current.temperature > 22 ? "Blijf koel voor een prikkie" : "Handig bij dit weer"}
              </h3>
              <p className="text-white/90 text-xs mt-1">Check de laatste hebbedingen voor vandaag. OP = OP.</p>
              <a 
                href={temuUrl(weather.current.temperature > 20 ? "mini fan usb cooling" : "portable gadget summer")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 bg-white text-orange-600 font-bold text-xs px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform"
              >
                Bekijk aanbiedingen →
              </a>
            </div>
          </div>
        </div>
      )}
      <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Vandaag & Morgen</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="card p-4 border border-accent-orange flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-accent-orange text-[13px] sm:text-base">Vandaag</span>
              <span className="text-xl shrink-0">{getWeatherEmoji(weather.daily[0].weatherCode)}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-3xl font-bold">{weather.daily[0].tempMax}°</span>
              <span className="text-sm text-text-muted">{weather.daily[0].tempMin}°</span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              {weather.daily[0].precipitationSum > 0 ? `${weather.daily[0].precipitationSum}mm regen verwacht` : 'Geen regen verwacht'}
              <br />
              💨 Max {weather.daily[0].windSpeedMax} km/h
            </div>
          </div>
          
          <div className="card p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-text-primary text-[13px] sm:text-base">Morgen</span>
              <span className="text-xl shrink-0">{getWeatherEmoji(weather.daily[1].weatherCode)}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-3xl font-bold">{weather.daily[1].tempMax}°</span>
              <span className="text-sm text-text-muted">{weather.daily[1].tempMin}°</span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              {weather.daily[1].precipitationSum > 0 ? `${weather.daily[1].precipitationSum}mm regen verwacht` : 'Geen regen verwacht'}
              <br />
              💨 Max {weather.daily[1].windSpeedMax} km/h
            </div>
          </div>
        </div>
      </div>

      {/* ===== AdSense Mid ===== */}
      {AD_SLOT_MID && (
        <div className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <AdSlot slot={AD_SLOT_MID} format="auto" responsive minHeight={250} />
        </div>
      )}

      {/* ===== 7. Misère-Score ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Misère-Score</h3>
          <span className="text-xs text-white/60">Hoe beroerd is het écht?</span>
        </div>
        <div className="card p-6 overflow-hidden relative">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-accent-green leading-none">{misereScore}</span>
              <span className="text-xl font-bold text-text-muted">/ 10</span>
            </div>
            <div className="text-6xl leading-none">{misereEmoji}</div>
          </div>
          
          <div className="score-bar mt-6">
            <div 
              className="score-bar-fill"
              style={{ 
                width: `${misereScore * 10}%`,
                background: misereScore > 7 ? 'var(--accent-red)' : misereScore > 4 ? 'var(--accent-amber)' : 'var(--accent-green)'
              }}
            />
          </div>
          
          <p className="mt-4 font-semibold text-text-primary">{misereLabel}</p>
        </div>
      </div>

      {/* ===== 8. Activiteiten-Weer (Fiets & Wandel) ===== */}
      {(() => {
        // Wandelen is minder windgevoelig dan fietsen
        const wandelScore = Math.min(10, Math.max(0, fietsScore + (weather.current.windSpeed > 25 ? 2 : 0) - (weather.current.precipitation > 0.5 ? 1 : 0)));
        const avgScore = Math.round((fietsScore + wandelScore) / 2);
        
        return (
          <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex justify-between items-end mb-3 px-1">
              <h3 className="section-title">Activiteiten-Weer</h3>
              <span className="text-xs text-white/60">Fietsen & Wandelen</span>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                  <div className="w-14 h-14 bg-accent-orange/10 border-4 border-white rounded-full flex items-center justify-center text-2xl shadow-sm relative z-10">🚴</div>
                  <div className="w-14 h-14 bg-accent-cyan/10 border-4 border-white rounded-full flex items-center justify-center text-2xl shadow-sm relative z-0">🥾</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-primary">Buitenindex</span>
                    <span className="text-xl font-black text-text-primary">{avgScore}<span className="text-xs text-text-muted ml-0.5">/10</span></span>
                  </div>
                  <div className="score-bar h-2.5">
                    <div 
                      className="score-bar-fill"
                      style={{ 
                        width: `${avgScore * 10}%`,
                        background: avgScore > 7 ? 'var(--accent-green)' : avgScore > 4 ? 'var(--accent-amber)' : 'var(--accent-red)'
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium leading-snug">
                {avgScore >= 8 ? "Perfecte dag voor een tocht. Geen smoesjes, trek die schoenen aan." :
                 avgScore >= 5 ? `Prima te doen. ${weather.current.windSpeed > 25 ? 'Lekker uitwaaien, met de wind in de rug.' : 'Lekker buitenmomentje.'}` :
                 "Niet ideaal. Korte wandeling kan, maar laat die fietstocht maar zitten."}
              </p>
            </div>
          </div>
        );
      })()}


      {/* ===== 10. Detail Grid — wind, vocht, neerslag, temp ===== */}
      <div className="grid grid-cols-2 xs:grid-cols-2 gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        {/* Voelt Als */}
        <div className="card p-3 sm:p-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-amber text-base shrink-0">🌡️</span>
            <span className="sm:hidden">Gevoels°</span>
            <span className="hidden sm:inline">Gevoelstemperatuur</span>
          </div>
          <div className="text-3xl font-bold flex items-start">
            {weather.current.feelsLike}<span className="text-lg mt-1">°</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.feelsLike < weather.current.temperature ? "Voelt kouder dan het is" : 
             weather.current.feelsLike > weather.current.temperature ? "Voelt warmer dan het is" : 
             "Precies wat het is"}
          </div>
        </div>
        
        {/* Luchtvochtigheid */}
        <div className="card p-3 sm:p-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base shrink-0">💧</span>
            <span className="sm:hidden">Vochtigheid</span>
            <span className="hidden sm:inline">Luchtvochtigheid</span>
          </div>
          <div className="text-3xl font-bold flex items-start">
            {weather.current.humidity}<span className="text-lg mt-1">%</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.humidity > 80 ? "Klam en benauwd" : 
             weather.current.humidity < 40 ? "Lekker droog" : 
             "Normaal Nederlands zweetweer"}
          </div>
        </div>
        
        {/* Wind */}
        <div className="card p-3 sm:p-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base shrink-0">🌬️</span>
            <span>Wind Bft {getWindBeaufort(weather.current.windSpeed).scale}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{weather.current.windSpeed}</span>
            <span className="text-sm font-bold text-text-primary">km/h</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            {weather.current.windDirection} • Stoten {weather.current.windGusts} km/h
          </div>
          <div className="text-xs font-medium text-text-secondary mt-2 italic">
            {getWindComment(weather.current.windSpeed, weather.current.windGusts)}
          </div>
        </div>
        
        {/* Neerslag */}
        <div className="card p-3 sm:p-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base shrink-0">🌧️</span> Neerslag
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{weather.current.precipitation}</span>
            <span className="text-sm font-bold text-text-primary">mm</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.precipitation > 0 ? "Gewoon nat 💧" : "Droog 👍"}
          </div>
        </div>
      </div>


      {/* Affiliate Spot 1 moved to top */}


      </PremiumGate>
      {/* ===== PREMIUM GATE END ===== */}

      {/* ===== Affiliate Spot 2 — onderaan ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <div
          className="rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-accent-orange/40"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,180,0,0.18) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-full mb-1">
                Amazon-tip
              </span>
              <h3 className="text-lg sm:text-xl font-black text-text-primary leading-tight">
                {weather.current.precipitation > 0 || weather.daily[0].precipitationSum > 5
                  ? "Voor als je straks de deur uit moet"
                  : "Dit weer vraagt erom"}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">
              affiliate
            </span>
          </div>
          <AffiliateCard weather={weather} />
        </div>
      </div>

      {/* ===== AdSense Bottom ===== */}
      {AD_SLOT_BOTTOM && (
        <div className="animate-fade-in" style={{ animationDelay: "0.92s" }}>
          <AdSlot slot={AD_SLOT_BOTTOM} format="auto" responsive minHeight={100} />
        </div>
      )}

      {/* ===== 18. E-mail Weerrapport (Moved to top) ===== */}

      {/* ===== 20. Dual Viral Sharing — Merk vs Data ===== */}
      <div className="animate-fade-in space-y-4" style={{ animationDelay: "0.95s" }}>
        <div className="flex gap-3 px-1">
          <button 
            onClick={async () => {
              if (typeof navigator.share !== 'undefined') {
                await navigator.share({
                  title: `WEERZONE | 48 uur vooruit. De rest is ruis.`,
                  text: `Check WEERZONE.nl 🌪️ Puur KNMI HARMONIE data op de vierkante meter. 🚀`,
                  url: "https://weerzone.nl"
                });
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#3ABEFF] hover:bg-[#2da9e6] text-slate-900 font-black text-[11px] rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
          >
            <Users className="w-3.5 h-3.5" /> Deel WEERZONE
          </button>
          <button 
            onClick={async () => {
              if (typeof navigator.share !== 'undefined') {
                await navigator.share({
                  title: `WEERZONE | Weer in ${city.name}`,
                  text: `${getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)} ${weather.current.temperature}° in ${city.name} — "KNMI bevestigt dit."\n\n48 uur vooruit. De rest is ruis. 🌪️`,
                  url: window.location.href
                });
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FFB400] hover:bg-[#e6a200] text-slate-950 font-black text-[11px] rounded-2xl shadow-lg shadow-yellow-500/10 transition-all active:scale-95 uppercase tracking-wider"
          >
            <Send className="w-3.5 h-3.5" /> Deel Weerbericht
          </button>
        </div>
      </div>

      {/* ===== 12. Populaire Thema's (SEO Booster) ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Populair op WeerZone</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { slug: "bbq-weer", icon: "🔥", label: "BBQ Weer" },
            { slug: "strandweer", icon: "🏖️", label: "Strandweer" },
            { slug: "hooikoorts", icon: "🤧", label: "Hooikoorts" },
            { slug: "hardloopweer", icon: "🏃", label: "Hardlopen" },
          ].map((theme) => (
            <a
              key={theme.slug}
              href={`/weer/themas/${theme.slug}`}
              className="card p-4 flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl">{theme.icon}</span>
              <span className="text-sm font-bold text-text-primary">{theme.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ===== 13. Provincie Navigator (SEO Power) ===== */}
      <div className="animate-fade-in mt-10" style={{ animationDelay: "1s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Alle Regio's</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Groningen", "Friesland", "Drenthe", "Overijssel", "Flevoland", "Gelderland", 
            "Utrecht", "Noord-Holland", "Zuid-Holland", "Zeeland", "Noord-Brabant", "Limburg"
          ].map((prov) => (
            <a
              key={prov}
              href={`/weer/${prov.toLowerCase().replace(" ", "-")}`}
              className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-[11px] font-bold text-text-secondary transition-colors"
            >
              {prov}
            </a>
          ))}
        </div>
      </div>

      {beforeFooter}

      <AmazonStickyBar weather={weather} />

      {/* ===== Footer ===== */}
      <footer className="pt-12 pb-4 text-center animate-fade-in" style={{ animationDelay: "1.0s" }}>
        <p className="text-[12px] text-white font-black uppercase tracking-[0.2em]">
          48 uur vooruit. De rest is ruis.
        </p>
        <p className="text-[10px] text-white/40 mt-2">
          Harde data via <a href="https://open-meteo.com" className="text-accent-orange hover:underline">Open-Meteo</a> & KNMI HARMONIE.
        </p>
        <div className="mt-8 pt-6 border-t border-white/10 opacity-100">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            POWERED BY TIVEAU & KNMI
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
