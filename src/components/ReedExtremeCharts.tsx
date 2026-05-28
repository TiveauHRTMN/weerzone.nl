"use client";

import { usePathname } from "next/navigation";
import { detectLocale } from "@/config/locales";
import type { HourlyForecast } from "@/lib/types";

type ChartLocale = "nl" | "de" | "fr" | "es";

interface Props {
  hourly: HourlyForecast[];
  locale?: ChartLocale;
}

const COPY: Record<ChartLocale, {
  now: string;
  thunder: string;
  high: string;
  medium: string;
  low: string;
  attention: string;
  rain: string;
  heavyRain: string;
  wind: string;
  strongWind: string;
  dewPoint: string;
  dewPointMuggy: string;
  dewPointComfortable: string;
  cin: string;
  cinStrong: string;
  cinWeak: string;
  windShear: string;
  windShearHigh: string;
}> = {
  nl: { 
    now: "Nu", 
    thunder: "Onweers-kans (CAPE)", 
    high: "Hoog", 
    medium: "Matig", 
    low: "Laag", 
    attention: "Pas op", 
    rain: "Regen", 
    heavyRain: "Zware regen", 
    wind: "Wind", 
    strongWind: "Harde wind",
    dewPoint: "Vocht (Dauwpunt)",
    dewPointMuggy: "Broeierig",
    dewPointComfortable: "Comfortabel",
    cin: "Inversie-deksel (CIN)",
    cinStrong: "Sterk deksel (onderdrukt stormen)",
    cinWeak: "Zwak deksel (stormgevaar)",
    windShear: "Windschering (0-80m)",
    windShearHigh: "Stormorganisatie",
    liftedIndex: "Stabiliteit (Lifted Index)",
    liftedIndexExtremelyUnstable: "Extreem onstabiel (storm)",
    liftedIndexStable: "Stabiel"
  },
  de: { 
    now: "Jetzt", 
    thunder: "Gewitter-Risiko", 
    high: "Hoch", 
    medium: "Mittel", 
    low: "Niedrig", 
    attention: "Achtung", 
    rain: "Regen", 
    heavyRain: "Starker Regen", 
    wind: "Wind", 
    strongWind: "Starker Wind",
    dewPoint: "Feuchtigkeit (Taupunkt)",
    dewPointMuggy: "Schwül",
    dewPointComfortable: "Angenehm",
    cin: "Inversionsdeckel (CIN)",
    cinStrong: "Starker Deckel",
    cinWeak: "Schwacher Deckel",
    windShear: "Windscherung (0-80m)",
    windShearHigh: "Sturmorganisation",
    liftedIndex: "Stabilität (Lifted Index)",
    liftedIndexExtremelyUnstable: "Extrem labil (Sturm)",
    liftedIndexStable: "Stabil"
  },
  fr: { 
    now: "Maint.", 
    thunder: "Risque d'orage", 
    high: "Eleve", 
    medium: "Modere", 
    low: "Faible", 
    attention: "Attention", 
    rain: "Pluie", 
    heavyRain: "Fortes pluies", 
    wind: "Vent", 
    strongWind: "Vent fort",
    dewPoint: "Humidité (Point de rosée)",
    dewPointMuggy: "Lourd/Humide",
    dewPointComfortable: "Agréable",
    cin: "Inhibition convective (CIN)",
    cinStrong: "Couvercle solide",
    cinWeak: "Couvercle faible",
    windShear: "Cisaillement du vent",
    windShearHigh: "Organisation d'orage",
    liftedIndex: "Stabilité (Lifted Index)",
    liftedIndexExtremelyUnstable: "Extrêmement instable",
    liftedIndexStable: "Stable"
  },
  es: { 
    now: "Ahora", 
    thunder: "Riesgo de tormenta", 
    high: "Alto", 
    medium: "Moderado", 
    low: "Bajo", 
    attention: "Atencion", 
    rain: "Lluvia", 
    heavyRain: "Lluvia fuerte", 
    wind: "Viento", 
    strongWind: "Viento fuerte",
    dewPoint: "Humedad (Punto de rocío)",
    dewPointMuggy: "Bochornoso",
    dewPointComfortable: "Confortable",
    cin: "Inhibición convectiva (CIN)",
    cinStrong: "Tapa fuerte",
    cinWeak: "Tapa débil",
    windShear: "Cizalladura del viento",
    windShearHigh: "Organización",
    liftedIndex: "Estabilidad (Lifted Index)",
    liftedIndexExtremelyUnstable: "Extremadamente inestable",
    liftedIndexStable: "Estable"
  },
};

