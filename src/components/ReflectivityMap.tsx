"use client";

import type { HourlyForecast } from "@/lib/types";

interface Props {
  hourly: HourlyForecast[];
  locale?: "nl" | "de";
}

// dBZ-like reflectivity scale derived from precipitation rate (mm/h)
// Marshall-Palmer: Z = 200 * R^1.6  →  dBZ = 10 * log10(Z)
function precipToDbz(mm: number): number {
  if (mm <= 0) return 0;
  const Z = 200 * Math.pow(mm, 1.6);
  return Math.max(0, Math.min(65, 10 * Math.log10(Z)));
}

function dbzColor(dbz: number): string {
  if (dbz <= 0)  return "transparent";
  if (dbz < 10)  return "#bfdbfe";  // very light blue
  if (dbz < 20)  return "#60a5fa";  // blue
  if (dbz < 30)  return "#2563eb";  // medium blue
  if (dbz < 35)  return "#16a34a";  // green
  if (dbz < 40)  return "#facc15";  // yellow
  if (dbz < 45)  return "#f97316";  // orange
  if (dbz < 50)  return "#dc2626";  // red
  if (dbz < 55)  return "#991b1b";  // dark red
  return "#7e22ce";                  // purple — extreme
}

function dbzLabel(dbz: number, locale: "nl" | "de" = "nl"): string {
  const isDE = locale === "de";
  if (dbz <= 0)  return isDE ? "Trocken" : "Droog";
  if (dbz < 15)  return isDE ? "Nieselregen" : "Motregen";
  if (dbz < 25)  return isDE ? "Leichter Regen" : "Lichte regen";
  if (dbz < 35)  return isDE ? "Mäßiger Regen" : "Matige regen";
  if (dbz < 40)  return isDE ? "Starker Regen" : "Zware regen";
  if (dbz < 50)  return isDE ? "Schwere Schauer" : "Felle buien";
  return isDE ? "Extrem" : "Extreem";
}

function formatHour(iso: string, locale: "nl" | "de" = "nl"): string {
  return locale === "de" ? `${new Date(iso).getHours()}h` : `${new Date(iso).getHours()}u`;
}

function dateLabel(d: Date, locale: "nl" | "de" = "nl"): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  const isDE = locale === "de";
  if (diff === 0) return isDE ? "Heute" : "Vandaag";
  if (diff === 1) return isDE ? "Morgen" : "Morgen";
  return target.toLocaleDateString(isDE ? "de-DE" : "nl-NL", { weekday: "short" }).toUpperCase();
}

// Scale legend items
const SCALE = [
  { dbz: 5,  label: "<10" },
  { dbz: 15, label: "10-20" },
  { dbz: 25, label: "20-30" },
  { dbz: 35, label: "30-40" },
  { dbz: 45, label: "40-50" },
  { dbz: 55, label: "50+" },
];

export default function ReflectivityMap({ hourly, locale = "nl" }: Props) {
  const isDE = locale === "de";
  const hours = hourly.slice(0, 48);
  if (hours.length === 0) return null;

  const dbzData = hours.map(h => ({
    time: h.time,
    precip: h.precipitation,
    dbz: precipToDbz(h.precipitation),
    cape: h.cape,
    wind: h.windSpeed ?? 0,
  }));

  // Group by day
  const dayGroups: { label: string; hours: typeof dbzData }[] = [];
  let currentDay = "";
  dbzData.forEach(h => {
    const d = new Date(h.time);
    const key = d.toDateString();
    if (key !== currentDay) {
      currentDay = key;
      dayGroups.push({ label: dateLabel(d, locale), hours: [] });
    }
    dayGroups[dayGroups.length - 1].hours.push(h);
  });

  const maxDbz = Math.max(...dbzData.map(d => d.dbz));
  const hasActivity = maxDbz > 5;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            {isDE ? "Wetterradar" : "Buitenradar"}
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none">
            {isDE ? "Regen — 48 Stunden" : "Regenval — 48 uur"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${hasActivity ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {hasActivity ? (isDE ? "Regen im Anmarsch" : "Regen op komst") : (isDE ? "Komplett trocken" : "Helemaal droog")}
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="px-5 pb-3">
        {dayGroups.map((group) => (
          <div key={group.label} className="mb-3 last:mb-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              {group.label}
            </div>
            <div className="flex gap-[2px]">
              {group.hours.map((h) => {
                const color = dbzColor(h.dbz);
                const hour = new Date(h.time).getHours();
                const showLabel = hour % 3 === 0;
                return (
                  <div key={h.time} className="flex-1 flex flex-col items-center group relative">
                    {/* Cell */}
                    <div
                      className="w-full rounded-[3px] transition-all duration-300 cursor-default"
                      style={{
                        height: 32,
                        background: h.dbz > 0 ? color : "#f8fafc",
                        border: h.dbz > 0 ? "none" : "1px solid #f1f5f9",
                      }}
                    />
                    {/* Hour label */}
                    {showLabel && (
                      <span className="text-[8px] font-bold text-slate-400 mt-1">
                        {formatHour(h.time, locale)}
                      </span>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 shadow-xl whitespace-nowrap text-center">
                      <div>{formatHour(h.time, locale)} — {h.precip.toFixed(1)} mm</div>
                      <div className="text-slate-400">{dbzLabel(h.dbz, locale)}</div>
                      {h.cape > 500 && <div className="text-amber-300">{isDE ? "Blitz-Risiko" : "Bliksem-kans"}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isDE ? "Intensität" : "Intensiteit"}</span>
        <div className="flex items-center gap-1">
          {SCALE.map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="w-4 h-3 rounded-[2px]" style={{ background: dbzColor(s.dbz) }} />
            </div>
          ))}
          <span className="text-[8px] font-bold text-slate-400 ml-1">{isDE ? "Leicht → Stark" : "Licht → Zwaar"}</span>
        </div>
      </div>
    </div>
  );
}
