"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, AlertTriangle, ShieldCheck, Zap, Wind, CloudRain, Thermometer, ShieldAlert } from "lucide-react";
import { loadWeather, loadWWS, patchCacheDeep } from "@/lib/weatherCache";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData, type WWSPayload } from "@/lib/types";
import { useSession } from "@/lib/session-context";

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
  const { user, tier, isFounder } = useSession();
  const [city, setCity] = useState<City>(
    () => initialCity || getSavedCity() || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0]
  );
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialWeather);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    // Alleen full loader als we echt niks hebben
    if (!weather) {
        setLoading(true);
    }
    
    Promise.all([
      loadWeather(city.lat, city.lon, () => {}, (fresh) => { if (!cancelled) setWeather(fresh); }),
      loadWWS(city.lat, city.lon)
    ])
    .then(([w, wwsPayload]) => {
      if (!cancelled) {
        setWeather(w);
        setWWS(wwsPayload);
        setLoading(false);

        // Reed AI: Alleen voor abonnees of Founder
        const hasPaidTier = tier === "piet" || tier === "reed" || tier === "steve" || isFounder;
        if (hasPaidTier && !aiNarrative) {
            fetch('/api/persona/reed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    weather: w, 
                    city: city.name, 
                    userName: user?.user_metadata?.full_name || 'gebruiker' 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (!cancelled && data.narrative) {
                    setAiNarrative(data.narrative);
                    patchCacheDeep(city.lat, city.lon, data.narrative);
                }
            })
            .catch(err => console.error("Reed AI Error:", err));
        }
      }
    })
    .catch(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [city, tier, isFounder, user?.user_metadata?.full_name]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const prov: City = { name: "Jouw locatie", lat, lon };
        setCity(prov);
        localStorage.setItem("wz_city", JSON.stringify(prov));
        setLocating(false);
        reverseGeocode(lat, lon).then((c) => {
          setCity(c);
          localStorage.setItem("wz_city", JSON.stringify(c));
        }).catch(() => {});
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
        {wws && (
           <div className="px-3 py-1.5 rounded-lg bg-black/20 text-[10px] font-black text-white/40 uppercase tracking-widest border border-white/5">
              P90 SEED Analysed
           </div>
        )}
      </div>

      {loading && !weather && (
        <div className="card !p-12 text-center">
           <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-text-secondary" />
           <p className="text-sm font-bold text-text-secondary">Reed scant de horizon op 1km resolutie…</p>
        </div>
      )}

      {/* Reed AI Risico-Analyse */}
      {(!loading || weather) && !hasExtreme && (
         <div className="animate-fade-in mb-6">
            {aiNarrative ? (
              <div className="card border-l-4 border-l-emerald-500 !p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Status: Veilig</h3>
                       <p className="text-[10px] font-bold text-text-muted/60 uppercase">Gevalideerd rapport door Reed</p>
                    </div>
                 </div>
                 <div className="text-lg font-medium text-text-primary leading-relaxed space-y-4">
                    {aiNarrative.split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
                 </div>
                 <p className="text-[10px] text-text-muted mt-8 uppercase tracking-widest">— Reed Expert Systeem</p>
              </div>
            ) : (
               (tier || isFounder) && (
                 <div className="card !p-8 animate-pulse flex items-center gap-4">
                    <ShieldAlert className="w-5 h-5 text-text-muted" />
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Reed stelt een risico-rapport op…</p>
                 </div>
               )
            )}
         </div>
      )}

      {(!loading || weather) && hasExtreme && alert && (
        <div className="space-y-4">
          <div className={`card !p-8 border-l-8 ${
            alert.severity === "RED" ? "border-l-rose-500 bg-rose-500/5" : 
            alert.severity === "ORANGE" ? "border-l-orange-500 bg-orange-500/5" : "border-l-amber-500 bg-amber-500/5"
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className={`w-6 h-6 ${
                alert.severity === "RED" ? "text-rose-500" : 
                alert.severity === "ORANGE" ? "text-orange-500" : "text-amber-500"
              }`} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">
                WWS EXTREEM ALERT · {alert.severity}
              </span>
            </div>
            
            <h2 className="text-4xl font-black text-text-primary leading-tight mb-2">
              {alert.type.join(" & ")}
            </h2>
            <p className="text-xl font-bold text-text-secondary mb-6">{alert.location} · {alert.timing}</p>
            
            <div className="bg-black/5 rounded-2xl p-6 border border-black/5">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Instructie van Reed</p>
               <p className="text-lg font-medium text-text-primary italic">"{alert.instruction}"</p>
               <p className="text-[10px] text-text-muted mt-4 uppercase">— Reed van Weerzone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {weather?.current && (
                <div className="card !p-6">
                   <p className="text-[10px] font-black text-text-muted uppercase mb-4">Actuele Impact</p>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-bold text-text-secondary">Windvlagen</span>
                         </div>
                         <span className="text-lg font-black text-text-primary">{weather.current.windGusts} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-bold text-text-secondary">Gevoelstemp</span>
                         </div>
                         <span className="text-lg font-black text-text-primary">{weather.current.feelsLike}°</span>
                      </div>
                   </div>
                </div>
             )}
             <div className="card !p-6 bg-slate-900">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-4 tracking-widest">Technisch Dossier</p>
                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                   <p>LATENCY: 120ms</p>
                   <p>MODELS: HARMONIE, METNET-3</p>
                   <p>ACCURACY: 1KM GRID</p>
                   <p>TIMESTAMP: {new Date().toLocaleTimeString()}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <Link href="/" className="text-sm text-white/40 hover:text-white underline font-bold tracking-tight">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
