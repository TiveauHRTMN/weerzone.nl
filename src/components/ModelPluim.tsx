"use client";

import type { HourlyForecast } from "@/lib/types";

interface Props {
  hourly: HourlyForecast[]; // verwacht 48 items
  sunrise?: string;
  sunset?: string;
}

const MODELS = [
  { key: "harmonie" as const, label: "Harmonie", color: "#34d399" },
  { key: "icon"     as const, label: "ICON-D2",  color: "#60a5fa" },
  { key: "arome"    as const, label: "Arome",    color: "#fb923c" },
];

// ─── SVG layout ───────────────────────────────────────────────
const W      = 560;
const PL     = 30;   // left padding (y-axis labels)
const PR     = 8;
const PT     = 14;   // top padding
const CW     = W - PL - PR;
const TEMP_H = 150;  // temperature chart height
const GAP    = 10;
const PREC_H = 38;   // precipitation bars height
const AXIS_H = 18;   // time axis text height
const TOTAL_H = PT + TEMP_H + GAP + PREC_H + AXIS_H;

function xAt(i: number, n: number) { return PL + (i / Math.max(n - 1, 1)) * CW; }
function yTemp(val: number, tMin: number, tMax: number) {
  const pct = (val - tMin) / (tMax - tMin || 1);
  return PT + TEMP_H * (1 - pct);
}

