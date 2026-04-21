"use client";

import { useEffect, useState } from "react";
import { getStationsWeather } from "@/app/actions";
import { Radio } from "lucide-react";

export default function NLPulse() {
  const [stations, setStations] = useState<Array<{ name: string; temp: number }>>([]);

  useEffect(() => {
    getStationsWeather().then(data => {
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setStations(sorted);
    });
    const interval = setInterval(() => {
      getStationsWeather().then(data => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setStations(sorted);
      });
    }, 10 * 60000); // 10 min refresh
    return () => clearInterval(interval);
  }, []);

  if (stations.length === 0) return null;

  return (
    <div className="relative group overflow-hidden bg-white/10 backdrop-blur-md border-y border-white/20 h-8 sm:h-9 flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" style={{ isolation: "isolate" }}>
      {/* Live Indicator Fixed on Left - Now with subtle white glass blending */}
      <div className="absolute left-0 top-0 bottom-0 z-20 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-white/20 via-white/10 to-transparent pr-8 sm:pr-10 pointer-events-none">
        <div className="relative flex">
          <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent-orange animate-pulse" />
          <div className="absolute inset-0 bg-accent-orange/40 rounded-full blur-sm animate-pulse" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white whitespace-nowrap drop-shadow-sm">
          Live <span className="hidden xs:inline">Pulse</span>
        </span>
      </div>

      {/* Scrolling Content - Brighter text for readability on light glass */}
      <div className="flex gap-8 sm:gap-12 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white animate-marquee hover:pause-marquee pl-16 sm:pl-28">
        {/* Render stations four times for an extra long, seamless loop */}
        {[...stations, ...stations, ...stations, ...stations].map((s, i) => (
          <div key={`${s.name}-${i}`} className="flex items-center gap-2 sm:gap-2.5 shrink-0 group/item transition-all hover:scale-105">
            <div className="relative flex">
               <span 
                 className={`w-1 h-1 rounded-full ${
                   s.name === "De Bilt" 
                   ? "bg-accent-orange shadow-[0_0_10px_#ffd60a]" 
                   : "bg-white/50 group-hover/item:bg-white"
                 } transition-colors`} 
               />
               {s.name === "De Bilt" && (
                 <div className="absolute inset-0 bg-accent-orange/20 rounded-full blur-[2px] animate-ping duration-[3s]" />
               )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white drop-shadow-sm transition-colors whitespace-nowrap">{s.name}</span>
              <span className={`tabular-nums font-black ${s.temp > 20 ? 'text-accent-orange' : s.temp < 5 ? 'text-blue-200' : 'text-white'}`}>
                {s.temp}°
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Fade Out - Adapted for light background */}
      <div className="absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-20 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

      <style jsx>{`
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 120s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-marquee {
             animation-duration: 90s;
          }
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
