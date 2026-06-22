"use client";

import type { HourlyForecast } from "@/lib/types";
import type { PluimIntelligence } from "@/lib/model-blend";

interface Props {
  hourly: HourlyForecast[]; // verwacht 48 items
  sunrise?: string;
  sunset?: string;
  pluim?: PluimIntelligence | null;
}

const MODELS = [
  { key: "harmonie" as const, label: "Verwachting 1", color: "#059669" },
  { key: "icon"     as const, label: "Verwachting 2", color: "#2563eb" },
  { key: "arome"    as const, label: "Verwachting 3", color: "#ea580c" },
];

// ─── SVG layout ───────────────────────────────────────────────
const W      = 540;
const PL     = 36;   // left padding (y-axis labels)
const PR     = 12;
const PT     = 16;   // top padding
const CW     = W - PL - PR;
const TEMP_H = 180;  // temperature chart height (bigger for readability)
const GAP    = 16;
const PREC_H = 48;   // precipitation bars height
const AXIS_H = 22;   // time axis text height
const TOTAL_H = PT + TEMP_H + GAP + PREC_H + AXIS_H;

function xAt(i: number, n: number) { return PL + (i / Math.max(n - 1, 1)) * CW; }
function yTemp(val: number, tMin: number, tMax: number) {
  const pct = (val - tMin) / (tMax - tMin || 1);
  return PT + TEMP_H * (1 - pct);
}

