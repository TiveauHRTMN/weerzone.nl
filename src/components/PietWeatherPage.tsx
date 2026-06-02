"use client";

/**
 * Piet · Mijn Weer
 * High-fidelity recreation of design_handoff_reed_piet (Piet page).
 * Visual-first demo content, EXCEPT the regenradar slot which hosts the
 * real live RainViewer radar (same source as RainMap), keyed off the
 * visitor's location. Styling: src/app/(site)/piet/piet-skin.css.
 */

import { Fragment, Suspense, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { kindFromCode } from "@/lib/piet-view";
import type { PietView, PietDay, PietScore, PietPollenRow } from "@/lib/piet-view";

const WeatherBackground = dynamic(() => import("./WeatherBackground"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />,
});

/* ---------- Lucide-style inline icons ---------- */
type IconProps = {
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
};
const Icon = ({ size = 16, stroke = 2, children, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);
type IP = Omit<IconProps, "children">;
const IcSun = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);
const IcCloud = (p: IP) => (
  <Icon {...p}>
    <path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.75A6 6 0 0 0 4 11.5 4.5 4.5 0 0 0 6.5 19h11z" />
  </Icon>
);
const IcCloudSun = (p: IP) => (
  <Icon {...p}>
    <path d="M12 2v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="M20 12h2" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
    <path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />
  </Icon>
);
const IcCloudRain = (p: IP) => (
  <Icon {...p}>
    <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.65 1.66A4.5 4.5 0 0 0 5 15" />
    <line x1="8" y1="19" x2="8" y2="21" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="16" y1="19" x2="16" y2="21" />
  </Icon>
);
const IcWind = (p: IP) => (
  <Icon {...p}>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
    <path d="M17.73 6.27A2.5 2.5 0 1 1 19.5 10H2" />
    <path d="M14.05 17.73A2.5 2.5 0 1 0 15.5 14H2" />
  </Icon>
);
const IcSunrise = (p: IP) => (
  <Icon {...p}>
    <path d="M12 2v8" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="M2 18h2" />
    <path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M22 22H2" />
    <path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </Icon>
);
const IcSunset = (p: IP) => (
  <Icon {...p}>
    <path d="M12 10V2" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="M2 18h2" />
    <path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M22 22H2" />
    <path d="m16 6-4 4-4-4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </Icon>
);
const IcLeaf = (p: IP) => (
  <Icon {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 5.4-.74 9.06-3 11.94" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </Icon>
);
const IcShirt = (p: IP) => (
  <Icon {...p}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </Icon>
);
const IcBike = (p: IP) => (
  <Icon {...p}>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
  </Icon>
);
const IcCoffee = (p: IP) => (
  <Icon {...p}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </Icon>
);
const IcFlame = (p: IP) => (
  <Icon {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Icon>
);
const IcGps = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </Icon>
);
const IcArrowDn = (p: IP) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </Icon>
);
const IcArrowUp = (p: IP) => (
  <Icon {...p}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </Icon>
);
const IcCheck = (p: IP) => (
  <Icon {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);
const IcExt = (p: IP) => (
  <Icon {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Icon>
);

/* ---------- Reusable bits ---------- */
const Micro = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rmicro ${className}`}>{children}</div>
);
type ChipTone = "yellow" | "orange" | "blue" | "red" | "cyan" | "purple" | "green" | "lime" | "slate";
const Chip = ({ tone = "slate", children, icon = null }: { tone?: ChipTone; children: ReactNode; icon?: ReactNode }) => (
  <span className={`rchip rchip-${tone}`}>
    {icon}
    {children}
  </span>
);
const Dots = ({ value = 3, max = 5, color = "#F59E0B" }: { value?: number; max?: number; color?: string }) => (
  <span className="dots" style={{ color }}>
    {Array.from({ length: max }).map((_, i) => (
      <i key={i} className={i < value ? "on" : ""} />
    ))}
  </span>
);

type HourKind = "sun" | "cloudsun" | "cloud" | "rain";
const HourIcon = ({ k, size = 18 }: { k: HourKind; size?: number }) => {
  if (k === "sun") return <IcSun size={size} stroke={2.2} style={{ color: "#F59E0B" }} />;
  if (k === "cloudsun") return <IcCloudSun size={size} stroke={2.2} style={{ color: "#64748B" }} />;
  if (k === "cloud") return <IcCloud size={size} stroke={2.2} style={{ color: "#64748B" }} />;
  if (k === "rain") return <IcCloudRain size={size} stroke={2.2} style={{ color: "#2563EB" }} />;
  return null;
};

/* ---------- 1. Piet hero ---------- */
function chipToneForKind(k: HourKind): ChipTone {
  return k === "rain" ? "blue" : k === "sun" ? "yellow" : "slate";
}
function PietHero({ view }: { view: PietView }) {
  const { now, days, locationName, headline } = view;
  const k = kindFromCode(now.weatherCode);
  const [lead, ...restParts] = headline.split(", ");
  const rest = restParts.join(", ");
  return (
    <div className="rcard p-7 sm:p-9 relative overflow-hidden">
      <div
        className="absolute -right-12 -top-12 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(250,204,21,.35), transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Micro>Piet&apos;s verhaal · {locationName}</Micro>
            <span className="livechip">
              <i />
              Live · {now.updatedAt}
            </span>
          </div>
          <Chip tone={chipToneForKind(k)} icon={<HourIcon k={k} size={11} />}>
            {now.conditionLabel}
          </Chip>
        </div>

        <h1
          className="mt-5 text-[32px] sm:text-[42px] leading-[1.05] font-extrabold text-slate-900"
          style={{ letterSpacing: "-0.028em" }}
        >
          {lead}
          {rest && (
            <>
              {", "}
              <span
                style={{
                  background: "linear-gradient(90deg,#F59E0B 0%, #F97316 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {rest.replace(/\.$/, "")}
              </span>
              .
            </>
          )}
        </h1>

        <div className="mt-6 flex items-end gap-6 flex-wrap">
          <div className="leading-none">
            <div className="num font-extrabold text-slate-900" style={{ fontSize: "76px", letterSpacing: "-0.045em", lineHeight: 1 }}>
              {now.temp}<span style={{ color: "#94A3B8" }}>°</span>
            </div>
          </div>
          <div className="text-[14px] text-slate-600 mb-1">
            <div className="font-bold text-slate-900">Voelt als {now.feelsLike}°</div>
            <div className="mt-0.5">{now.conditionLabel} · wind {now.windDir} {now.windSpeed} km/u</div>
            <div className="mt-0.5">Vandaag max {days.vd.max}° · vannacht {days.vd.min}°</div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <button className="locpill lift">
            <IcGps size={14} /> <span>Andere plek? Gebruik GPS</span>
          </button>
          <span className="text-[13.5px] text-slate-500">
            Locatie: <b className="text-slate-900">{locationName}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function PietWeerberichtCard({ view, lat, lon }: { view: PietView; lat: number; lon: number }) {
  const fallback = [
    view.days.vd.story,
    view.days.mo.story && view.days.mo.story !== view.days.vd.story
      ? `${view.days.mo.weekday}: ${view.days.mo.story}`
      : "",
  ].filter(Boolean).join("\n\n");
  const [forecast, setForecast] = useState(fallback);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);

    fetch(`/api/piet-weerbericht?lat=${lat}&lon=${lon}&city=${encodeURIComponent(view.locationName)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d === "string" && d.trim()) {
          setForecast(d.trim());
          setEnhanced(true);
        }
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lat, lon, view.locationName]);

  const paragraphs = forecast.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mt-6 rcard p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Micro>Piet Weerbericht · KNMI + Mariana</Micro>
        <span className="livechip">
          <i />
          {enhanced ? "DeepSeek V4 Flash" : "Snelle versie"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[15px] leading-relaxed text-slate-700 max-w-[62ch]">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Elke 30 minuten bijgewerkt
      </div>
    </div>
  );
}

