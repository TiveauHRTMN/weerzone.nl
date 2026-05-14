"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, AlertTriangle, Wind, Thermometer } from "lucide-react";
import { loadWeather, loadWWS } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData, type WWSPayload } from "@/lib/types";
import type { KNMIWarningEnriched } from "@/lib/knmi-warnings";
import { persistCity } from "@/lib/persist-city";
import ReflectivityMap from "@/components/ReflectivityMap";
import LightningMap from "@/components/LightningMap";
import ReedExtremeCharts from "@/components/ReedExtremeCharts";

type Alert = { icon: React.ReactNode; title: string; detail: string; severity: "red" | "orange" };

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

interface ReedProps {
    initialWeather?: WeatherData | null;
    initialCity?: City;
}

export default function ReedExtended({ initialWeather, initialCity }: ReedProps) {
  const [city, setCity] = useState<City>(
    () => initialCity || getSavedCity() || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0]
  );
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [knmiWarnings, setKnmiWarnings] = useState<KNMIWarningEnriched[]>([]);
  const [loading, setLoading] = useState(!initialWeather);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!weather) setLoading(true);
    
    fetch(`/api/knmi-warnings?lat=${city.lat}&lon=${city.lon}&enrich=1`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setKnmiWarnings(data.warnings ?? []); })
      .catch(() => {});

    loadWeather(city.lat, city.lon, () => {}, (fresh) => { if (!cancelled) { setWeather(fresh); setLoading(false); } }, undefined, true)
    .then((w) => {
      if (cancelled) return;
      setWeather(w);
      setLoading(false);
    }).catch(() => !cancelled && setLoading(false));

    loadWWS(city.lat, city.lon).then((wwsPayload) => { if (!cancelled) setWWS(wwsPayload); }).catch(() => {});
    return () => { cancelled = true; };
  }, [city]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const prov: City = { name: "Jouw locatie", lat, lon };
        setCity(prov);
        persistCity(prov);
        setLocating(false);
        reverseGeocode(lat, lon).then((c) => { setCity(c); persistCity(c); }).catch(() => {});
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60 * 1000 }
    );
  };

  const hasExtreme = wws?.reed_alert?.active || false;
  const alert = wws?.reed_alert;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white text-sm font-bold hover:bg-white/20 transition-all disabled:opacity-60"
        >
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locatie bepalen…" : city.name}
        </button>
      </div>

      {loading && !weather && (
        <div className="card !p-12 text-center">
           <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-text-secondary" />
           <p className="text-sm font-bold text-text-secondary">Reed kijkt wat er op je afkomt…</p>
        </div>
      )}

      {knmiWarnings.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted">Officiële Waarschuwingen</p>
          {knmiWarnings.map((w) => {
            const accent = w.severity === "RED" ? { line: "border-l-rose-500", bg: "bg-rose-500/5", text: "text-rose-500", chip: "Code Rood" }
              : w.severity === "ORANGE" ? { line: "border-l-orange-500", bg: "bg-orange-500/5", text: "text-orange-500", chip: "Code Oranje" }
              : { line: "border-l-amber-400", bg: "bg-amber-400/5", text: "text-amber-400", chip: "Code Geel" };
            const fmtTime = (iso: string | null) => {
              if (!iso) return "—";
              const d = new Date(iso);
              return d.toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" });
            };
            return (
              <div key={w.key} className={`card !p-5 border-l-4 ${accent.line} ${accent.bg}`}>
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${accent.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>{accent.chip} · {w.type}</span>
                      <span className="text-[10px] text-text-muted">· {w.province}</span>
                      {w.validFrom && w.validUntil && <span className="text-[10px] font-bold text-text-secondary">· {fmtTime(w.validFrom)} → {fmtTime(w.validUntil)}</span>}
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-snug whitespace-pre-line">{w.description}</p>
                    {w.enriched && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl bg-black/5 p-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/70">Verwachte regen</p>
                          <p className="text-sm font-black text-text-primary mt-1">{w.enriched.precipitationTotalMm} mm</p>
                        </div>
                        <div className="rounded-xl bg-black/5 p-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/70">Hardste bui</p>
                          <p className="text-sm font-black text-text-primary mt-1">{w.enriched.precipitationPeakMm} mm</p>
                          <p className="text-[10px] text-text-muted mt-0.5">Rond {fmtTime(w.enriched.precipitationPeakHour)}</p>
                        </div>
                        <div className="rounded-xl bg-black/5 p-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/70">Windstoten</p>
                          <p className="text-sm font-black text-text-primary mt-1">{w.enriched.windPeakKmh} km/h</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(!loading && weather) && (
        <div className="space-y-6 animate-fade-in mb-6">
          <div className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Buien-intensiteit</h3>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Komende 48 uur</span>
            </div>
            <ReflectivityMap hourly={weather.hourly} />
          </div>
          <div className="space-y-3">
            <div className="flex items-end justify-between px-1"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Live Bliksem</h3></div>
            <LightningMap lat={city.lat} lon={city.lon} />
          </div>
          <div className="space-y-3">
            <div className="flex items-end justify-between px-1"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Regen en windstoten</h3></div>
            <ReedExtremeCharts hourly={weather.hourly} />
          </div>
        </div>
      )}

      {(!loading || weather) && hasExtreme && alert && (
        <div className="space-y-4">
          <div className={`card !p-8 border-l-8 ${alert.severity === "RED" ? "border-l-rose-500 bg-rose-500/5" : alert.severity === "ORANGE" ? "border-l-orange-500 bg-orange-500/5" : "border-l-amber-500 bg-amber-500/5"}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className={`w-6 h-6 ${alert.severity === "RED" ? "text-rose-500" : alert.severity === "ORANGE" ? "text-orange-500" : "text-amber-500"}`} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">BELANGRIJK BERICHT · {alert.severity}</span>
            </div>
            <h2 className="text-4xl font-black text-text-primary leading-tight mb-2">{alert.type.join(" & ")}</h2>
            <p className="text-xl font-bold text-text-secondary mb-6">{alert.location} · {alert.timing}</p>
            <div className="bg-black/5 rounded-2xl p-6 border border-black/5">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Wat je moet weten</p>
               <p className="text-lg font-medium text-text-primary italic">"{alert.instruction}"</p>
               <p className="text-[10px] text-text-muted mt-4 uppercase">— Reed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {weather?.current && (
                <div className="card !p-6">
                   <p className="text-[10px] font-black text-text-muted uppercase mb-4">Actuele situatie</p>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-text-muted" /><span className="text-sm font-bold text-text-secondary">Windvlagen</span></div>
                         <span className="text-lg font-black text-text-primary">{weather.current.windGusts} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-text-muted" /><span className="text-sm font-bold text-text-secondary">Gevoelstemperatuur</span></div>
                         <span className="text-lg font-black text-text-primary">{weather.current.feelsLike}°</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <Link href="/" className="text-sm text-white/40 hover:text-white underline font-bold tracking-tight">← Dashboard</Link>
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
  </svg>
);
