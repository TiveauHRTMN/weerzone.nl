"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle } from "lucide-react";
import { LogoFull } from "./Logo";
import LoadingScreen from "./LoadingScreen";
import { getWeather } from "@/app/actions";
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
import WeatherBackground from "./WeatherBackground";
import AffiliateCard from "./AffiliateCard";
import EmailSubscribe from "./EmailSubscribe";
import RainRadar from "./RainRadar";

interface DashboardProps {
  initialCity?: City;
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

export default function WeatherDashboard({ initialCity }: DashboardProps = {}) {
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "Alkmaar") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");

  const handleShare = async () => {
    if (typeof navigator.share !== 'undefined') {
      try {
        const text = `🌧️ ${weather?.current.temperature}° in ${city.name} — ${weather?.aiVerdict || getMainCommentary(weather!)}\n\nweerzone.nl — 48 uur. De rest is ruis.`;
        await navigator.share({
          title: `Weerzone ${city.name}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share skipped/failed", err);
      }
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getWeather(city.lat, city.lon);
      setWeather(data);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10 * 60000); // 10 min refresh
    return () => clearInterval(interval);
  }, [city]);

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const geoCity = await reverseGeocode(lat, lon);
        setCity(geoCity);
        localStorage.setItem("wz_city", JSON.stringify(geoCity));
      });
    }
  };

  // Persist city choice
  useEffect(() => {
    localStorage.setItem("wz_city", JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }));
  }, [city]);

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
      {/* Header — Nu zonder stadskeuze, puur persoonlijk */}
      <header className="animate-fade-in flex flex-col items-center mb-6">
        <LogoFull height={52} className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)] sm:hidden mb-4" />
        <LogoFull height={64} className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)] hidden sm:block mb-5" />
        <div className="flex flex-row items-center justify-center gap-2 w-full max-w-sm px-4">
          <div className="flex items-center justify-center gap-2 h-11 w-full rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md px-5 shadow-lg">
            <MapPin className="text-white w-4 h-4" />
            <span className="text-base font-bold text-white truncate">{city.name}</span>
          </div>
        </div>
      </header>

      {/* Email Promo — Prominent direct onder de header voor maximale conversie */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <EmailSubscribe city={city} />
      </div>

      {/* ===== 1. Main Weather Card — Kerninformatie ===== */}
      <div className="card overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="p-6 relative z-[2]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3 text-accent-red" />
              {city.name} — {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-[9px] font-bold text-accent-cyan uppercase tracking-wider">HARMONIE + ICON Live</span>
            </div>
          </div>
          
          <div className="flex justify-between items-start mt-4">
            <div className="flex items-start">
              <span className="text-6xl sm:text-7xl font-bold tracking-tighter leading-none">{weather.current.temperature}</span>
              <span className="text-3xl sm:text-4xl font-semibold mt-1">°C</span>
            </div>
            
            <div className="text-6xl sm:text-7xl leading-none">
              {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
            </div>
          </div>
          
          <div className="mt-8 bg-accent-orange/15 border-l-4 border-accent-orange p-4 rounded-r-lg relative overflow-hidden">
            {weather.aiVerdict && (
              <div className="absolute -top-1 -right-1 opacity-10 rotate-12">
                <span className="text-4xl">🤖</span>
              </div>
            )}
            <p className="font-semibold text-lg text-text-primary break-words leading-snug relative z-10">
              {weather.aiVerdict || getMainCommentary(weather)}
            </p>
            {/* FOMO urgentie-trigger */}
            <p className="text-xs text-text-muted mt-2 italic relative z-10">
              {weather.hourly.slice(0, 6).some(h => h.precipitation > 0.5)
                ? `⚡ Verandering binnen ${weather.hourly.findIndex(h => h.precipitation > 0.5) + 1} uur — wie dit niet leest, staat straks in de regen.`
                : weather.daily[1] && Math.abs(weather.daily[1].tempMax - weather.daily[0].tempMax) >= 4
                ? `📉 Morgen ${weather.daily[1].tempMax > weather.daily[0].tempMax ? "stuk warmer" : "flink kouder"} — ${Math.abs(weather.daily[1].tempMax - weather.daily[0].tempMax)}° verschil. Pas je plannen aan.`
                : weather.current.windSpeed > 30
                ? "💨 Dit is niet het moment om dingen op hun beloop te laten."
                : weather.aiVerdict 
                ? "📊 Real-time AI analyse van KNMI-data compleet."
                : `📊 ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} — ${weather.models.sources.length} weermodellen bevestigen dit.`}
            </p>
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
          { icon: "☀️", label: "UV", score: uvScore, detail: uvScore > 0 ? `Index ${weather.uvIndex.toFixed(0)}` : "Laag" },
        ];

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
              <div className="grid grid-cols-5 gap-2 text-center">
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

        if (alerts.length === 0) return null;

        return (
          <div className="animate-fade-in space-y-2" style={{ animationDelay: "0.3s" }}>
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


      {/* ===== Affiliate Spot 1 — prominent boven de vouw ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex justify-between items-end mb-2 px-1">
          <h3 className="section-title">Op basis van het weer in {city.name}</h3>
          <span className="text-[10px] font-bold text-accent-orange/70 uppercase tracking-wider">Aanbevolen</span>
        </div>
        <AffiliateCard variant="top" weather={weather} />
      </div>



      {/* ===== 6. Vandaag & Morgen ===== */}
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


      {/* ===== 14. Zon & UV — compact ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🌅</span>
                <span className="text-xs font-bold text-text-primary">
                  {new Date(weather.sunrise).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🌇</span>
                <span className="text-xs font-bold text-text-primary">
                  {new Date(weather.sunset).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <span className="badge text-[10px]" style={{ backgroundColor: `${uvInfo.color}20`, color: uvInfo.color, border: `1px solid ${uvInfo.color}40` }}>
              UV {weather.uvIndex.toFixed(0)} — {uvInfo.label.split("—")[0].trim()}
            </span>
          </div>
        </div>
      </div>

      {/* ===== Affiliate Spot 2 — onderaan ===== */}
      <div className="animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <div className="flex justify-between items-end mb-2 px-1">
          <h3 className="section-title">
            {weather.current.precipitation > 0 || weather.daily[0].precipitationSum > 5 ? "Het regent — of je bereidt je voor" : "Mooi weer? Maak er wat van"}
          </h3>
          <span className="text-[10px] font-bold text-accent-orange/70 uppercase tracking-wider">Aanbevolen</span>
        </div>
        <AffiliateCard variant="bottom" weather={weather} />
      </div>

      {/* ===== 18. E-mail Weerrapport (Moved to top) ===== */}

      {/* ===== Footer / Share ===== */}
      <footer className="pt-8 pb-4 text-center animate-fade-in" style={{ animationDelay: "1.0s" }}>
        <button onClick={handleShare} className="btn-cta mx-auto">
          <Send className="w-4 h-4 ml-[-4px]" /> Deel het weer
        </button>

        <p className="text-[10px] text-white/50 mt-8 uppercase font-semibold tracking-wider">
          WeerZone — 48 uur. De rest is ruis.
        </p>
        <p className="text-[10px] text-white/50 mt-1">
          Data via <a href="https://open-meteo.com" className="text-accent-orange hover:underline">Open-Meteo</a> · KNMI HARMONIE · DWD ICON · ICON-D2.
          Twee weermodellen, nul ruis.
        </p>
        <div className="mt-8 pt-6 border-t border-white/5 opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            A Tiveau Product
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
