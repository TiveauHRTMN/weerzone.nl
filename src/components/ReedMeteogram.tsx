"use client";

import { useState } from "react";
import type { ReedLayer, ReedMoment } from "@/lib/reed-expert-reading";
import type { HourlyForecast } from "@/lib/types";

const SEV_COLOR: Record<string, string> = {
  rustig: "#2f6bed", oplettend: "#e08a08", onrustig: "#e0701a", code: "#e23b34",
};

const W = 520, H = 96, PL = 40, PR = 14, PT = 14, PB = 20;
const CW = W - PL - PR, CH = H - PT - PB;

function xAt(i: number, n: number) { return PL + (i / Math.max(n - 1, 1)) * CW; }

function Panel({ layer, hours, active, onScrub }: {
  layer: ReedLayer; hours: HourlyForecast[]; active: number | null; onScrub: (i: number | null) => void;
}) {
  const n = layer.series.length;
  const lo = layer.min ?? 0;
  const hi = Math.max(layer.max, ...layer.series, 1);
  const range = hi - lo || 1;
  const yOf = (v: number) => PT + CH * (1 - (v - lo) / range);
  const color = SEV_COLOR[layer.severity] ?? "#2f6bed";
  const barW = Math.max(2, CW / n - 2);
  const gradId = `meteo-${layer.key}`;

  return (
    <div className="va-meteo-panel">
      <div className="va-meteo-panel-head">
        <span className="va-meteo-title">{layer.title}</span>
        <span className="va-meteo-phrase" style={{ color }}>{layer.phrase}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`} className="va-meteo-svg" preserveAspectRatio="none"
        onMouseLeave={() => onScrub(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PL) / CW) * (n - 1));
          onScrub(Math.max(0, Math.min(n - 1, i)));
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.touches[0].clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PL) / CW) * (n - 1));
          onScrub(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {layer.threshold != null && layer.threshold > lo && layer.threshold < hi && (
          <line x1={PL} y1={yOf(layer.threshold)} x2={W - PR} y2={yOf(layer.threshold)}
            stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        )}

        {layer.type === "bar" ? (
          layer.series.map((v, i) => {
            if (v <= 0.01) return null;
            const bh = Math.max(1.5, (v - lo) / range * CH);
            return <rect key={i} x={xAt(i, n) - barW / 2} y={PT + CH - bh} width={barW} height={bh} rx="1.5" fill={color} opacity="0.85" />;
          })
        ) : (
          <>
            <path d={`M${xAt(0, n)},${PT + CH} ` + layer.series.map((v, i) => `L${xAt(i, n).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ") + ` L${xAt(n - 1, n)},${PT + CH} Z`} fill={`url(#${gradId})`} />
            <path d={layer.series.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {active != null && (
          <>
            <line x1={xAt(active, n)} y1={PT} x2={xAt(active, n)} y2={PT + CH} stroke="#0f172a" strokeWidth="1" opacity="0.25" />
            <circle cx={xAt(active, n)} cy={yOf(layer.series[active])} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
          </>
        )}

        <text x={PL - 6} y={PT + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="700">{Math.round(hi)}</text>
        <text x={PL - 6} y={PT + CH} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="700">{Math.round(lo)}</text>
      </svg>
    </div>
  );
}

export default function ReedMeteogram({ layers, moments, hours }: {
  layers: ReedLayer[]; moments: ReedMoment[]; hours: HourlyForecast[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = hours.length;
  if (n === 0) return null;
  const readoutHour = active != null ? hours[active] : null;

  return (
    <div className="va-card va-meteo">
      <div className="va-meteo-readout" aria-live="polite">
        {readoutHour ? (
          <>
            <strong>{readoutHour.time.slice(11, 16)}</strong>
            <span>
              {layers.map((l) => `${l.title.replace(/\s*\(.*\)/, "")} ${Math.round(l.series[active!])}${l.unit}`).join(" · ")}
            </span>
          </>
        ) : (
          <span className="va-meteo-hint">Beweeg over het meteogram voor de cijfers per uur.</span>
        )}
      </div>

      {moments.length > 0 && (
        <ul className="va-meteo-moments">
          {moments.map((m) => (
            <li key={m.kind + m.hourIndex} style={{ "--mc": SEV_COLOR[m.severity] } as React.CSSProperties}>
              <span className="va-meteo-moment-dot" />
              <strong>{m.label}</strong>
              <span>{m.detail}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="va-meteo-panels">
        {layers.map((l) => (
          <Panel key={l.key} layer={l} hours={hours} active={active} onScrub={setActive} />
        ))}
      </div>

      <div className="va-meteo-axis">
        {hours.map((h, i) => (i % 6 === 0 ? <span key={i} style={{ left: `${(i / Math.max(n - 1, 1)) * 100}%` }}>{i === 0 ? "nu" : `${new Date(h.time).getHours()}u`}</span> : null))}
      </div>
    </div>
  );
}