function linePath(pts: Array<[number, number]>) {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export default function ModelPluim({ hourly, sunrise, sunset }: Props) {
  const hours = hourly.slice(0, 48);
  const n = hours.length;
  if (n < 4) return null;

  // ── per-model temperature series ──────────────────────────
  const series = {
    harmonie: hours.map(h => h.models?.harmonie?.temperature ?? h.temperature),
    icon:     hours.map(h => h.models?.icon?.temperature     ?? h.temperature),
    arome:    hours.map(h => h.models?.arome?.temperature    ?? h.temperature),
  };

  const allT  = Object.values(series).flat();
  const tMin  = Math.floor(Math.min(...allT)) - 1;
  const tMax  = Math.ceil(Math.max(...allT))  + 1;

  // ── spread (min / max across models per hour) ─────────────
  const bandMin = hours.map((_, i) => Math.min(...MODELS.map(m => series[m.key][i])));
  const bandMax = hours.map((_, i) => Math.max(...MODELS.map(m => series[m.key][i])));

  const bandUpperPts = bandMax.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
  const bandLowerPts = bandMin.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
  const bandPath = linePath(bandUpperPts)
    + " " + [...bandLowerPts].reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
    + " Z";

  // ── temperature Y-axis gridlines ──────────────────────────
  const range = tMax - tMin;
  const step  = range > 14 ? 4 : range > 7 ? 2 : 1;
  const yGrid: number[] = [];
  for (let v = Math.ceil(tMin); v <= Math.floor(tMax); v++) {
    if (v % step === 0) yGrid.push(v);
  }

  // ── precipitation ─────────────────────────────────────────
  const maxPrecip = Math.max(...hours.map(h => h.precipitation), 0.5);
  const prY0      = PT + TEMP_H + GAP + PREC_H;
  const barW      = Math.max(2.5, (CW / n) - 1.5);

  // ── day / night bands ─────────────────────────────────────
  type Band = { x: number; w: number; night: boolean };
  const bands: Band[] = [];
  hours.forEach((h, i) => {
    if (i === n - 1) return;
    const hr = new Date(h.time).getHours();
    let night: boolean;
    if (sunrise && sunset) {
      const t = new Date(h.time).getTime();
      night = t < new Date(sunrise).getTime() || t > new Date(sunset).getTime();
    } else {
      night = hr < 6 || hr >= 21;
    }
    const x  = xAt(i, n);
    const x2 = xAt(i + 1, n);
    const last = bands[bands.length - 1];
    if (last && last.night === night) {
      last.w = x2 - last.x;
    } else {
      bands.push({ x, w: x2 - x, night });
    }
  });

  // ── time axis labels ──────────────────────────────────────
  const axisLabels: { text: string; x: number }[] = [];
  let lastDate = "";
  hours.forEach((h, i) => {
    const d  = new Date(h.time);
    const hr = d.getHours();
    const dateKey = d.toDateString();
    if (i === 0) {
      axisLabels.push({ text: "Nu", x: xAt(i, n) });
      lastDate = dateKey;
      return;
    }
    if (hr === 0 && dateKey !== lastDate) {
      lastDate = dateKey;
      axisLabels.push({ text: d.toLocaleDateString("nl-NL", { weekday: "short" }).toUpperCase(), x: xAt(i, n) });
    } else if (hr === 6 || hr === 12 || hr === 18) {
      axisLabels.push({ text: `${hr}u`, x: xAt(i, n) });
    }
  });

  return (
    <div
      className="rounded-[20px] p-5 space-y-4"
      style={{
        background: "rgba(5,10,30,0.45)",
        border: "1px solid rgba(255,255,255,0.11)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/35 mb-0.5">
            Modelonzekerheid · 3 modellen
          </p>
          <h3 className="text-base font-black text-white leading-none">
            Temperatuur Pluim — 48 uur
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {MODELS.map(m => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div className="w-6 h-[2px] rounded-full" style={{ background: m.color }} />
              <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: m.color }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${TOTAL_H}`}
          className="w-full h-auto"
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Day/night shading */}
          {bands.map((b, i) =>
            b.night ? (
              <rect
                key={i}
                x={b.x} y={PT} width={b.w} height={TEMP_H + GAP + PREC_H}
                fill="rgba(0,0,0,0.18)"
              />
            ) : null
          )}

          {/* Precipitation baseline */}
          <line x1={PL} y1={prY0} x2={W - PR} y2={prY0} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

          {/* Temperature Y-axis gridlines + labels */}
          {yGrid.map(v => {
            const y = yTemp(v, tMin, tMax);
            return (
              <g key={v}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text
                  x={PL - 4} y={y + 3.5}
                  fill="rgba(255,255,255,0.30)"
                  fontSize="9" textAnchor="end"
                  fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700"
                >
                  {v}°
                </text>
              </g>
            );
          })}

          {/* Spread band */}
          <path d={bandPath} fill="rgba(255,255,255,0.055)" />

          {/* Model lines */}
          {MODELS.map(m => {
            const pts = series[m.key].map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
            return (
              <path
                key={m.key}
                d={linePath(pts)}
                fill="none"
                stroke={m.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.88"
              />
            );
          })}

          {/* Precipitation bars */}
          {hours.map((h, i) => {
            if (h.precipitation <= 0.02) return null;
            const barH = Math.max(2, (h.precipitation / maxPrecip) * PREC_H);
            const x    = xAt(i, n) - barW / 2;
            const y    = prY0 - barH;
            const fill = h.precipitation < 0.5 ? "#93c5fd" : h.precipitation < 2 ? "#3b82f6" : "#1d4ed8";
            return (
              <rect key={i} x={x} y={y} width={barW} height={barH} fill={fill} rx="1.5" opacity="0.85">
                <title>{`${new Date(h.time).getHours()}:00 — ${h.precipitation.toFixed(1)} mm`}</title>
              </rect>
            );
          })}

          {/* Time axis */}
          {axisLabels.map(({ text, x }) => (
            <g key={text + x}>
              <line
                x1={x} y1={PT} x2={x} y2={prY0}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
              <text
                x={x} y={prY0 + 13}
                fill={text === "Nu" ? "#fcd34d" : "rgba(255,255,255,0.30)"}
                fontSize="9" textAnchor="middle"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700"
              >
                {text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Footer legend */}
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/25 pt-1 border-t border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span>Onzekerheidsband = spread tussen modellen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2.5 rounded-sm bg-blue-400 opacity-70" />
          <span>Neerslag (mm)</span>
        </div>
      </div>
    </div>
  );
}
