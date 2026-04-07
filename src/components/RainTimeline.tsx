"use client";

import type { HourlyForecast } from "@/lib/types";

interface Props {
  hourly: HourlyForecast[];
}

export default function RainTimeline({ hourly }: Props) {
  const maxPrecip = Math.max(...hourly.map((h) => h.precipitation), 1);
  const hasRain = hourly.some((h) => h.precipitation > 0);

  const formatHour = (iso: string) =>
    new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card p-5">
      <div className="section-title mb-4">Neerslag komende uren</div>
      {!hasRain ? (
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>☂️</span> Geen neerslag verwacht. Lekker droog.
        </div>
      ) : (
        <div className="flex items-end gap-1 h-20">
          {hourly.map((h, i) => {
            const pct =
              h.precipitation > 0
                ? Math.max(10, (h.precipitation / maxPrecip) * 100)
                : 4;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center"
                title={`${formatHour(h.time)}: ${h.precipitation} mm`}
              >
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${pct}%`,
                    background: h.precipitation > 0 ? "var(--accent-cyan)" : "rgba(255,255,255,0.06)",
                    opacity: h.precipitation > 0 ? 0.8 : 0.3,
                    minHeight: "3px",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
      {hasRain && (
        <div
          className="flex justify-between mt-2 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{formatHour(hourly[0]?.time)}</span>
          <span>{formatHour(hourly[hourly.length - 1]?.time)}</span>
        </div>
      )}
    </div>
  );
}
