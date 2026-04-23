"use client";

import React from "react";
import { Wind, Sun, ShieldAlert, Zap, ThermometerSun } from "lucide-react";
import type { ImpactData } from "@/lib/impact-engine";

export default function ImpactDashboard({ data }: { data: ImpactData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {/* Air Quality Card */}
      <div className="wz-card wz-card-pad-lg group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wind size={80} />
        </div>
        <div className="relative z-10">
          <div className="wz-micro mb-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.airQuality.index < 50 ? 'bg-green-500' : 'bg-orange-500'}`} />
            Luchtkwaliteit
          </div>
          <h3 className="wz-h-display text-sky-600 mb-1">{data.airQuality.index}</h3>
          <p className="wz-h-3 mb-4">{data.airQuality.label}</p>
          <div className="wz-body text-sm line-clamp-2">
            {data.airQuality.suggestion}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400">
            <ShieldAlert size={14} />
            Dominante stof: {data.airQuality.dominantPollutant}
          </div>
        </div>
      </div>

      {/* Solar Potential Card */}
      <div className="wz-card wz-card-pad-lg group overflow-hidden relative border-amber-100 bg-gradient-to-br from-white to-amber-50">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
          <Sun size={80} />
        </div>
        <div className="relative z-10">
          <div className="wz-micro mb-2 text-amber-700">Zonne-energie</div>
          <h3 className="wz-h-display text-amber-500 mb-1">{data.solar.maxSunshineHours.toFixed(0)}</h3>
          <p className="wz-h-3 mb-4">Uur zon / jaar</p>
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              data.solar.solarPotential === 'high' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {data.solar.solarPotential} potentieel
            </div>
            <div className="text-xs font-bold text-amber-900/60">
              {data.solar.panelCount} panelen max.
            </div>
          </div>
          <div className="wz-body text-sm">
            Fysieke gebouw-data geanalyseerd via 3D LIDAR tiles.
          </div>
        </div>
      </div>

      {/* Combined Impact Score Card */}
      <div className="wz-card wz-card-pad-lg group overflow-hidden relative bg-slate-900 text-white border-none shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent" />
        <div className="relative z-10">
          <div className="wz-micro mb-2 text-white/50">Impact Engine Score</div>
          <div className="flex items-end gap-3 mb-2">
            <h3 className="text-6xl font-black text-white">{data.combinedScore}</h3>
            <div className="text-2xl font-bold text-white/40 mb-2">/100</div>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full mb-6">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]" 
              style={{ width: `${data.combinedScore}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Status</div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Zap size={14} className="text-sky-400" />
                Live
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Model</div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <ThermometerSun size={14} className="text-amber-400" />
                Antigravity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
