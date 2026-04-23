"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, Activity, BrainCircuit } from "lucide-react";
import { loadWeather } from "@/lib/weatherCache";
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

  // Sync with primary location from session if available
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
    (verdict) => { 
        // We negeren het standaard verdict op deze pagina, Piet gaat dieper.
    },
    (fresh) => { if (!cancelled) setWeather(fresh); },
    (neural) => { if (!cancelled) setWeather((prev) => (prev ? { ...prev, neuralData: neural } : prev)); }
  )
    .then((w) => {
      if (!cancelled) {
        setWeather(w);
        setLoading(false);
        
        // Forceer DEEP analysis voor Piet pagina
        getPietDeepAnalysis(w).then(analysis => {
            if (!cancelled) setPietAnalysis(analysis);
        });
      }
    })
    .catch(() => !cancelled && setLoading(false));
  return () => {
    cancelled = true;
  };
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

  const today = weather.daily[0];
  const tomorrow = weather.daily[1];
  const narrative = weather.aiVerdict || getMainCommentary(weather);

  // 48-uurs highlights per 6-uurs blok
  const blocks = [
    { label: "Nu", start: 0, end: 1 },
    { label: "Vanmiddag", start: 1, end: 6 },
    { label: "Vanavond", start: 6, end: 12 },
    { label: "Vannacht", start: 12, end: 18 },
    { label: "Morgenochtend", start: 18, end: 30 },
    { label: "Morgenmiddag/avond", start: 30, end: 42 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={locate}
            disabled={locating}
            className="btn btn-ghost bg-white/10 backdrop-blur-md border-white/20 text-white font-bold"
          >
            <MapPin className={`w-4 h-4 ${locating ? "animate-pulse text-accent-cyan" : ""}`} />
            {locating ? "Sensoren kalibreren…" : city.name}
          </button>
          {primaryLocation?.name === city.name && (
            <span className="badge sun !bg-accent-orange/20 !text-accent-orange border border-accent-orange/30">Home Base</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Data stream: Knmi + Neural Engine</span>
        </div>
      </div>

      {/* 1. THE NEURAL INTELLIGENCE GRID */}
      <NeuralInsights weather={weather} tier={tier} />

      {/* 2. PIET'S ANALYTICAL VERDICT */}
      <div className="homecard !p-8 border-l-4 border-l-accent-cyan overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <BrainCircuit className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan/20 flex items-center justify-center text-3xl shadow-inner border border-white/10">
            💬
          </div>
          <div>
            <h2 className="homecard-kicker !text-accent-cyan !text-xs !mb-1">Intelligence Analyse</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              Snoeiharde realiteit — {new Date().toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="text-lg sm:text-xl font-medium text-white/90 leading-relaxed space-y-4 relative z-10">
          {(pietAnalysis || narrative).split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* 2.5 PIET'S UUR-TOT-UUR FOCUS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-accent-cyan" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Focus: De komende uren</h3>
          </div>
          <span className="text-[9px] font-bold text-accent-cyan/60 uppercase">1km Grid active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {weather.hourly.slice(0, 4).map((h, i) => (
            <div key={i} className="homecard !p-4 bg-white/5 border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-black text-white/40 mb-2">{new Date(h.time).getHours()}:00</span>
              <span className="text-2xl mb-2">{getWeatherEmoji(h.weatherCode, true)}</span>
              <span className="text-lg font-black text-white">{h.temperature}°</span>
              <span className="text-[9px] font-bold text-accent-cyan mt-1">{h.precipitation > 0 ? `${h.precipitation}mm` : "Droog"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. THE 48-HOUR PRECISION GRID */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-3 h-3 text-text-muted" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">48-uurs window (1km resolution)</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((b, idx) => {
            const slice = weather.hourly.slice(b.start, b.end);
            if (slice.length === 0) return null;
            const avgTemp = Math.round(slice.reduce((a, h) => a + h.temperature, 0) / slice.length);
            const rainSum = slice.reduce((a, h) => a + h.precipitation, 0);
            const maxWind = Math.max(...slice.map((h) => h.windSpeed || 0));
            const midCode = slice[Math.floor(slice.length / 2)].weatherCode;
            
            return (
              <motion.div 
                key={b.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="homecard group hover:border-white/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="homecard-kicker">{b.label}</span>
                  <span className="text-3xl drop-shadow-xl">{getWeatherEmoji(midCode, true)}</span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{avgTemp}°</span>
                  <span className="text-xs font-bold text-white/40 uppercase">Avg</span>
                </div>

                <div className="homecard-strip">
                  <div className="homecard-tick">
                    <div className="tk">Rain</div>
                    <div className="vl !text-accent-cyan">{rainSum > 0.1 ? `${rainSum.toFixed(1)}mm` : "0.0"}</div>
                  </div>
                  <div className="homecard-tick">
                    <div className="tk">Wind</div>
                    <div className="vl">{maxWind} <span className="text-[8px] opacity-50">km/h</span></div>
                  </div>
                  <div className="homecard-tick">
                    <div className="tk">UV</div>
                    <div className="vl text-wz-sun">{weather.uvIndex.toFixed(0)}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link href="/" className="btn btn-ghost text-sm font-bold">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center sm:text-right">
            Brute kracht van de WEERZONE Intelligence Engine.<br />
            Next-gen meteorologie voor elke Nederlander.
          </p>
        </div>
      </div>
    </div>
  );
}