const W = 480;
const H = 120;
const PL = 36;
const PR = 12;
const PT = 12;
const PB = 24;
const CW = W - PL - PR;
const CH = H - PT - PB;

function formatHour(iso: string, locale: ChartLocale): string {
  const hr = new Date(iso).getHours();
  return locale === "nl" ? `${hr}u` : `${hr}h`;
}

function xAt(i: number, n: number) {
  return PL + (i / Math.max(n - 1, 1)) * CW;
}

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
  locale = "nl",
  strokeColor = "#3b82f6",
  gradientId = "windGrad",
  minVal,
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
  locale?: ChartLocale;
  strokeColor?: string;
  gradientId?: string;
  minVal?: number;
}) {
  const n = data.length;
  const safeMin = minVal ?? 0;
  const safeMax = Math.max(yMax, ...data, 1);
  const range = safeMax - safeMin;
  const yMid = Math.round((safeMax + safeMin) / 2);
  const yLabels = [
    { val: safeMin, y: PT + CH },
    { val: yMid, y: PT + CH * (1 - (yMid - safeMin) / range) },
    { val: Math.round(safeMax), y: PT },
  ];

  const timeLabels: { text: string; x: number }[] = [];
  hours.forEach((h, i) => {
    const hr = new Date(h.time).getHours();
    if (i === 0) timeLabels.push({ text: "now", x: xAt(i, n) });
    else if (hr % 6 === 0) timeLabels.push({ text: formatHour(h.time, locale), x: xAt(i, n) });
  });

  const barW = Math.max(3, (CW / n) - 2);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</span>
        <span className="text-[11px] font-bold text-slate-400">{maxLabel} {unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ display: "block" }}>
        {yLabels.map(({ val, y }) => (
          <g key={val}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 6} y={y + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">
              {val}
            </text>
          </g>
        ))}

        {threshold != null && threshold < safeMax && threshold > safeMin && (() => {
          const ty = PT + CH * (1 - (threshold - safeMin) / range);
          return (
            <g>
              <line x1={PL} y1={ty} x2={W - PR} y2={ty} stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
              {thresholdLabel && (
                <text x={W - PR} y={ty - 4} fill="#f43f5e" fontSize="8" textAnchor="end" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700" opacity="0.7">
                  {thresholdLabel}
                </text>
              )}
            </g>
          );
        })()}

        {type === "bar" ? (
          data.map((val, i) => {
            if (val <= 0.01) return null;
            const barH = Math.max(2, (val / safeMax) * CH);
            const x = xAt(i, n) - barW / 2;
            const y = PT + CH - barH;
            return <rect key={i} x={x} y={y} width={barW} height={barH} fill={colorFn(val)} rx="1.5" opacity="0.9" />;
          })
        ) : (
          <>
            <path
              d={`M${xAt(0, n)},${PT + CH} ` + data.map((val, i) => `L${xAt(i, n)},${PT + CH * (1 - (val - safeMin) / range)}`).join(" ") + ` L${xAt(n - 1, n)},${PT + CH} Z`}
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <path
              d={data.map((val, i) => {
                const x = xAt(i, n);
                const y = PT + CH * (1 - (val - safeMin) / range);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ")}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((val, i) => {
              const isNegativeChart = safeMin < 0;
              const isImportant = isNegativeChart 
                ? (threshold != null ? val <= threshold : val < 0)
                : (threshold != null ? val >= threshold : val >= safeMax * 0.75);
              if (!isImportant) return null;
              const x = xAt(i, n);
              const y = PT + CH * (1 - (val - safeMin) / range);
              return <circle key={i} cx={x} cy={y} r="3" fill={colorFn(val)} />;
            })}
            <defs>
              <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dewPointGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="cinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="shearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="liftedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </>
        )}

        {timeLabels.map(({ text, x }) => {
          const isNow = text === "now";
          const display = isNow ? COPY[locale].now : text;
          return (
            <text key={text + x} x={x} y={H - 4} fill={isNow ? "#3b82f6" : "#94a3b8"} fontSize="9" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={isNow ? "900" : "700"}>
              {display}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ReedExtremeCharts({ hourly, locale }: Props) {
  const pathname = usePathname() ?? "/";
  const activeLocale = locale ?? detectLocale(pathname);
  const copy = COPY[activeLocale];
  const hours = hourly.slice(0, 48);
  if (hours.length === 0) return null;

  const capeData = hours.map((h) => h.cape);
  const precipData = hours.map((h) => h.precipitation);
  const windData = hours.map((h) => h.windSpeed ?? 0);

  const dewPointData = hours.map((h) => h.dewPoint ?? 0);
  const cinData = hours.map((h) => h.cin ?? 0);
  const windShearData = hours.map((h) => h.windShear ?? 0);
  const liftedIndexData = hours.map((h) => h.liftedIndex ?? 0);

  const capeMax = Math.max(...capeData);
  const precipMax = Math.max(...precipData);
  const windMax = Math.max(...windData);

  const dewPointMax = Math.max(...dewPointData);
  const cinMax = Math.max(...cinData);
  const windShearMax = Math.max(...windShearData);
  const liftedIndexMin = Math.min(...liftedIndexData);

  const hasDewPoint = hours.some((h) => h.dewPoint !== undefined);
  const hasCin = hours.some((h) => h.cin !== undefined);
  const hasWindShear = hours.some((h) => h.windShear !== undefined);
  const hasLiftedIndex = hours.some((h) => h.liftedIndex !== undefined);

  return (
    <div className="space-y-4">
      <ChartPanel
        title={copy.thunder}
        maxLabel={capeMax > 1500 ? copy.high : capeMax > 500 ? copy.medium : copy.low}
        data={capeData}
        hours={hours}
        yMax={2000}
        unit=""
        threshold={1000}
        thresholdLabel={copy.attention}
        colorFn={(v) => v > 1500 ? "#dc2626" : v > 500 ? "#ea580c" : "#f59e0b"}
        locale={activeLocale}
      />
      
      {hasDewPoint && (
        <ChartPanel
          title={copy.dewPoint}
          maxLabel={`${dewPointMax.toFixed(0)}`}
          data={dewPointData}
          hours={hours}
          yMax={25}
          unit="°C"
          threshold={15}
          thresholdLabel={copy.dewPointMuggy}
          type="line"
          strokeColor="#059669"
          gradientId="dewPointGrad"
          colorFn={(v) => v >= 18 ? "#dc2626" : v >= 15 ? "#ea580c" : "#059669"}
          locale={activeLocale}
        />
      )}

      {hasCin && (
        <ChartPanel
          title={copy.cin}
          maxLabel={`${cinMax.toFixed(0)}`}
          data={cinData}
          hours={hours}
          yMax={150}
          unit="J/kg"
          threshold={100}
          thresholdLabel={copy.cinStrong}
          type="bar"
          colorFn={(v) => v > 100 ? "#64748b" : v > 35 ? "#94a3b8" : "#ef4444"}
          locale={activeLocale}
        />
      )}

      {hasLiftedIndex && (
        <ChartPanel
          title={copy.liftedIndex}
          maxLabel={liftedIndexMin <= -6 ? copy.liftedIndexExtremelyUnstable : liftedIndexMin < 0 ? copy.cinWeak : copy.liftedIndexStable}
          data={liftedIndexData}
          hours={hours}
          yMax={15}
          unit="°C"
          minVal={-10}
          threshold={0}
          thresholdLabel="Instabiel (< 0)"
          type="line"
          strokeColor="#3b82f6"
          gradientId="liftedGrad"
          colorFn={(v) => v <= -6 ? "#dc2626" : v <= -2 ? "#ea580c" : v < 0 ? "#f59e0b" : "#10b981"}
          locale={activeLocale}
        />
      )}

      {hasWindShear && (
        <ChartPanel
          title={copy.windShear}
          maxLabel={`${windShearMax.toFixed(0)}`}
          data={windShearData}
          hours={hours}
          yMax={50}
          unit={activeLocale === "nl" ? "km/u" : "km/h"}
          threshold={35}
          thresholdLabel={copy.windShearHigh}
          type="line"
          strokeColor="#d97706"
          gradientId="shearGrad"
          colorFn={(v) => v >= 45 ? "#dc2626" : v >= 35 ? "#ea580c" : "#d97706"}
          locale={activeLocale}
        />
      )}

      <ChartPanel
        title={copy.rain}
        maxLabel={`${precipMax.toFixed(1)}`}
        data={precipData}
        hours={hours}
        yMax={10}
        unit="mm"
        threshold={5}
        thresholdLabel={copy.heavyRain}
        colorFn={(v) => v > 5 ? "#dc2626" : v > 1 ? "#2563eb" : "#60a5fa"}
        locale={activeLocale}
      />
      <ChartPanel
        title={copy.wind}
        maxLabel={`${windMax.toFixed(0)}`}
        data={windData}
        hours={hours}
        yMax={80}
        unit="km/h"
        threshold={50}
        thresholdLabel={copy.strongWind}
        type="line"
        colorFn={(v) => v > 75 ? "#dc2626" : v > 50 ? "#ea580c" : "#3b82f6"}
        locale={activeLocale}
      />
    </div>
  );
}
