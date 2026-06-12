"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

interface Props {
  lat: number;
  lon: number;
  locale?: "nl" | "de" | "fr";
}

export default function LightningMap({ lat, lon, locale = "nl" }: Props) {
  const isDE = locale === "de";
  const isFR = locale === "fr";
  const [active, setActive] = useState(false);

  // Blitzortung.org is the raw live lightning network powering LightningMaps.org
  const src = `https://map.blitzortung.org/#7/${lat}/${lon}`;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            {isFR ? "Décharges actuelles (Réseau LightningMaps)" : isDE ? "Aktuelle Entladungen (LightningMaps Netzwerk)" : "Actuele ontladingen (LightningMaps netwerk)"}
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none flex items-center gap-2">
            {isFR ? "Radar de foudre en direct" : isDE ? "Live Blitzradar" : "Live Bliksemradar"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Live Overlay</span>
        </div>
      </div>
      <div className="w-full h-[450px] bg-slate-50 relative">
        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
            <Zap className="h-10 w-10 fill-amber-300 text-amber-300" aria-hidden />
            <p className="max-w-sm text-sm font-semibold text-slate-300">De live bliksemkaart gebruikt externe netwerkdata en wordt pas geopend wanneer jij dat kiest.</p>
            <button type="button" onClick={() => setActive(true)} className="btn btn-primary inline-flex items-center gap-2">
              <Zap className="h-4 w-4" aria-hidden />
              {isFR ? "Ouvrir le radar" : isDE ? "Blitzradar öffnen" : "Open live bliksemradar"}
            </button>
          </div>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={src}
            className="absolute inset-0 border-0"
            loading="lazy"
            title={isFR ? "Radar de foudre en direct" : isDE ? "Live Blitzradar" : "Live bliksemradar"}
          />
        )}
      </div>
    </div>
  );
}