function linePath(pts: Array<[number, number]>) {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export default function ModelPluim({ hourly, sunrise, sunset, pluim }: Props) {
  const hours = hourly.slice(0, 48);
  const n = hours.length;
  if (n < 4) return null;

  // ── alleen modellen met echte data renderen ────────────────
  const availableModels = MODELS.filter((m) =>
    hours.some((h) => typeof h.models?.[m.key]?.temperature === "number"),
  );

  // ── per-model temperature series ──────────────────────────
  // Een model kan in sommige uren ontbreken (verschillende forecast-lengtes):
  // per uur terugvallen op de basistemperatuur, net als de huidige code.
  const series = Object.fromEntries(
    availableModels.map((m) => [m.key, hours.map((h) => h.models?.[m.key]?.temperature ?? h.temperature)]),
  ) as Record<string, number[]>;

  // ── gewogen hero-lijn ─────────────────────────────────────
  const blended = pluim?.blended?.slice(0, 48) ?? null;
  const showBlend = blended !== null && blended.length === n;

  const allT = [...Object.values(series).flat(), ...(showBlend ? blended : [])];
  if (!allT.length) allT.push(...hours.map((h) => h.temperature));
  const tMin  = Math.floor(Math.min(...allT)) - 1;
  const tMax  = Math.ceil(Math.max(...allT))  + 1;

  // ── spread (min / max across available models per hour) ───
  const showBand = availableModels.length >= 2;
  const bandMin = showBand
    ? hours.map((_, i) => Math.min(...availableModels.map(m => series[m.key][i])))
    : [];
  const bandMax = showBand
    ? hours.map((_, i) => Math.max(...availableModels.map(m => series[m.key][i])))
    : [];

  const bandUpperPts = bandMax.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
  const bandLowerPts = bandMin.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
  const bandPath = showBand
    ? linePath(bandUpperPts)
      + " " + [...bandLowerPts].reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
      + " Z"
    : "";

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
  const barW      = Math.max(3, (CW / n) - 1.5);

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

  // ── onweersvenster (amber band) ───────────────────────────
  const tw = pluim?.thunderWindow ?? null;
  let thunderRect: { x: number; w: number } | null = null;
  if (tw) {
    // Venster kan middernacht kruisen (bv. 22-02): toHour < fromHour betekent
    // van `date` @ fromHour tot de VOLGENDE dag @ toHour.
    const crossesMidnight = tw.toHour < tw.fromHour;
    // toISOString() is UTC; ankeren op 12:00 lokaal zorgt dat de datum de
    // UTC-conversie overleeft voor UTC+1/+2 — niet "versimpelen" naar middernacht.
    const nextDate = (() => {
      const d = new Date(`${tw.date}T12:00:00`);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();
    const idx = hours
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => {
        const hDate = h.time.slice(0, 10);
        const hr = new Date(h.time).getHours();
        if (!crossesMidnight) return hDate === tw.date && hr >= tw.fromHour && hr <= tw.toHour;
        return (hDate === tw.date && hr >= tw.fromHour) || (hDate === nextDate && hr <= tw.toHour);
      })
      .map(({ i }) => i);
    if (idx.length >= 2) {
      const x1 = xAt(idx[0], n);
      const x2 = xAt(idx[idx.length - 1], n);
      thunderRect = { x: x1, w: x2 - x1 };
    }
  }

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
    <div className="va-card va-pluim p-5 sm:p-6 space-y-4">
      {/* Legenda (de titel staat in de sectiekop erboven) */}
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        {showBlend && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[3px] rounded-full" style={{ background: "#0f172a" }} />
            <span className="text-[10px] font-bold text-slate-900">Weerzone-verwachting</span>
          </div>
        )}
        {availableModels.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div className="w-5 h-[3px] rounded-full" style={{ background: m.color }} />
            <span className="text-[10px] font-bold" style={{ color: m.color }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${TOTAL_H}`}
          className="w-full h-auto"
          style={{ display: "block" }}
        >
          {/* Day/night shading */}
          {bands.map((b, i) =>
            b.night ? (
              <rect
                key={i}
                x={b.x} y={PT} width={b.w} height={TEMP_H + GAP + PREC_H}
                fill="#f1f5f9"
              />
            ) : null
          )}

          {/* Thunder window — amber band, achter gridlines en lijnen */}
          {thunderRect && (
            <g>
              <rect x={thunderRect.x} y={PT} width={thunderRect.w} height={TEMP_H + GAP + PREC_H} fill="#f59e0b" opacity="0.12" />
              <line x1={thunderRect.x} y1={PT - 1} x2={thunderRect.x + thunderRect.w} y2={PT - 1} stroke="#f59e0b" strokeWidth="2" opacity="0.7" />
              {thunderRect.w > 30 && (
                <text x={thunderRect.x + thunderRect.w / 2} y={PT + 11} fill="#b45309" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
                  ⚡ VERHOOGDE ONWEERKANS
                </text>
              )}
            </g>
          )}

          {/* Precipitation baseline */}
          <line x1={PL} y1={prY0} x2={W - PR} y2={prY0} stroke="#e2e8f0" strokeWidth="1" />

          {/* Precip label */}
          <text x={PL - 6} y={prY0 - PREC_H / 2 + 3} fill="#94a3b8" fontSize="8" textAnchor="end"
            fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">mm</text>

          {/* Temperature Y-axis gridlines + labels */}
          {yGrid.map(v => {
            const y = yTemp(v, tMin, tMax);
            return (
              <g key={v}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text
                  x={PL - 6} y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="10" textAnchor="end"
                  fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700"
                >
                  {v}°
                </text>
              </g>
            );
          })}

          {/* Spread band — alleen bij 2+ modellen */}
          {showBand && <path d={bandPath} fill="#e2e8f0" opacity="0.6" />}

          {/* Model lines — gedempt wanneer een hero-lijn aanwezig is */}
          {availableModels.map(m => {
            const pts = series[m.key].map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
            return (
              <path
                key={m.key}
                d={linePath(pts)}
                fill="none"
                stroke={m.color}
                strokeWidth={showBlend ? "1.6" : "2.2"}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={showBlend ? "0.55" : "1"}
              />
            );
          })}

          {/* Hero: gewogen Weerzone-lijn — bovenop alle andere lijnen */}
          {showBlend && (() => {
            const pts = blended.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
            const [endX, endY] = pts[pts.length - 1];
            return (
              <g>
                <path d={linePath(pts)} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={endX} cy={endY} r="3.5" fill="#0f172a" />
              </g>
            );
          })()}

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
                stroke="#cbd5e1"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
              <text
                x={x} y={prY0 + 16}
                fill={text === "Nu" ? "#2563eb" : "#64748b"}
                fontSize="10" textAnchor="middle"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight={text === "Nu" ? "900" : "700"}
              >
                {text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Insight-regel */}
      {pluim?.insight && (
        <p className="text-[11px] font-semibold leading-relaxed text-slate-500">{pluim.insight}</p>
      )}

      {/* Footer legend */}
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 flex-wrap">
          {showBand && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-slate-200" />
              <span>Grijs = marge</span>
            </div>
          )}
          {thunderRect && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-400/40" />
              <span>Verhoogde onweerkans</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span>Neerslag (mm)</span>
        </div>
      </div>
    </div>
  );
}
