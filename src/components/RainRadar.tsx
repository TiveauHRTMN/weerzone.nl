"use client";

import type { MinutelyPrecipitation } from "@/lib/types";
import { motion } from "framer-motion";
import { Umbrella, Sun } from "lucide-react";

interface RainRadarProps {
  data: MinutelyPrecipitation[];
}

function getPrecipColor(mm: number): string {
  if (mm === 0) return "rgba(0,0,0,0.07)";
  if (mm < 0.3) return "#93c5fd";
  if (mm < 1)   return "#3b82f6";
  if (mm < 2.5) return "#2563eb";
  if (mm < 5)   return "#1e40af";
  return "#991b1b";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function getSummary(data: MinutelyPrecipitation[]): { icon: React.ReactNode; title: string; sub: string } {
  const slice = data.slice(0, 8);
  const hasRainNow = (slice[0]?.precipitation ?? 0) > 0;
  const totalRain = slice.reduce((s, d) => s + d.precipitation, 0);

  if (totalRain === 0) {
    return {
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      title: "Droog de komende 2 uur",
      sub: "Paraplu kan thuis blijven.",
    };
  }

  if (hasRainNow) {
    for (let i = 1; i < slice.length - 1; i++) {
      if (slice[i].precipitation === 0 && (slice[i + 1]?.precipitation ?? 0) === 0) {
        return {
          icon: <Umbrella className="w-4 h-4 text-text-muted" />,
          title: `Droog vanaf ${fmtTime(slice[i].time)}`,
          sub: "Sprint-moment. Pak je kans.",
        };
      }
    }
    return {
      icon: <Umbrella className="w-4 h-4 text-blue-500" />,
      title: "Het blijft voorlopig nat",
      sub: "Aanhoudende neerslag.",
    };
  }

  const firstRain = slice.find((d) => d.precipitation > 0.1);
  if (firstRain) {
    return {
      icon: <Umbrella className="w-4 h-4 text-red-500" />,
      title: `Regen vanaf ${fmtTime(firstRain.time)}`,
      sub: "Ga nu als je droog wilt blijven.",
    };
  }

  return {
    icon: <Sun className="w-4 h-4 text-amber-300" />,
    title: "Grotendeels droog",
    sub: "Misschien een spatje, geen drama.",
  };
}

export default function RainRadar({ data }: RainRadarProps) {
  if (data.length === 0) return null;

  // 8 bars = 2 hours at 15-min intervals
  const bars = data.slice(0, 8);
  const maxMm = Math.max(...bars.map((d) => d.precipitation), 0.5);
  const summary = getSummary(data);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center shrink-0">
          {summary.icon}
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary leading-tight">{summary.title}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{summary.sub}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((point, idx) => {
            const heightPct = point.precipitation === 0
              ? 12
              : Math.max(20, Math.round((point.precipitation / maxMm) * 100));
            const color = getPrecipColor(point.precipitation);
            const label = fmtTime(point.time);

            return (
              <div key={point.time} className="flex-1 flex flex-col justify-end h-full group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  {label} — {point.precipitation > 0 ? `${point.precipitation.toFixed(1)} mm` : "Droog"}
                </div>
                <motion.div
                  className="w-full rounded-t-md"
                  style={{ background: color }}
                  initial={{ height: 2 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            );
          })}
        </div>

        {/* Time axis: Nu — +1u — +2u */}
        <div className="flex justify-between mt-2 px-0.5">
          <span className="text-[10px] font-bold text-accent-orange">Nu</span>
          <span className="text-[10px] text-text-muted">{fmtTime(bars[4]?.time ?? bars[0].time)}</span>
          <span className="text-[10px] text-text-muted">{fmtTime(bars[7]?.time ?? bars[bars.length - 1].time)}</span>
        </div>
      </div>
    </div>
  );
}
