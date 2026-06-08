"use client";

/**
 * Reed · Waarschuwingen
 * Toont alleen iets als het lokale weer er aanleiding toe geeft (onweer, storm,
 * veel regen). Is het rustig, dan staat er alleen de grote tagline — geen kaart,
 * geen uitleg. Styling: src/app/(site)/reed/reed-skin.css (scoped onder .reed-skin).
 */

import { Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { ReedView, ReedRiskDay, ReedActiveWarning, ReedChip as ReedChipData } from "@/lib/reed-view";
import { persistCity } from "@/lib/persist-city";

// Dynamische, weer-gestuurde achtergrond — zelfde component als /weer.
const WeatherBackground = dynamic(() => import("./WeatherBackground"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />,
});

/**
 * Vraagt de GPS van de browser op, zet de exacte coördinaten via
 * /api/resolve-location om naar de plek waar je écht bent (woonplaats of POI),
 * en herlaadt de pagina.
 */
function locateAndReload(setBusy: (b: boolean) => void) {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
  setBusy(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(`/api/resolve-location?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error("resolve failed");
        const place = await res.json();
        if (!place?.name) throw new Error("no place");
        persistCity({ name: place.name, lat: place.lat ?? lat, lon: place.lon ?? lon });
        window.location.reload();
      } catch {
        setBusy(false);
      }
    },
    () => setBusy(false),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

/* ---------- Lucide-style inline icons (zero-dependency) ---------- */
type IconProps = {
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
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
const IcAlert = (p: IP) => (
  <Icon {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);
const IcBolt = (p: IP) => (
  <Icon {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
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
const IcInfo = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icon>
);
const IcArrow = (p: IP) => (
  <Icon {...p}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </Icon>
);
const IcChevL = (p: IP) => (
  <Icon {...p}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
);
const IcChevR = (p: IP) => (
  <Icon {...p}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);
const IcClock = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </Icon>
);
const IcCheck = (p: IP) => (
  <Icon {...p}>
    <polyline points="20 6 9 17 4 12" />
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

/* ---------- Reusable bits ---------- */
const Micro = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rmicro ${className}`}>{children}</div>
);

type CodeTone = "green" | "amber" | "orange" | "red";
const CodePill = ({ tone = "amber", children }: { tone?: CodeTone; children: ReactNode }) => {
  const colors = {
    green: { dot: "#22C55E", bg: "#DCFCE7", fg: "#15803D" },
    amber: { dot: "#F59E0B", bg: "#FEF3C7", fg: "#92400E" },
    orange: { dot: "#F97316", bg: "#FFEDD5", fg: "#9A3412" },
    red: { dot: "#EF4444", bg: "#FEE2E2", fg: "#B91C1C" },
  }[tone];
  return (
    <span className="codepill" style={{ background: colors.bg, color: colors.fg }}>
      <span className="dot" style={{ background: colors.dot, boxShadow: `0 0 0 3px ${colors.bg}` }} />
      <span>{children}</span>
    </span>
  );
};

type ChipTone =
  | "orange"
  | "blue"
  | "red"
  | "cyan"
  | "purple"
  | "green"
  | "amber"
  | "slate"
  | "onorange";
const Chip = ({
  tone = "slate",
  label,
  value,
  icon = null,
}: {
  tone?: ChipTone;
  label?: string;
  value: ReactNode;
  icon?: ReactNode;
}) => (
  <span className={`rchip rchip-${tone}`}>
    {icon}
    {label ? <span className="label">{label}:</span> : null}
    <span className="val num">{value}</span>
  </span>
);

const Bar = ({
  value = 0,
  gradient = "linear-gradient(90deg,#FB923C,#F97316)",
  glow = "rgba(249,115,22,.30)",
}: {
  value?: number;
  gradient?: string;
  glow?: string;
}) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(value), 150);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="bar">
      <i
        style={{
          background: gradient,
          boxShadow: `0 0 12px ${glow}`,
          transform: `scaleX(${v / 100})`,
          transition: "transform 1.1s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </div>
  );
};

function codeToneFor(view: ReedView): CodeTone {
  if (view.active) return view.active.tone === "blue" ? "green" : view.active.tone;
  return "green";
}

function chipToneFor(tone: ReedChipData["tone"]): ChipTone {
  return tone;
}

/* ---------- 1. Status header ---------- */
function StatusHeader({ view }: { view: ReedView }) {
  const [busy, setBusy] = useState(false);
  const place = view.locationName;

  // Rust-staat: alleen de tagline, groot. Geen kaart, geen uitleg.
  if (!view.active) {
    return (
      <div className="text-center pt-10 pb-8 sm:pt-16">
        <h1
          className="text-[38px] sm:text-[56px] leading-[1.0] font-extrabold"
          style={{
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Niks aan het handje op jouw locatie.
        </h1>
        <p className="mt-4 text-[24px] sm:text-[32px] font-extrabold text-slate-900">Saai hè?</p>
      </div>
    );
  }

  const label = view.active.levelLabel ?? "Rustig";
  return (
    <div className="rcard p-7 sm:p-9 relative">
      <div className="flex items-center gap-2 flex-wrap">
        <CodePill tone={codeToneFor(view)}>{label}</CodePill>
        <div className="livechip">
          <i />
          Live
        </div>
      </div>

      <h1
        className="mt-5 text-[34px] sm:text-[44px] leading-[1.02] font-extrabold text-slate-900"
        style={{ letterSpacing: "-0.028em" }}
      >
        Waarschuwingen voor {place}
      </h1>

      <p className="mt-3 text-[15.5px] leading-relaxed text-slate-600 max-w-[58ch]">
        {view.active.summary} We melden alleen wat ertoe doet — geen ruis.
      </p>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button className="locpill lift" onClick={() => locateAndReload(setBusy)} disabled={busy}>
          <IcGps size={14} /> <span>{busy ? "Locatie bepalen…" : "Andere plek? Gebruik GPS"}</span>
        </button>
        <span className="text-[13.5px] text-slate-500">
          Locatie: <b className="text-slate-900">{place}</b>
        </span>
      </div>
    </div>
  );
}

/* ---------- 2. Active warning callout ---------- */
const ACTIVE_GRADIENT: Record<ReedActiveWarning["tone"], string> = {
  red: "linear-gradient(160deg, #F87171 0%, #EF4444 45%, #B91C1C 100%)",
  orange: "linear-gradient(160deg, #FB923C 0%, #F97316 45%, #EA580C 100%)",
  amber: "linear-gradient(160deg, #FBBF24 0%, #F59E0B 45%, #B45309 100%)",
  blue: "linear-gradient(160deg, #60A5FA 0%, #3B82F6 45%, #1D4ED8 100%)",
};
function ActiveWarning({ data, voice }: { data: ReedActiveWarning; voice?: string | null }) {
  const chipTone = "onorange" as const;
  return (
    <div
      className="mt-5 p-6 sm:p-7 relative overflow-hidden"
      style={{
        background: ACTIVE_GRADIENT[data.tone],
        border: "1px solid rgba(154,52,18,.35)",
        borderRadius: 26,
        color: "#fff",
        boxShadow:
          "0 1px 0 rgba(255,255,255,.35) inset, 0 0 0 1px rgba(154,52,18,.10), 0 2px 6px rgba(154,52,18,.18), 0 18px 32px -16px rgba(234,88,12,.55), 0 32px 60px -28px rgba(124,45,18,.55)",
      }}
    >
      <div
        className="absolute -right-16 -top-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(255,237,213,.45), transparent 70%)" }}
      />
      <div
        className="absolute top-0 left-5 right-5 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent)" }}
      />
      <div className="absolute -right-4 -top-6 opacity-[0.12] pointer-events-none" style={{ color: "#fff" }}>
        <Icon size={190} stroke={1.2}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </Icon>
      </div>
      <div className="flex items-start gap-4 relative">
        <span
          className="icon-tile"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.32) 0%, rgba(255,255,255,.18) 100%)",
            border: "1px solid rgba(255,255,255,.36)",
            color: "#fff",
            width: 40,
            height: 40,
            borderRadius: 13,
            boxShadow: "0 1px 0 rgba(255,255,255,.35) inset, 0 4px 10px -4px rgba(154,52,18,.4)",
          }}
        >
          <IcAlert size={20} stroke={2.4} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[19px] sm:text-[22px] font-extrabold text-white" style={{ letterSpacing: "-0.02em" }}>
              {data.title}
            </h2>
            <span className={`rchip rchip-${chipTone}`}>{data.levelLabel}</span>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: "rgba(255,255,255,.92)" }}>
            {voice ?? data.summary}
          </p>
          {data.chips.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {data.chips.map((c, i) => (
                <Chip key={i} tone={chipTone} label={c.label} value={c.value} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. Section header ---------- */
function SectionHeader({ windowLabel }: { windowLabel: string }) {
  return (
    <div className="mt-9 mb-3 flex items-center justify-between gap-3">
      <Micro>Wat er aankomt · 48 uur</Micro>
      <div className="livechip">
        <i />
        {windowLabel}
      </div>
    </div>
  );
}

/* ---------- Probabilities ---------- */
function ProbRow({
  tone,
  icon,
  label,
  value,
  gradient,
  glow,
}: {
  tone: "orange" | "blue";
  icon: ReactNode;
  label: string;
  value: number;
  gradient: string;
  glow: string;
}) {
  const toneText = { orange: "#9A3412", blue: "#1D4ED8" }[tone] || "#0F172A";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: toneText }}>
          {icon}
          <span className="text-[13.5px] font-bold">{label}</span>
        </div>
        <div className="num text-[20px] font-extrabold" style={{ color: toneText }}>
          {value}%
        </div>
      </div>
      <div className="mt-2">
        <Bar value={value} gradient={gradient} glow={glow} />
      </div>
    </div>
  );
}
function Probabilities({ onweer = 68, regen = 84 }: { onweer?: number; regen?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      <ProbRow
        tone="orange"
        icon={<IcBolt size={14} stroke={2.4} />}
        label="Kans op onweer"
        value={onweer}
        gradient="linear-gradient(90deg,#FBBF24,#F97316)"
        glow="rgba(249,115,22,.30)"
      />
      <ProbRow
        tone="blue"
        icon={<IcCloudRain size={14} stroke={2.4} />}
        label="Kans op regen"
        value={regen}
        gradient="linear-gradient(90deg,#60A5FA,#2563EB)"
        glow="rgba(37,99,235,.30)"
      />
    </div>
  );
}

/* ---------- Mini stat ---------- */
const MiniStat = ({
  label,
  value,
  tone = "slate",
  emph = false,
}: {
  label: string;
  value: string;
  tone?: "slate" | "amber" | "blue";
  emph?: boolean;
}) => {
  const c = { slate: "#64748B", amber: "#92400E", blue: "#1D4ED8" }[tone];
  return (
    <div>
      <div className="rmicro text-[9.5px]">{label}</div>
      <div
        className={`num mt-1 ${emph ? "text-[18px] font-extrabold" : "text-[14.5px] font-bold"}`}
        style={{ color: c }}
      >
        {value}
      </div>
    </div>
  );
};

/* ---------- Radial gauge ---------- */
function Gauge({ value = 75 }: { value?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const CX = 120;
  const CY = 116;
  const R = 92;
  const C = 2 * Math.PI * R;
  const ARC = 0.75;
  const arcLen = C * ARC;
  const offset = arcLen * (1 - v / 100);

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const frac = i / 10;
    const ang = ((135 + frac * 270) * Math.PI) / 180;
    const inner = R - 12;
    const outer = R - 4;
    const x1 = CX + Math.cos(ang) * inner;
    const y1 = CY + Math.sin(ang) * inner;
    const x2 = CX + Math.cos(ang) * outer;
    const y2 = CY + Math.sin(ang) * outer;
    const past = frac * 100 <= v;
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={past ? "rgba(255,255,255,.85)" : "rgba(15,23,42,.10)"}
        strokeWidth={past ? 1.6 : 1}
        strokeLinecap="round"
      />
    );
  });

  const endAng = ((135 + (v / 100) * 270) * Math.PI) / 180;
  const endX = CX + Math.cos(endAng) * R;
  const endY = CY + Math.sin(endAng) * R;

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox="0 0 240 210" className="w-full max-w-[280px]" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="gz" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="55%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <radialGradient id="gzBloom" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="rgba(249,115,22,.18)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R - 18} fill="url(#gzBloom)" />

        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#EEF2F7"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`}
          transform={`rotate(135 ${CX} ${CY})`}
        />

        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="url(#gz)"
          strokeWidth="24"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`}
          style={{
            strokeDashoffset: offset,
            opacity: 0.35,
            filter: "blur(6px)",
            transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)",
          }}
          transform={`rotate(135 ${CX} ${CY})`}
        />

        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          className="gauge-arc"
          stroke="url(#gz)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`}
          style={{ strokeDashoffset: offset }}
          transform={`rotate(135 ${CX} ${CY})`}
        />

        <g>{ticks}</g>

        <circle
          cx={endX}
          cy={endY}
          r="5"
          fill="#fff"
          style={{
            filter: "drop-shadow(0 0 8px rgba(249,115,22,.85)) drop-shadow(0 1px 1px rgba(15,23,42,.18))",
            transition: "all 1.4s cubic-bezier(.2,.7,.2,1)",
          }}
        />
        <circle cx={endX} cy={endY} r="2.2" fill="#F97316" style={{ transition: "all 1.4s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ paddingTop: 14 }}
      >
        <div className="rmicro text-[9.5px]" style={{ color: "#9A3412", letterSpacing: ".22em" }}>
          Onweerskans
        </div>
        <div className="flex items-baseline gap-1 mt-1.5">
          <span
            className="num text-[58px] font-extrabold leading-none text-slate-900"
            style={{ letterSpacing: "-0.04em" }}
          >
            {Math.round(v)}
          </span>
          <span className="num text-[20px] text-slate-500 font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            %
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-[.16em]">komende 6 uur</div>
      </div>
    </div>
  );
}

