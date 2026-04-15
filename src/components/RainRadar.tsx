"use client";

import type { MinutelyPrecipitation } from "@/lib/types";
import { motion } from "framer-motion";

interface RainRadarProps {
  data: MinutelyPrecipitation[];
}

function getPrecipLabel(mm: number): string {
  if (mm === 0) return "Droog";
  if (mm < 0.3) return "Lichte motregen";
  if (mm < 1) return "Lichte regen";
  if (mm < 2.5) return "Matige regen";
  if (mm < 5) return "Zware regen";
  return "Extreme regen";
}

function getPrecipColor(mm: number): string {
  if (mm === 0) return "transparent";
  if (mm < 0.3) return "rgba(96, 165, 250, 0.4)";    // light blue
  if (mm < 1) return "rgba(59, 130, 246, 0.6)";       // blue
  if (mm < 2.5) return "rgba(37, 99, 235, 0.75)";     // medium blue
  if (mm < 5) return "rgba(30, 64, 175, 0.85)";       // dark blue
  return "rgba(127, 29, 29, 0.9)";                     // red-dark
}

function getBarHeight(mm: number, maxMm: number): number {
  if (mm === 0) return 2;
  // Min bar height = 6px, max = 56px
  return Math.max(6, Math.round((mm / Math.max(maxMm, 0.5)) * 56));
}

function getSummary(data: MinutelyPrecipitation[]): {
  emoji: string;
  text: string;
  subtext: string;
} {
  const hasRainNow = data.length > 0 && data[0].precipitation > 0;
  const totalRain = data.reduce((sum, d) => sum + d.precipitation, 0);
  const allDry = totalRain === 0;

  if (allDry) {
    return {
      emoji: "☀️",
      text: "Droog de komende 2 uur",
      subtext: "Paraplu kan thuis blijven.",
    };
  }

  // Find transitions
  const fmt = (time: string) =>
    new Date(time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  if (hasRainNow) {
    // Currently raining — when does it stop?
    const firstDry = data.find((d, i) => i > 0 && d.precipitation === 0);
    // Check if there's a consecutive dry stretch (2+ intervals)
    let dryStretchStart: string | null = null;
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].precipitation === 0 && data[i + 1].precipitation === 0) {
        dryStretchStart = data[i].time;
        break;
      }
    }

    if (dryStretchStart) {
      return {
        emoji: "🌦️",
        text: `Droog vanaf ${fmt(dryStretchStart)}`,
        subtext: "Sprint-moment. Wees er snel bij.",
      };
    } else if (firstDry) {
      return {
        emoji: "🌧️",
        text: `Kort droog moment rond ${fmt(firstDry.time)}`,
        subtext: "Niet lang genoeg om op te rekenen.",
      };
    } else {
      return {
        emoji: "🌧️",
        text: "Het blijft regenen. De hele 2 uur.",
        subtext: "Accepteer het. Paraplu of thuisblijven.",
      };
    }
  } else {
    // Currently dry — when does it start raining?
    const firstRain = data.find((d) => d.precipitation > 0.1);
    if (firstRain) {
      return {
        emoji: "⚠️",
        text: `Regen vanaf ${fmt(firstRain.time)}`,
        subtext: "Ga nu als je droog wilt blijven.",
      };
    }
    // Very light drizzle expected
    return {
      emoji: "🌤️",
      text: "Grotendeels droog",
      subtext: "Misschien een spatje, maar verder chill.",
    };
  }
}

export default function RainRadar({ data }: RainRadarProps) {
  if (data.length === 0) return null;

  const maxMm = Math.max(...data.map((d) => d.precipitation), 0.5);
  const summary = getSummary(data);
  const hasRain = data.some((d) => d.precipitation > 0);

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-cyan/15 flex items-center justify-center text-xl shrink-0">
          {summary.emoji}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            Neerslag — komende 2 uur
          </div>
          <div className="text-sm font-semibold text-text-primary">
            {summary.text}
          </div>
          <div className="text-xs text-text-muted">{summary.subtext}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative">
        {/* Time labels */}
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-bold text-accent-orange">Nu</span>
          <span className="text-[10px] font-semibold text-text-muted">
            +1 uur
          </span>
          <span className="text-[10px] font-semibold text-text-muted">
            +2 uur
          </span>
        </div>

        {/* Bars */}
        <div
          className="flex items-end justify-center gap-[4px]"
          style={{ height: 64 }}
        >
          {data.map((point, idx) => {
            const barH = getBarHeight(point.precipitation, maxMm);
            const color = getPrecipColor(point.precipitation);
            const isRaining = point.precipitation > 0;

            return (
              <motion.div
                key={point.time}
                className="flex-1 rounded-t-sm relative group cursor-default"
                initial={{ height: 2 }}
                animate={{ height: barH }}
                transition={{ duration: 0.5, delay: idx * 0.03, ease: "easeOut" }}
                style={{
                  background: isRaining ? color : "rgba(0,0,0,0.04)",
                  minWidth: "8px",
                  maxWidth: "32px",
                }}
                title={`${new Date(point.time).toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}: ${point.precipitation > 0 ? point.precipitation.toFixed(1) + " mm" : "Droog"}`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-text-primary text-white text-[9px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {new Date(point.time).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" — "}
                  {point.precipitation > 0
                    ? `${point.precipitation.toFixed(1)} mm`
                    : "Droog"}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend if there's rain */}
        {hasRain && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: "rgba(96, 165, 250, 0.4)" }}
                />
                <span className="text-[9px] text-text-muted">Licht</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: "rgba(37, 99, 235, 0.75)" }}
                />
                <span className="text-[9px] text-text-muted">Matig</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: "rgba(30, 64, 175, 0.85)" }}
                />
                <span className="text-[9px] text-text-muted">Zwaar</span>
              </div>
            </div>
            <span className="text-[9px] font-medium text-text-muted">
              Per 15 min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
