"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Target, Activity, Sun, Wind, Cloud, AlertOctagon } from "lucide-react";
import Link from "next/link";
import type { WeatherData } from "@/lib/types";
import type { PersonaTier } from "@/lib/personas";

interface NeuralInsightsProps {
  weather: WeatherData;
  tier?: PersonaTier | null;
}

export default function NeuralInsights({ weather, tier }: NeuralInsightsProps) {
  if (!weather.neuralData) return null;

  const { 
    metNetNowcast, 
    seedScenario, 
    neuralGcmImpact,
    opticalDepth,
    solarRadiation,
    windTurbulence,
    lightningRisk,
    stormSeverity
  } = weather.neuralData;

  const confidence = 92; 
  const isReed = tier === "reed" || tier === "steve";
  const hasExtreme = (lightningRisk || 0) > 40 || (stormSeverity || 0) > 6;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-cyan" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Analyse</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1. PRIMARY: NOWCAST MONITOR */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="homecard"
        >
          <div className="homecard-top mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="homecard-kicker !mb-0">Neerslag Radar</h4>
              </div>
              <p className="text-xl font-black text-white leading-tight">{metNetNowcast || "Data wordt geladen..."}</p>
            </div>
            <Zap className="w-6 h-6 text-accent-cyan homecard-sun" />
          </div>

          <div className="homecard-strip !border-none !mt-0 h-12 items-end px-2">
            {[...Array(30)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [15, Math.random() * 40 + 10, 15] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.03 }}
                className="flex-1 bg-accent-cyan/30 rounded-t-sm"
              />
            ))}
          </div>
        </motion.div>

        {/* 2. SECONDARY: TECHNICAL GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3 bg-white/5 border-white/5 flex flex-col items-center text-center">
            <Cloud className="w-4 h-4 text-text-muted mb-2" />
            <span className="text-[10px] font-black text-text-secondary uppercase mb-1">Optische Diepte</span>
            <span className="text-sm font-black text-white">{opticalDepth || "—"}%</span>
          </div>
          <div className="card p-3 bg-white/5 border-white/5 flex flex-col items-center text-center">
            <Sun className="w-4 h-4 text-accent-orange mb-2" />
            <span className="text-[10px] font-black text-text-secondary uppercase mb-1">Straling</span>
            <span className="text-sm font-black text-white">{solarRadiation || "—"} W/m²</span>
          </div>
          <div className="card p-3 bg-white/5 border-white/5 flex flex-col items-center text-center">
            <Wind className="w-4 h-4 text-accent-blue mb-2" />
            <span className="text-[10px] font-black text-text-secondary uppercase mb-1">Turbulentie</span>
            <span className="text-[10px] font-black text-white truncate w-full uppercase">{windTurbulence || "Stable"}</span>
          </div>
          <div className="card p-3 bg-white/5 border-white/5 flex flex-col items-center text-center">
            <Target className="w-4 h-4 text-accent-green mb-2" />
            <span className="text-[10px] font-black text-text-secondary uppercase mb-1">Grid Resolutie</span>
            <span className="text-sm font-black text-white">1.0 km</span>
          </div>
        </div>

        {/* 3. TERTIARY: SCENARIO & IMPACT */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5 bg-white/5 border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-accent-orange" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ensemble Model</h4>
            </div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-white">{confidence}%</span>
              <span className="text-[9px] font-bold text-accent-orange uppercase">Zekerheid</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                className="h-full bg-accent-orange"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-3 leading-relaxed italic">"{seedScenario}"</p>
          </div>

          <div className="card p-5 bg-white/5 border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-accent-blue" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Omgevings-Impact</h4>
            </div>
            <p className="text-sm font-bold text-white mb-3">{neuralGcmImpact}</p>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded bg-accent-blue/10 border border-accent-blue/20 text-[9px] font-black text-accent-blue uppercase tracking-tighter">Geo-Aware</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REED GATE: EXTREME WEATHER UPSELL */}
      {hasExtreme && (
        <div className={`card overflow-hidden border-2 ${isReed ? 'border-accent-red/50 bg-accent-red/5' : 'border-accent-red/30 bg-black/40'}`}>
          <div className="p-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-accent-red flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-accent-red uppercase tracking-widest">Extreme Atmosfeer</h4>
              <p className="text-xs font-bold text-white/80 mt-1">
                {isReed 
                  ? "Snoeiharde waarschuwing: Neurale sensoren slaan uit op storm/onweer." 
                  : "Detail-data voor deze extreme condities is vergrendeld voor Piet-abonnees."}
              </p>
            </div>
            {!isReed && (
              <Link 
                href="/waarschuwingen"
                className="px-5 py-2.5 bg-accent-red text-white text-[11px] font-black uppercase rounded-xl hover:scale-105 transition-transform"
              >
                Reed Alerts →
              </Link>
            )}
          </div>
          {!isReed && (
            <div className="h-10 bg-accent-red flex items-center justify-center gap-2">
               <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Upgrade naar Reed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
