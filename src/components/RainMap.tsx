"use client";

import { useState } from "react";
import { CloudRain } from "lucide-react";

interface Props {
  lat: number;
  lon: number;
}

export default function RainMap({ lat, lon, locale = "nl" }: Props & { locale?: "nl" | "de" | "fr" | "es" }) {
  const isDE = locale === "de";
  const isFR = locale === "fr";
  const isES = locale === "es";
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const rainviewerUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=1`;

  const headerSmall = isES ? "Lluvia en directo" : isFR ? "Précipitations en direct" : isDE ? "Live Niederschlag" : "Live neerslag";
  const headerLarge = isES ? "Radar interactivo" : isFR ? "Radar interactif" : isDE ? "Interaktives Regenradar" : "Interactieve Regenradar";
  const openLabel = isES ? "Abrir radar" : isFR ? "Ouvrir le radar" : isDE ? "Regenradar öffnen" : "Open live regenradar";

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            {headerSmall}
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none">{headerLarge}</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Radar */}
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: "450px" }}>
        {active && !loaded && !error && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        )}
        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
            <CloudRain className="h-10 w-10 text-sky-300" aria-hidden />
            <p className="max-w-sm text-sm font-semibold text-slate-300">Laad de interactieve kaart alleen wanneer je hem nodig hebt.</p>
            <button type="button" onClick={() => setActive(true)} className="btn btn-primary inline-flex items-center gap-2">
              <CloudRain className="h-4 w-4" aria-hidden />
              {openLabel}
            </button>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 px-6 text-center text-sm font-bold text-white">De regenradar kon niet worden geladen.</div>
        ) : (
          <iframe
            src={rainviewerUrl}
            width="100%"
            height="100%"
            className={`absolute inset-0 border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setError(true); }}
            title="RainViewer Regenradar"
          />
        )}
      </div>
    </div>
  );
}
