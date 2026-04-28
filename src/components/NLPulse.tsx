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
    <div className="relative group overflow-hidden bg-white/5 backdrop-blur-md border border-white/20 h-11 flex items-center shadow-lg rounded-[24px]" style={{ isolation: "isolate" }}>
      {/* Live Indicator Fixed on Left - Solid glass background to prevent text overlap */}
      <div className="absolute left-0 top-0 bottom-0 z-20 px-3 flex items-center gap-2 bg-[#4a9ee8] shadow-[10px_0_15px_-5px_rgba(0,0,0,0.1)] pr-6 pointer-events-none rounded-l-[24px]">
        <div className="relative flex">
          <Radio className="w-3 h-3 text-accent-orange animate-pulse" />
          <div className="absolute inset-0 bg-accent-orange/50 rounded-full blur-[3px] animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap drop-shadow-sm">
          Live <span className="hidden xs:inline">Pulse</span>
        </span>
      </div>

      {/* Scrolling Content - Adjusted for larger height */}
      <div className="flex gap-8 sm:gap-12 text-[10px] font-black uppercase tracking-[0.15em] text-white/95 animate-marquee hover:pause-marquee pl-16 sm:pl-24">
        {[...stations, ...stations, ...stations, ...stations].map((s, i) => (
          <div key={`${s.name}-${i}`} className="flex items-center gap-2.5 shrink-0 group/item transition-all hover:scale-105 py-2">
            <div className="relative flex">
               <span 
                 className={`w-1.5 h-1.5 rounded-full ${
                   s.name === "De Bilt" 
                   ? "bg-accent-orange shadow-[0_0_12px_#ffd60a]" 
                   : "bg-white/40 group-hover/item:bg-white"
                 } transition-colors`} 
               />
               {s.name === "De Bilt" && (
                 <div className="absolute inset-0 bg-accent-orange/30 rounded-full blur-[3px] animate-ping duration-[3s]" />
               )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-white drop-shadow-md transition-colors whitespace-nowrap">{s.name}</span>
              <span className={`tabular-nums font-black ${s.temp > 20 ? 'text-accent-orange' : s.temp < 5 ? 'text-blue-300' : 'text-white'}`}>
                {s.temp}°
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Fade Out */}
      <div className="absolute right-0 top-0 bottom-0 z-20 w-16 sm:w-24 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

      <style jsx>{`
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 100s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-marquee {
             animation-duration: 75s;
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
