"use client";

import type { HourlyForecast } from "@/lib/types";

interface Props {
  hourly: HourlyForecast[];
  locale?: "nl" | "de";
}

// ─── Layout constants ─────────────────────────────────────────
const W = 480;
const H = 120;
const PL = 36;  // left padding for Y-axis
const PR = 12;
const PT = 12;
const PB = 24;  // bottom padding for time axis
const CW = W - PL - PR;
const CH = H - PT - PB;

function formatHour(iso: string, locale: "nl" | "de" = "nl"): string {
  const hr = new Date(iso).getHours();
  return locale === "de" ? `${hr}h` : `${hr}u`;
}

function xAt(i: number, n: number) {
  return PL + (i / Math.max(n - 1, 1)) * CW;
}

// ─── Single chart panel ──────────────────────────────────────
function ChartPanel({
  title,
  maxLabel,
  data,
  hours,
  yMax,
  unit,
  colorFn,
  threshold,
  thresholdLabel,
  type = "bar",
}: {
  title: string;
  maxLabel: string;
  data: number[];
  hours: HourlyForecast[];
  yMax: number;
  unit: string;
  colorFn: (val: number) => string;
  threshold?: number;
  thresholdLabel?: string;
  type?: "bar" | "line";
}) {
  const n = data.length;
  const safeMax = Math.max(yMax, ...data, 1);

  // Y-axis: 3 labels (0, mid, top)
  const yMid = Math.round(safeMax / 2);
  const yLabels = [
    { val: 0, y: PT + CH },
    { val: yMid, y: PT + CH * (1 - yMid / safeMax) },
    { val: Math.round(safeMax), y: PT },
  ];

  // Time axis: every 6 hours
  const timeLabels: { text: string; x: number }[] = [];
  const localeStr = (typeof window !== "undefined" && window.location.pathname.startsWith("/de")) ? "de" : "nl"; // Quick hack if locale not passed, but we should pass it
  // Better: pass locale down to ChartPanel
  hours.forEach((h, i) => {
    const hr = new Date(h.time).getHours();
    if (i === 0) {
      // It's mapped later, but we can pass 'Nu' and translate in render
      timeLabels.push({ text: "Nu", x: xAt(i, n) });
    } else if (hr % 6 === 0) {
      timeLabels.push({ text: formatHour(h.time, localeStr), x: xAt(i, n) });
    }
  });

  const barW = Math.max(3, (CW / n) - 2);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</span>
        <span className="text-[11px] font-bold text-slate-400">{maxLabel} {unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ display: "block" }}>
        {/* Horizontal grid lines + Y-axis labels */}
        {yLabels.map(({ val, y }) => (
          <g key={val}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 6} y={y + 3} fill="#94a3b8" fontSize="9" textAnchor="end"
              fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">
              {val}
            </text>
          </g>
        ))}

        {/* Threshold line */}
        {threshold != null && threshold < safeMax && (() => {
          const ty = PT + CH * (1 - threshold / safeMax);
          return (
            <g>
              <line x1={PL} y1={ty} x2={W - PR} y2={ty}
                stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
              {thresholdLabel && (
                <text x={W - PR} y={ty - 4} fill="#f43f5e" fontSize="8" textAnchor="end"
                  fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700" opacity="0.7">
                  {thresholdLabel}
                </text>
              )}
            </g>
          );
        })()}

        {/* Data visualization */}
        {type === "bar" ? (
          // Bar chart
          data.map((val, i) => {
            if (val <= 0.01) return null;
            const barH = Math.max(2, (val / safeMax) * CH);
            const x = xAt(i, n) - barW / 2;
            const y = PT + CH - barH;
            return <rect key={i} x={x} y={y} width={barW} height={barH}
              fill={colorFn(val)} rx="1.5" opacity="0.9" />;
          })
        ) : (
          // Line chart
          <>
            {/* Area fill */}
            <path
              d={
                `M${xAt(0, n)},${PT + CH} ` +
                data.map((val, i) => `L${xAt(i, n)},${PT + CH * (1 - val / safeMax)}`).join(" ") +
                ` L${xAt(n - 1, n)},${PT + CH} Z`
              }
              fill="url(#windGrad)" opacity="0.15"
            />
            {/* Line */}
            <path
              d={data.map((val, i) => {
                const x = xAt(i, n);
                const y = PT + CH * (1 - val / safeMax);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ")}
              fill="none" stroke="#3b82f6" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Peak dots */}
            {data.map((val, i) => {
              if (threshold && val < threshold) return null;
              if (!threshold && val < safeMax * 0.75) return null;
              const x = xAt(i, n);
              const y = PT + CH * (1 - val / safeMax);
              return <circle key={i} cx={x} cy={y} r="3" fill={colorFn(val)} />;
            })}
            <defs>
              <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </>
        )}

        {/* Time axis labels */}
        {timeLabels.map(({ text, x }) => {
          const isNu = text === "Nu";
          const display = isNu ? (typeof window !== "undefined" && window.location.pathname.startsWith("/de") ? "Jetzt" : "Nu") : text;
          return (
            <text key={text + x} x={x} y={H - 4}
              fill={isNu ? "#3b82f6" : "#94a3b8"}
              fontSize="9" textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight={isNu ? "900" : "700"}>
              {display}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function ReedExtremeCharts({ hourly, locale = "nl" }: Props) {
  const isDE = locale === "de";
  const hours = hourly.slice(0, 48);
  if (hours.length === 0) return null;

  const capeData = hours.map(h => h.cape);
  const precipData = hours.map(h => h.precipitation);
  const windData = hours.map(h => h.windSpeed ?? 0);

  const capeMax = Math.max(...capeData);
  const precipMax = Math.max(...precipData);
  const windMax = Math.max(...windData);

  return (
    <div className="space-y-4">
      {/* CAPE */}
      <ChartPanel
        title={isDE ? "Gewitter-Risiko" : "Onweers-kans"}
        maxLabel={capeMax > 1500 ? (isDE ? "Hoch" : "Hoog") : capeMax > 500 ? (isDE ? "Mittel" : "Matig") : (isDE ? "Niedrig" : "Laag")}
        data={capeData}
        hours={hours}
        yMax={2000}
        unit=""
        threshold={1000}
        thresholdLabel={isDE ? "Achtung" : "Pas op"}
        colorFn={(v) => v > 1500 ? "#dc2626" : v > 500 ? "#ea580c" : "#f59e0b"}
      />

      {/* Neerslag */}
      <ChartPanel
        title={isDE ? "Regen" : "Regen"}
        maxLabel={`${precipMax.toFixed(1)}`}
        data={precipData}
        hours={hours}
        yMax={10}
        unit="mm"
        threshold={5}
        thresholdLabel={isDE ? "Starker Regen" : "Zware regen"}
        colorFn={(v) => v > 5 ? "#dc2626" : v > 1 ? "#2563eb" : "#60a5fa"}
      />

      {/* Wind */}
      <ChartPanel
        title={isDE ? "Wind" : "Wind"}
        maxLabel={`${windMax.toFixed(0)}`}
        data={windData}
        hours={hours}
        yMax={80}
        unit="km/h"
        threshold={50}
        thresholdLabel={isDE ? "Starker Wind" : "Harde wind"}
        type="line"
        colorFn={(v) => v > 75 ? "#dc2626" : v > 50 ? "#ea580c" : "#3b82f6"}
      />
    </div>
  );
}
