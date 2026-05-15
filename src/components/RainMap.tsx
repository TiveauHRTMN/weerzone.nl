"use client";

import { useState, useEffect, useRef } from "react";

// Buienradar RadarMapNL geographic bounds (WGS84)
const NL_BOUNDS = { minLat: 49.36, maxLat: 55.97, minLon: 0.14, maxLon: 10.26 };

interface Props {
  lat: number;
  lon: number;
}

export default function RainMap({ lat, lon, locale = "nl" }: Props & { locale?: "nl" | "de" }) {
  const isDE = locale === "de";
  const bounds = NL_BOUNDS;
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Mark loaded if image is already in cache when the component mounts
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [refreshKey]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    setUpdatedAt(new Date());
    const id = setInterval(() => {
      setRefreshKey(k => k + 1);
      setUpdatedAt(new Date());
      setLoaded(false);
      setError(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const leftPct = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * 100).toFixed(2);
  const topPct = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * 100).toFixed(2);

  // Proxy via our own API route to avoid hotlink-blocking (NL only)
  const radarUrl = `/api/radar-image?r=${refreshKey}`;

  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString(isDE ? "de-DE" : "nl-NL", {
        timeZone: isDE ? "Europe/Berlin" : "Europe/Amsterdam",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  if (isDE) {
    const rainviewerUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=1`;
    return (
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
              Live Niederschlag
            </p>
            <h3 className="text-sm font-black text-slate-800 leading-none">Interaktives Regenradar</h3>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* Radar */}
        <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: "450px" }}>
          {!loaded && !error && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse" />
          )}
          <iframe
            src={rainviewerUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            className={`absolute inset-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setError(true); }}
            title="RainViewer Regenradar"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Live neerslag
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none">Regenradar</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Radar */}
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ aspectRatio: "700/765" }}>
        {/* Shimmer while loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🌧️</span>
            <p className="text-[11px] text-slate-400 font-medium">Radar tijdelijk niet beschikbaar</p>
          </div>
        ) : (
          <img
            ref={imgRef}
            key={refreshKey}
            src={radarUrl}
            alt="Regenradar Nederland"
            className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setError(true); }}
          />
        )}

        {/* Location marker */}
        {loaded && !error && (
          <div
            className="absolute pointer-events-none"
            style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="absolute inset-0 rounded-full bg-[#3b7ff0] opacity-40 animate-ping" style={{ width: 16, height: 16, top: -1, left: -1 }} />
            <span className="relative block w-3.5 h-3.5 rounded-full bg-[#3b7ff0] border-2 border-white shadow-md" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100">
        <span className="text-[9px] text-slate-400 tabular-nums">
          Bijgewerkt {timeStr}
        </span>
        <button
          onClick={() => {
            setRefreshKey(k => k + 1);
            setUpdatedAt(new Date());
            setLoaded(false);
            setError(false);
          }}
          className="text-[9px] font-black uppercase tracking-widest text-[#3b7ff0] hover:text-blue-700 transition-colors"
        >
          Vernieuwen
        </button>
        <span className="text-[9px] text-slate-400">Bron: Buienradar</span>
      </div>
    </div>
  );
}
