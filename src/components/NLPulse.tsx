"use client";

import { useEffect, useState } from "react";
import { getStationsWeather } from "@/app/actions";
import { Activity, Radio } from "lucide-react";

export default function NLPulse() {
  const [stations, setStations] = useState<Array<{ name: string; temp: number }>>([]);

  useEffect(() => {
    getStationsWeather().then(setStations);
    const interval = setInterval(() => {
      getStationsWeather().then(setStations);
    }, 10 * 60000); // 10 min refresh
    return () => clearInterval(interval);
  }, []);

  if (stations.length === 0) return null;

  return (
    <div className="relative group overflow-hidden bg-black/40 backdrop-blur-xl border-y border-white/5 shadow-2xl h-9 flex items-center" style={{ isolation: "isolate" }}>
      {/* Live Indicator Fixed on Left */}
      <div className="absolute left-0 top-0 bottom-0 z-20 px-3 flex items-center gap-2 bg-gradient-to-r from-black/80 to-transparent pr-8 pointer-events-none">
        <div className="relative flex">
          <Radio className="w-3 h-3 text-accent-orange animate-pulse" />
          <div className="absolute inset-0 bg-accent-orange/40 rounded-full blur-sm animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
          Live <span className="hidden sm:inline">NL Pulse</span>
        </span>
      </div>

      {/* Scrolling Content */}
      <div className="flex gap-12 text-[10px] font-extrabold uppercase tracking-widest text-white/90 animate-marquee hover:pause-marquee pl-24">
        {/* Render stations four times for an extra long, seamless loop on large screens */}
        {[...stations, ...stations, ...stations, ...stations].map((s, i) => (
          <div key={`${s.name}-${i}`} className="flex items-center gap-2.5 shrink-0 group/item transition-all hover:text-white">
            <div className="relative flex">
               <span 
                 className={`w-1 h-1 rounded-full ${
                   s.name === "De Bilt" 
                   ? "bg-accent-orange shadow-[0_0_10px_#ffd60a]" 
                   : "bg-white/30 group-hover/item:bg-white/60"
                 } transition-colors`} 
               />
               {s.name === "De Bilt" && (
                 <div className="absolute inset-0 bg-accent-orange/20 rounded-full blur-[2px] animate-ping duration-[3s]" />
               )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white/60 group-hover/item:text-white/80 transition-colors">{s.name}</span>
              <span className={`tabular-nums ${s.temp > 20 ? 'text-orange-400' : s.temp < 5 ? 'text-blue-400' : 'text-white'}`}>
                {s.temp}°
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Fade Out */}
      <div className="absolute right-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />

      <style jsx>{`
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 80s linear infinite;
        }
        .hover\:pause-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