/* ---------- 2. 48-uurs briefing ---------- */
function Briefing48h({ days }: { days: { vd: PietDay; mo: PietDay } }) {
  const [day, setDay] = useState<"vd" | "mo">("vd");
  const d = days[day];
  return (
    <div className="mt-6 rcard overflow-hidden">
      <div className="px-5 sm:px-7 pt-6 pb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Micro>48 uur · dagkaart</Micro>
          <div className="day-tabs">
            <button className="day-tab" data-active={day === "vd"} onClick={() => setDay("vd")}>
              <span>Vandaag</span>
            </button>
            <button className="day-tab" data-active={day === "mo"} onClick={() => setDay("mo")}>
              <span>Morgen</span>
            </button>
          </div>
        </div>

        <h2
          className="mt-4 text-[22px] sm:text-[26px] leading-[1.1] font-extrabold tracking-tight text-slate-900"
          style={{ letterSpacing: "-0.024em" }}
        >
          {d.tagline}
        </h2>
        <div className="mt-1 text-[13px] text-slate-500 num">{d.date}</div>

        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Chip tone="orange">
            <b className="num">{d.max}°</b> max
          </Chip>
          <Chip tone="cyan">
            <b className="num">{d.min}°</b> min
          </Chip>
          <Chip tone={d.regen >= 50 ? "blue" : "slate"} icon={<IcCloudRain size={11} stroke={2.4} />}>
            <b className="num">{d.regen}%</b> regen
          </Chip>
          <Chip tone="slate" icon={<IcWind size={11} stroke={2.4} />}>
            <b className="num">{d.wind}</b> km/u
          </Chip>
          <Chip tone="yellow" icon={<IcSun size={11} stroke={2.4} />}>
            <b className="num">{d.zon} u</b> zon
          </Chip>
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-slate-700 max-w-[58ch]">
          {d.story}
          {d.referToReed && (
            <>
              {" "}
              Bij onweer kijk je verder bij{" "}
              <a href="/reed" className="font-bold text-slate-900 underline underline-offset-2">
                Reed
              </a>
              .
            </>
          )}
        </p>
      </div>

      <div className="divider" />

      <div className="px-5 sm:px-7 py-4">
        <Micro className="mb-3">Per twee uur</Micro>
        <div className="hourly flex gap-1.5">
          {d.hourly.map((h, i) => (
            <div key={i} className={`hourly-cell ${h.peak ? "peak" : ""}`}>
              <div className="rmicro text-[10px]" style={{ letterSpacing: ".16em" }}>
                {h.h}
              </div>
              <HourIcon k={h.k} />
              <div className="num font-extrabold text-slate-900 text-[14px]">{h.t}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. Regenradar (live RainViewer) ---------- */
function RegenradarSlot({ lat, lon, locationName }: { lat: number; lon: number; locationName: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1`;
  return (
    <div className="mt-6 rcard overflow-hidden">
      <div className="px-5 sm:px-7 pt-6 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Micro>Regenradar · {locationName} + 50 km</Micro>
          <span className="livechip">
            <i />
            Live
          </span>
        </div>
        <h2 className="mt-2 text-[20px] sm:text-[22px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.02em" }}>
          Komt de bui jouw kant op?
        </h2>
        <p className="mt-1 text-[13.5px] text-slate-500 max-w-[58ch]">
          Realtime regenbeeld voor de komende twee uur. Inzoomen voor je straat.
        </p>
      </div>

      <div className="px-5 sm:px-7 pb-5">
        <div className="radar-slot" style={{ aspectRatio: "5 / 4" }}>
          {mounted ? (
            <iframe
              title={`Live regenradar — ${locationName}`}
              src={src}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 animate-pulse" style={{ background: "#cfe9fb" }} />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-[12.5px] text-slate-500">
          <span>Realtime · update elke ~5 min</span>
          <a
            href={`https://www.rainviewer.com/map.html?loc=${lat},${lon},8`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-700 inline-flex items-center gap-1.5 hover:text-slate-900"
          >
            Open volledig <IcExt size={11} stroke={2.4} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. Dagscores ---------- */
type ScoreTone = "yellow" | "orange" | "cyan" | "lime" | "blue" | "red";
function ScoreCard({
  icon,
  label,
  score,
  max = 5,
  tone = "yellow",
  tip,
}: {
  icon: ReactNode;
  label: string;
  score: number;
  max?: number;
  tone?: ScoreTone;
  tip: string;
}) {
  const fg = { yellow: "#F59E0B", orange: "#F97316", cyan: "#06B6D4", lime: "#65A30D", blue: "#2563EB", red: "#EF4444" }[tone];
  const bg = { yellow: "#FEF3C7", orange: "#FFEDD5", cyan: "#CFFAFE", lime: "#ECFCCB", blue: "#DBEAFE", red: "#FEE2E2" }[tone];
  return (
    <div className="swidget p-4 lift">
      <div className="flex items-center justify-between">
        <span
          className="icon-tile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(180deg,#fff,${bg})`,
            color: fg,
            border: `1px solid ${bg}`,
            boxShadow: "0 1px 0 rgba(255,255,255,.9) inset, 0 1px 2px rgba(15,23,42,.04)",
          }}
        >
          {icon}
        </span>
        <Dots value={score} max={max} color={fg} />
      </div>
      <div className="mt-3 text-[13.5px] font-extrabold text-slate-900 leading-tight">{label}</div>
      <div className="mt-1 text-[12px] text-slate-500 leading-snug min-h-[2.6em]">{tip}</div>
    </div>
  );
}
const SCORE_META: Record<PietScore["key"], { icon: ReactNode; tone: ScoreTone }> = {
  terras: { icon: <IcCoffee size={16} stroke={2.2} />, tone: "yellow" },
  fiets: { icon: <IcBike size={16} stroke={2.2} />, tone: "lime" },
  bbq: { icon: <IcFlame size={16} stroke={2.2} />, tone: "orange" },
  kleding: { icon: <IcShirt size={16} stroke={2.2} />, tone: "cyan" },
};
function DagscoresGrid({ scores }: { scores: PietScore[] }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <Micro>Vandaag in scores</Micro>
        <span className="text-[11.5px] font-semibold text-slate-500">van 0 tot 5</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores.map((s) => (
          <ScoreCard
            key={s.key}
            icon={SCORE_META[s.key].icon}
            tone={SCORE_META[s.key].tone}
            label={s.label}
            score={s.score}
            tip={s.tip}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- 5. UV-index ---------- */
function UVIndex({ uv }: { uv: NonNullable<PietView["uv"]> }) {
  const labelColor = uv.value >= 8 ? "text-red-600" : uv.value >= 6 ? "text-orange-600" : "text-yellow-600";
  return (
    <div className="rcard p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Micro>UV-index</Micro>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="num text-[44px] font-extrabold text-slate-900 leading-none" style={{ letterSpacing: "-0.04em" }}>
              {uv.value}
            </span>
            <span className={`text-[14px] font-extrabold ${labelColor}`}>{uv.label}</span>
          </div>
        </div>
        {uv.peakHour && <Chip tone="orange">Piek {uv.peakHour}</Chip>}
      </div>

      <div className="mt-4 uv-bar">
        <span style={{ background: "#84CC16" }} />
        <span style={{ background: "#FACC15" }} />
        <span style={{ background: "#FB923C" }} />
        <span style={{ background: "#EF4444" }} />
        <span style={{ background: "#A855F7" }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10.5px] font-bold text-slate-400">
        <span>1</span>
        <span>3</span>
        <span>6</span>
        <span>8</span>
        <span>11+</span>
      </div>

      <div className="mt-4 text-[13.5px] text-slate-700 leading-relaxed">
        {uv.value >= 6 ? (
          <>Bescherming nodig in het midden van de dag. SPF 30, pet en zonnebril doen wonderen.</>
        ) : (
          <>Matige zonkracht — bij langdurig buiten zijn helpt wat bescherming.</>
        )}
      </div>
    </div>
  );
}

/* ---------- 6. Hooikoorts ---------- */
function PollenRow({ name, level, advice }: { name: string; level: 1 | 2 | 3 | 4 | 5; advice: string }) {
  const tone: ChipTone = level >= 4 ? "red" : level >= 3 ? "orange" : level >= 2 ? "yellow" : "lime";
  const labels = ["", "Laag", "Matig", "Verhoogd", "Hoog", "Zeer hoog"];
  const dotColor = tone === "red" ? "#EF4444" : tone === "orange" ? "#F97316" : tone === "yellow" ? "#F59E0B" : "#65A30D";
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="icon-tile" style={{ width: 30, height: 30, borderRadius: 9, background: "#F1F5F9", color: "#475569" }}>
        <IcLeaf size={14} stroke={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-slate-900 leading-tight">{name}</div>
        <div className="text-[11.5px] text-slate-500 truncate">{advice}</div>
      </div>
      <Dots value={level} color={dotColor} />
      <Chip tone={tone}>{labels[level]}</Chip>
    </div>
  );
}
function Hooikoorts({ pollen }: { pollen: NonNullable<PietView["pollen"]> }) {
  const topTone: ChipTone = pollen.topLabel === "Zeer hoog" || pollen.topLabel === "Hoog" ? "red" : "orange";
  return (
    <div className="rcard p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Micro>Hooikoorts · pollen vandaag</Micro>
          <div className="mt-1.5 text-[16.5px] font-extrabold text-slate-900" style={{ letterSpacing: "-0.01em" }}>
            {pollen.headline}
          </div>
        </div>
        <Chip tone={topTone}>{pollen.topLabel}</Chip>
      </div>

      <div className="mt-3 divide-y" style={{ borderColor: "rgba(15,23,42,.05)" }}>
        {pollen.rows.map((r) => (
          <PollenRow key={r.name} name={r.name} level={r.level} advice={r.advice} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 7. Vandaag vs morgen ---------- */
function CmpRow({ label, today, tomorrow, arrow }: { label: string; today: string; tomorrow: string; arrow?: "up" | "down" }) {
  return (
    <div className="cmp-row">
      <span className="lbl">{label}</span>
      <span className="v today num text-right">{today}</span>
      <span className="arrow">
        {arrow === "up" && <IcArrowUp size={13} stroke={2.4} style={{ color: "#EF4444" }} />}
        {arrow === "down" && <IcArrowDn size={13} stroke={2.4} style={{ color: "#22C55E" }} />}
        {!arrow && <span className="text-slate-300">·</span>}
      </span>
      <span className="v tomorrow num">{tomorrow}</span>
    </div>
  );
}
function cmpArrow(today: number, tomorrow: number): "up" | "down" | undefined {
  if (tomorrow > today) return "up";
  if (tomorrow < today) return "down";
  return undefined;
}
function VandaagVsMorgen({ days }: { days: { vd: PietDay; mo: PietDay } }) {
  const { vd, mo } = days;
  return (
    <div className="mt-6 rcard p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Micro>Vandaag vs. morgen</Micro>
        <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em]">
          <span className="text-slate-700">{vd.weekday}</span>
          <span className="text-slate-300">→</span>
          <span className="text-blue-700">{mo.weekday}</span>
        </div>
      </div>

      <div className="mt-3">
        <CmpRow label="Max" today={`${vd.max}°`} tomorrow={`${mo.max}°`} arrow={cmpArrow(vd.max, mo.max)} />
        <CmpRow label="Min" today={`${vd.min}°`} tomorrow={`${mo.min}°`} arrow={cmpArrow(vd.min, mo.min)} />
        <CmpRow label="Regenkans" today={`${vd.regen}%`} tomorrow={`${mo.regen}%`} arrow={cmpArrow(vd.regen, mo.regen)} />
        <CmpRow label="Wind" today={`${vd.wind} km/u`} tomorrow={`${mo.wind} km/u`} arrow={cmpArrow(vd.wind, mo.wind)} />
        <CmpRow label="Zon" today={`${vd.zon} uur`} tomorrow={`${mo.zon} uur`} arrow={cmpArrow(vd.zon, mo.zon)} />
      </div>
    </div>
  );
}

/* ---------- 8. Dagdelen ---------- */
function DDCell({ k, t, label }: { k: HourKind; t: number; label: string }) {
  return (
    <div className="dd-cell">
      <HourIcon k={k} size={20} />
      <div className="num font-extrabold text-slate-900 text-[14px]">{t}°</div>
      <div className="text-[10.5px] text-slate-500 font-semibold">{label}</div>
    </div>
  );
}
function Dagdelen({ days }: { days: { vd: PietDay; mo: PietDay } }) {
  const rows = [days.vd, days.mo];
  return (
    <div className="mt-6 rcard p-5 sm:p-6">
      <Micro className="mb-3">Per dagdeel</Micro>
      <div className="dagdelen">
        <div className="dd-head"></div>
        <div className="dd-head">Ochtend</div>
        <div className="dd-head">Middag</div>
        <div className="dd-head">Avond</div>

        {rows.map((d) => (
          <Fragment key={d.key}>
            <div className="dd-day">{d.weekday}</div>
            <DDCell k={d.dagdelen.ochtend.k} t={d.dagdelen.ochtend.t} label={d.dagdelen.ochtend.label} />
            <DDCell k={d.dagdelen.middag.k} t={d.dagdelen.middag.t} label={d.dagdelen.middag.label} />
            <DDCell k={d.dagdelen.avond.k} t={d.dagdelen.avond.t} label={d.dagdelen.avond.label} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------- 9. Zon-tijden ---------- */
function ZonTijden({ sun }: { sun: NonNullable<PietView["sun"]> }) {
  return (
    <div className="mt-6 rcard p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(180deg,#fff,#FEF3C7)", color: "#F59E0B", border: "1px solid #FEF3C7" }}>
            <IcSunrise size={16} stroke={2.2} />
          </span>
          <div>
            <div className="rmicro text-[10px]">Zonsop</div>
            <div className="num text-[18px] font-extrabold text-slate-900 leading-none mt-0.5">{sun.sunrise}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(180deg,#fff,#FFEDD5)", color: "#F97316", border: "1px solid #FFEDD5" }}>
            <IcSunset size={16} stroke={2.2} />
          </span>
          <div>
            <div className="rmicro text-[10px]">Zonsonder</div>
            <div className="num text-[18px] font-extrabold text-slate-900 leading-none mt-0.5">{sun.sunset}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(180deg,#fff,#DBEAFE)", color: "#2563EB", border: "1px solid #DBEAFE" }}>
            <IcSun size={16} stroke={2.2} />
          </span>
          <div>
            <div className="rmicro text-[10px]">Daglengte</div>
            <div className="num text-[18px] font-extrabold text-slate-900 leading-none mt-0.5">{sun.dayLength}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Footer trust ---------- */
function FooterTrust() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 flex-wrap text-[12.5px] text-slate-700">
      <div className="flex items-center gap-2">
        <IcCheck size={14} stroke={2.4} style={{ color: "#15803D" }} />
        <span>
          Piet draait op <b className="text-slate-900">Mariana</b> &amp; <b className="text-slate-900">Oracle</b> — KNMI,
          ECMWF, HARMONIE, ICON-D2 &amp; pollen-meetnet.
        </span>
      </div>
      <a href="/over" className="font-bold text-slate-900 inline-flex items-center gap-1">
        Over Piet <IcExt size={11} stroke={2.4} />
      </a>
    </div>
  );
}

/* ---------- Page ---------- */
export default function PietWeatherPage({
  view,
  fontClassName = "",
  weatherCode = 0,
  isDay = true,
  lat = 52.1,
  lon = 5.18,
}: {
  view: PietView;
  fontClassName?: string;
  weatherCode?: number;
  isDay?: boolean;
  lat?: number;
  lon?: number;
}) {
  const { uv, pollen } = view;
  return (
    <main className={`piet-skin relative min-h-screen ${fontClassName}`}>
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />}>
        <WeatherBackground weatherCode={weatherCode} isDay={isDay} />
      </Suspense>
      <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-6 sm:py-10 piet-stagger">
        <PietHero view={view} />
        <PietWeerberichtCard view={view} lat={lat} lon={lon} />
        <RegenradarSlot lat={lat} lon={lon} locationName={view.locationName} />
        <Briefing48h days={view.days} />
        <DagscoresGrid scores={view.scores} />
        {(uv || pollen) && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uv && <UVIndex uv={uv} />}
            {pollen && <Hooikoorts pollen={pollen} />}
          </div>
        )}
        <VandaagVsMorgen days={view.days} />
        <Dagdelen days={view.days} />
        {view.sun && <ZonTijden sun={view.sun} />}
        <FooterTrust />
      </div>
    </main>
  );
}
