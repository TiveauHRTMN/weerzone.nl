"use client";

import { Zap } from "lucide-react";

interface Props {
  lat: number;
  lon: number;
  locale?: "nl" | "de" | "fr";
}

export default function LightningMap({ lat, lon }: Props) {
  // Blitzortung is het live ontladingsnetwerk. Direct gecentreerd op de locatie
  // (zoom 7) en meteen geladen — geen klikdrempel meer.
  const src = `https://map.blitzortung.org/#7/${lat}/${lon}`;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Live ontladingen
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none flex items-center gap-2">
            Bliksemradar
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
          <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
          Live
        </span>
      </div>
      <div className="w-full h-[420px] bg-slate-100 relative">
        <iframe
          width="100%"
          height="100%"
          src={src}
          className="absolute inset-0 border-0"
          loading="lazy"
          title="Live bliksemradar"
        />
      </div>
    </div>
  );
}
