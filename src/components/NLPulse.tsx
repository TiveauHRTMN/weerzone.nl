"use client";

import { useEffect, useState } from "react";
import { getStationsWeather } from "@/app/actions";

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 57) return "🌧️";
  if (code <= 65) return "🌧️";
  if (code <= 67) return "🌨️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export default function NLPulse() {
  const [stations, setStations] = useState<Array<{ name: string; temp: number; weatherCode: number }>>([]);

  useEffect(() => {
    getStationsWeather().then(data => {
      setStations([...data].sort((a, b) => a.name.localeCompare(b.name)));
    });
    const interval = setInterval(() => {
      getStationsWeather().then(data => {
        setStations([...data].sort((a, b) => a.name.localeCompare(b.name)));
      });
    }, 10 * 60000);
    return () => clearInterval(interval);
  }, []);

  if (stations.length === 0) return null;

  const items = [...stations, ...stations, ...stations, ...stations];

  return (
    <div
      className="relative overflow-hidden h-9 flex items-center border-b"
      style={{ borderColor: "var(--wz-border)", background: "var(--ink-050)" }}
    >
      {/* Live label */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-1.5 px-3 pr-5"
        style={{
          background: "linear-gradient(to right, var(--ink-050) 80%, transparent)",
          pointerEvents: "none",
        }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--wz-brand)] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--wz-brand)]" />
        </span>
        <span
          className="text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap"
          style={{ color: "var(--wz-brand)" }}
        >
          Live
        </span>
      </div>

      {/* Scrolling items */}
      <div
        className="flex gap-5 text-[12px] whitespace-nowrap"
        style={{
          width: "max-content",
          animation: "nlpulse-marquee 110s linear infinite",
          paddingLeft: "5rem",
        }}
      >
        {items.map((s, i) => (
          <span key={`${s.name}-${i}`} className="flex items-center gap-1 shrink-0">
            <span>{weatherEmoji(s.weatherCode)}</span>
            <span style={{ color: "var(--ink-800)", fontWeight: 600 }}>{s.name}</span>
            <span
              style={{
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: s.temp > 20 ? "#c07000" : s.temp < 2 ? "#2563eb" : "var(--ink-600)",
              }}
            >
              {s.temp > 0 ? `+${s.temp}°` : `${s.temp}°`}
            </span>
          </span>
        ))}
      </div>

      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 w-12 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--ink-050), transparent)" }}
      />

      <style>{`
        @keyframes nlpulse-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