/* ---------- Risico-dag ---------- */
function LiveRiskDay({ day, sibling }: { day: ReedRiskDay; sibling: ReedRiskDay }) {
  return (
    <>
      <div className="px-5 sm:px-7 pt-6 pb-5">
        <div className="flex items-center justify-between gap-3">
          <Micro>{day.hasRisk ? "Risicoperiode" : "Reed houdt wacht"}</Micro>
          <span className={`rchip ${day.hasRisk ? "rchip-orange" : "rchip-cyan"}`}>
            {day.hasRisk ? (
              <>
                <IcBolt size={11} stroke={2.4} /> {day.badge}
              </>
            ) : (
              "Rustig"
            )}
          </span>
        </div>
        <h3 className="mt-2 text-[22px] sm:text-[26px] leading-[1.15] font-extrabold tracking-tight text-slate-900">
          {day.hasRisk
            ? `${day.weekday}${day.windowLabel ? ` ${day.windowLabel}` : ""}`
            : `Geen actieve risicoperiode op ${day.weekday.toLowerCase()}`}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-[13.5px] text-slate-500 flex-wrap">
          <IcClock size={13} />
          {day.peakLabel ? (
            <span>
              Piek rond <b className="text-slate-900 num">{day.peakLabel}</b>
            </span>
          ) : (
            <span>{day.dateLabel}</span>
          )}
          <span className="text-slate-300">·</span>
          <span>{day.durationH > 0 ? `duur ~ ${day.durationH} uur` : "geen waarschuwing"}</span>
        </div>
        {day.chips.length > 0 ? (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {day.chips.map((c, i) => (
              <Chip key={i} tone={chipToneFor(c.tone)} label={c.label} value={c.value} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="divider" />

      <div className="p-5 sm:p-7 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <Micro>Risico-indicator</Micro>
            <span className={`rchip ${day.hasRisk ? "rchip-amber" : "rchip-cyan"}`}>
              {day.gaugePct}% komende 24 u
            </span>
          </div>
          <div className="swidget flex flex-col items-center pt-5 pb-4">
            <Gauge value={day.gaugePct} />
            <div className="mt-3 grid grid-cols-2 gap-2 w-full text-center">
              <MiniStat
                label={day.label}
                value={`${day.gaugePct}%`}
                tone={day.hasRisk ? "amber" : "blue"}
                emph
              />
              <MiniStat
                label={sibling.label}
                value={`${sibling.gaugePct}%`}
                tone={sibling.hasRisk ? "amber" : "blue"}
              />
            </div>
          </div>
        </section>

        <section>
          <Micro className="mb-2">Kans per type</Micro>
          <div className="swidget">
            <Probabilities onweer={day.prob.onweer} regen={day.prob.regen} />
          </div>
        </section>

        <section
          className="p-5 rounded-2xl"
          style={{
            background: day.hasRisk ? "#FFFBEB" : "#F0F9FF",
            border: day.hasRisk ? "1px solid #FDE68A" : "1px solid rgba(14,165,233,.18)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="icon-tile"
              style={{
                background: "#fff",
                border: "1px solid rgba(15,23,42,.08)",
                color: day.hasRisk ? "#92400E" : "#0369A1",
                width: 32,
                height: 32,
                borderRadius: 10,
              }}
            >
              <IcInfo size={14} stroke={2.2} />
            </span>
            <div className="flex-1">
              <div className="rmicro mb-1">{day.hasRisk ? "Waarom Reed oplet" : "Waarom rustig"}</div>
              <p className="text-[14px] leading-relaxed text-slate-700">
                {day.hasRisk
                  ? `${day.badge} krijgt vandaag een verhoogde kans. Reed let vooral op timing, regen en windstoten rond het aangegeven venster.`
                  : day.calmReason}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function LiveRisicoperiode({ view }: { view: ReedView }) {
  const [day, setDay] = useState<"vd" | "mo">("vd");
  const current = view.days[day];
  const sibling = day === "vd" ? view.days.mo : view.days.vd;
  return (
    <div className="rcard overflow-hidden">
      <div
        className="px-5 sm:px-7 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(15,23,42,.05)" }}
      >
        <button className="day-nav" onClick={() => setDay("vd")} disabled={day === "vd"} aria-label="Vorige dag">
          <IcChevL size={16} stroke={2.4} />
        </button>
        <div className="day-tabs">
          <button className="day-tab" data-active={day === "vd"} onClick={() => setDay("vd")}>
            <span>{view.days.vd.weekday}</span>
            <span className="date num">{view.days.vd.dateLabel}</span>
          </button>
          <button className="day-tab" data-active={day === "mo"} onClick={() => setDay("mo")}>
            <span>{view.days.mo.weekday}</span>
            <span className="date num">{view.days.mo.dateLabel}</span>
          </button>
        </div>
        <button className="day-nav" onClick={() => setDay("mo")} disabled={day === "mo"} aria-label="Volgende dag">
          <IcChevR size={16} stroke={2.4} />
        </button>
      </div>
      <LiveRiskDay day={current} sibling={sibling} />
    </div>
  );
}

/* ---------- Footer trust strip ---------- */
function FooterTrust() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 flex-wrap text-[12.5px] text-slate-700">
      <div className="flex items-center gap-2">
        <IcCheck size={14} stroke={2.4} style={{ color: "#15803D" }} />
        <span>Reed let op onweer, storm en zware regen voor jouw plek — en houdt z&apos;n mond als er niks speelt.</span>
      </div>
      <a href="/over" className="font-bold text-slate-900 inline-flex items-center gap-1">
        Over Reed <IcArrow size={11} stroke={2.4} />
      </a>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ReedWarningsPage({
  view,
  voice = null,
  fontClassName = "",
  weatherCode = 2,
  isDay = true,
}: {
  view: ReedView;
  voice?: string | null;
  fontClassName?: string;
  weatherCode?: number;
  isDay?: boolean;
  lat?: number;
  lon?: number;
}) {
  const hasWarning = !!view.active;
  return (
    <main className={`reed-skin relative min-h-screen ${fontClassName}`}>
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />}>
        <WeatherBackground weatherCode={weatherCode} isDay={isDay} />
      </Suspense>
      <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-6 sm:py-10 reed-stagger">
        <StatusHeader view={view} />
        {hasWarning ? (
          <>
            <ActiveWarning data={view.active!} voice={voice} />
            <SectionHeader windowLabel={view.windowLabel} />
            <LiveRisicoperiode view={view} />
            <FooterTrust />
          </>
        ) : null}
      </div>
    </main>
  );
}
