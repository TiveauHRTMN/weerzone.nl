"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, Activity, BrainCircuit } from "lucide-react";
import { loadWeather, patchCacheDeep } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData, distanceBetween } from "@/lib/types";
import { getWeatherEmoji, getWeatherDescription } from "@/lib/weather";
import { getMainCommentary } from "@/lib/commentary";
import { getPietDeepAnalysis } from "@/app/actions";
import NeuralInsights from "./NeuralInsights";
import { useSession } from "@/lib/session-context";

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.name && typeof p.lat === "number" && typeof p.lon === "number") {
        return { name: p.name, lat: p.lat, lon: p.lon };
      }
    }
  } catch {}
  return null;
}

export default function PietExtended() {
  const { tier, primaryLocation, loading: sessionLoading } = useSession();
  
  const [city, setCity] = useState<City>(
    () => getSavedCity() || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0]
  );
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pietAnalysis, setPietAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!sessionLoading && primaryLocation) {
      setCity(primaryLocation);
    }
  }, [sessionLoading, primaryLocation]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadWeather(
      city.lat,
      city.lon,
      () => {},
      (fresh) => { if (!cancelled) setWeather(fresh); },
      (neural) => { if (!cancelled) setWeather((prev) => (prev ? { ...prev, neuralData: neural } : prev)); }
    )
      .then((w) => {
        if (!cancelled) {
          setWeather(w);
          setLoading(false);
          if (w.deepAnalysis) {
            setPietAnalysis(w.deepAnalysis);
          } else {
            getPietDeepAnalysis(w).then(analysis => {
                if (!cancelled) {
                  setPietAnalysis(analysis);
                  patchCacheDeep(city.lat, city.lon, analysis);
                }
            });
          }
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [city]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisional: City = { name: "Locatie bepalen...", lat, lon };
        setCity(provisional);
        reverseGeocode(lat, lon).then((c) => {
          setCity(c);
          localStorage.setItem("wz_city", JSON.stringify(c));
          setLocating(false);
        }).catch(() => setLocating(false));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading || !weather) {
    return (
      <div className="card p-6 text-center">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-orange" />
        <p className="text-sm text-text-secondary">Piet verzint iets slims…</p>
      </div>
    );
  }

  const narrative = pietAnalysis || weather.summaryVerdict || getMainCommentary(weather);
  const blocks = [
    { label: "Nu", start: 0, end: 1 },
    { label: "Vanmiddag", start: 1, end: 6 },
    { label: "Vanavond", start: 6, end: 12 },
    { label: "Vannacht", start: 12, end: 18 },
    { label: "Morgenochtend", start: 18, end: 30 },
    { label: "Morgenmiddag/avond", start: 30, end: 42 },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={locate}
          disabled={locating}
          className="btn btn-ghost bg-white/10 backdrop-blur-md border-white/20 text-white font-bold"
        >
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locatie bepalen…" : city.name}
        </button>
        {primaryLocation?.name === city.name && (
          <span className="badge sun">Thuis</span>
        )}
      </div>

      <div className="homecard !p-8 border-l-4 border-l-accent-cyan">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center text-2xl shadow-inner">💬</div>
          <div>
            <h2 className="homecard-kicker !text-accent-cyan !mb-0">Piet’s Analyse</h2>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
              {new Date().toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white leading-relaxed space-y-5">
          {narrative.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 px-1">Komende Uren</h3>
        <div className="horizontal-scroll no-scrollbar -mx-4 px-4 pb-4">
          {weather.hourly.slice(0, 12).map((h, i) => (
            <div key={i} className="homecard !p-5 bg-white/5 border-white/5 flex flex-col items-center min-w-[100px] snap-start">
              <span className="text-[10px] font-black text-white/40 mb-3">{new Date(h.time).getHours()}:00</span>
              <span className="text-4xl mb-3 drop-shadow-lg">{getWeatherEmoji(h.weatherCode, true)}</span>
              <span className="text-xl font-black text-white">{h.temperature}°</span>
              <span className="text-[10px] font-bold text-accent-cyan mt-2">{h.precipitation > 0 ? `${h.precipitation.toFixed(1)}mm` : "Droog"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1 text-center">48-uurs Overzicht</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {blocks.map((b, idx) => {
            const slice = weather.hourly.slice(b.start, b.end);
            if (slice.length === 0) return null;
            const avgTemp = Math.round(slice.reduce((a, h) => a + h.temperature, 0) / slice.length);
            const rainSum = slice.reduce((a, h) => a + h.precipitation, 0);
            const maxWind = Math.max(...slice.map((h) => h.windSpeed || 0));
            const midCode = slice[Math.floor(slice.length / 2)].weatherCode;
            
            return (
              <motion.div key={b.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="homecard">
                <div className="flex justify-between items-start mb-4">
                  <span className="homecard-kicker">{b.label}</span>
                  <span className="text-3xl drop-shadow-xl">{getWeatherEmoji(midCode, true)}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white tracking-tighter">{avgTemp}°</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase">Gemiddeld</span>
                </div>
                <div className="homecard-strip !mt-0 !pt-4">
                  <div className="homecard-tick"><div className="tk">Regen</div><div className="vl !text-accent-cyan">{rainSum > 0.1 ? `${rainSum.toFixed(1)}mm` : "0.0"}</div></div>
                  <div className="homecard-tick"><div className="tk">Wind</div><div className="vl">{maxWind} <span className="text-[8px] opacity-50">km/h</span></div></div>
                  <div className="homecard-tick"><div className="tk">UV</div><div className="vl text-wz-sun">{weather.uvIndex.toFixed(0)}</div></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="pt-12 border-t border-white/10 flex justify-center">
        <Link href="/" className="btn btn-ghost text-sm font-bold opacity-60 hover:opacity-100">← Dashboard</Link>
      </div>
    </div>
  );
}
