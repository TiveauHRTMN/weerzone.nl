"use client";

/**
 * Reed · Waarschuwingen voor Noord-Holland
 * High-fidelity recreation of design_handoff_reed_piet (Reed page).
 * Visual-first: copy + values match the handoff "Code geel" scenario.
 * Styling lives in src/app/(site)/reed/reed-skin.css (scoped under .reed-skin).
 */

import { Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { ReedView, ReedRiskDay, ReedActiveWarning, ReedChip as ReedChipData } from "@/lib/reed-view";

// Dynamische, weer-gestuurde achtergrond — zelfde component als /weer.
const WeatherBackground = dynamic(() => import("./WeatherBackground"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />,
});

/* ---------- Lucide-style inline icons (zero-dependency, exact match) ---------- */
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
const IcWind = (p: IP) => (
  <Icon {...p}>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
    <path d="M17.73 6.27A2.5 2.5 0 1 1 19.5 10H2" />
    <path d="M14.05 17.73A2.5 2.5 0 1 0 15.5 14H2" />
  </Icon>
);
const IcShield = (p: IP) => (
  <Icon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
const IcExt = (p: IP) => (
  <Icon {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Icon>
);
const IcRadar = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v4" />
  </Icon>
);
const IcSounding = (p: IP) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 17 10 12 13 14 17 7" />
  </Icon>
);
const IcMapPin = (p: IP) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
const IcClock = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </Icon>
);
const IcLayers = (p: IP) => (
  <Icon {...p}>
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </Icon>
);
const IcDown = (p: IP) => (
  <Icon {...p}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </Icon>
);
const IcCompass = (p: IP) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
  </Icon>
);
const IcBell = (p: IP) => (
  <Icon {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);
const IcShare = (p: IP) => (
  <Icon {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
function StatusHeader({
  view,
  expert,
  onChange,
}: {
  view: ReedView;
  expert: boolean;
  onChange: (v: boolean) => void;
}) {
  const label = view.active?.levelLabel ?? "Rustig";
  const summary = view.active
    ? view.active.summary
    : "Niks aan het handje in Nederland. Saai he?";
  const placeLabel = view.provinceLabel ?? view.locationName;
  if (!view.active) {
    return (
      <div className="rcard p-8 sm:p-10 relative overflow-hidden text-center">
        <div
          className="absolute inset-x-8 top-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)" }}
        />
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <CodePill tone="green">Rustig</CodePill>
          <div className="livechip">
            <i />
            Tesla houdt wacht
          </div>
        </div>
        <h1
          className="mt-6 text-[42px] sm:text-[58px] leading-[0.98] font-extrabold"
          style={{
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Niks aan het handje in Nederland.
        </h1>
        <p className="mt-4 text-[21px] sm:text-[25px] font-extrabold text-slate-900">
          Saai he?
        </p>
        <p className="mt-3 mx-auto text-[14.5px] leading-relaxed text-slate-600 max-w-[52ch]">
          Reed kijkt mee voor {placeLabel}. Alleen als Mariana Tesla onweer of storm ziet, gaat deze pagina open met waarschuwingen.
        </p>
      </div>
    );
  }

  return (
    <div className="rcard p-7 sm:p-9 relative">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <CodePill tone={codeToneFor(view)}>{label}</CodePill>
          <div className="livechip">
            <i />
            Live kansberekening
          </div>
        </div>
        <button
          className="expert-toggle"
          data-on={expert ? "true" : "false"}
          aria-pressed={expert}
          onClick={() => onChange(!expert)}
        >
          <span className="pip" />
          <span>Expert-modus · {expert ? "Aan" : "Uit"}</span>
        </button>
      </div>

      <h1
        className="mt-5 text-[34px] sm:text-[44px] leading-[1.02] font-extrabold text-slate-900"
        style={{ letterSpacing: "-0.028em" }}
      >
        Waarschuwingen voor {placeLabel}
      </h1>

      <p className="mt-3 text-[15.5px] leading-relaxed text-slate-600 max-w-[58ch]">
        {summary} We melden alleen wat ertoe doet — geen ruis.
      </p>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button className="locpill lift">
          <IcGps size={14} /> <span>Andere provincie? Gebruik GPS</span>
        </button>
        <span className="text-[13.5px] text-slate-500">
          Locatie: <b className="text-slate-900">{placeLabel}</b>
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
function ActiveWarning({ data }: { data: ReedActiveWarning }) {
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
            {data.summary}
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

/* ---------- 2b. Rustige staat (Reed zwijgt) ---------- */
function CalmHeader({ locationName }: { locationName: string }) {
  return (
    <div className="mt-5 rcard p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="icon-tile" style={{ background: "linear-gradient(180deg,#fff,#DCFCE7)", color: "#15803D", width: 40, height: 40, borderRadius: 13, border: "1px solid #DCFCE7" }}>
          <IcShield size={20} stroke={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[19px] sm:text-[22px] font-extrabold text-slate-900" style={{ letterSpacing: "-0.02em" }}>
              Niks aan het handje in Nederland
            </h2>
            <span className="rchip rchip-green">Rustig</span>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">
            Saai he? Reed kijkt mee voor {locationName} en omgeving. Zodra er onweer, storm of zware regen opduikt, zie je het hier als eerste.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. Section header ---------- */
function SectionHeader({ windowLabel }: { windowLabel: string }) {
  return (
    <div className="mt-9 mb-3 flex items-center justify-between gap-3">
      <Micro>Risico-analyse · 48 uur</Micro>
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

/* ---------- Param card ---------- */
function ParamCard({
  tone,
  icon,
  label,
  value,
  unit,
  summary,
  pct,
  scale,
}: {
  tone: "orange" | "blue" | "red" | "purple";
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  summary: string;
  pct: number;
  scale: [string, string];
}) {
  const conf = {
    orange: { bg: "#FFEDD5", fg: "#9A3412", rail: "linear-gradient(90deg,#FBBF24,#F97316)", glow: "rgba(249,115,22,.10)" },
    blue: { bg: "#DBEAFE", fg: "#1D4ED8", rail: "linear-gradient(90deg,#60A5FA,#2563EB)", glow: "rgba(37,99,235,.10)" },
    red: { bg: "#FEE2E2", fg: "#B91C1C", rail: "linear-gradient(90deg,#F87171,#EF4444)", glow: "rgba(239,68,68,.10)" },
    purple: { bg: "#F3E8FF", fg: "#7E22CE", rail: "linear-gradient(90deg,#C084FC,#A855F7)", glow: "rgba(168,85,247,.10)" },
  }[tone];
  return (
    <div className="pcard" style={{ "--pcard-glow": conf.glow } as CSSProperties}>
      <div className="flex items-center justify-between gap-2 relative">
        <span
          className="icon-tile"
          style={{
            background: `linear-gradient(180deg, #fff 0%, ${conf.bg} 100%)`,
            color: conf.fg,
            width: 30,
            height: 30,
            borderRadius: 10,
            border: `1px solid ${conf.bg}`,
            boxShadow: "0 1px 0 rgba(255,255,255,.9) inset, 0 1px 2px rgba(15,23,42,.04)",
          }}
        >
          {icon}
        </span>
        <span className="rmicro text-[9.5px] text-right" style={{ letterSpacing: ".16em" }}>
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 relative">
        <span
          className="num text-[32px] sm:text-[34px] font-extrabold text-slate-900 leading-none"
          style={{ letterSpacing: "-0.03em" }}
        >
          {value}
        </span>
        <span className="num text-[12.5px] text-slate-500 font-bold">{unit}</span>
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-slate-600 min-h-[2.6em] relative">{summary}</div>
      <div className="mt-3 relative">
        <div className="bar" style={{ height: 6 }}>
          <i
            style={{
              background: conf.rail,
              transform: `scaleX(${pct / 100})`,
              transition: "transform 1s cubic-bezier(.2,.7,.2,1)",
              boxShadow: `0 0 10px ${conf.glow.replace(".10", ".45")}`,
            }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="rmicro text-[9.5px]">{scale[0]}</span>
          <span className="rmicro text-[9.5px]">{scale[1]}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Explainer ---------- */
function ExplainerPanel({
  tone,
  title,
  icon,
  body,
  tags,
}: {
  tone: "amber" | "blue";
  title: string;
  icon: ReactNode;
  body: ReactNode;
  tags: [ChipTone, string][];
}) {
  const conf = {
    amber: { bg: "#FFFBEB", bd: "#FDE68A", fg: "#92400E", tile: "#FEF3C7" },
    blue: { bg: "#EFF6FF", bd: "#BFDBFE", fg: "#1D4ED8", tile: "#DBEAFE" },
  }[tone];
  return (
    <div className="rounded-2xl p-5 lift" style={{ background: conf.bg, border: `1px solid ${conf.bd}` }}>
      <div className="flex items-center gap-2.5">
        <span
          className="icon-tile"
          style={{ background: conf.tile, color: conf.fg, width: 30, height: 30, borderRadius: 10 }}
        >
          {icon}
        </span>
        <div className="rmicro" style={{ color: conf.fg, opacity: 0.85 }}>
          {title}
        </div>
      </div>
      <p className="mt-3 text-[14.5px] leading-relaxed text-slate-800">{body}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map(([t, l], i) => (
          <Chip key={i} tone={t} label="" value={l} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Mini stat / Meta card ---------- */
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
const MetaCard = ({
  icon,
  value,
  label,
  tone = "slate",
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone?: "amber" | "blue" | "slate";
}) => {
  const conf =
    { amber: { bg: "#FEF3C7", fg: "#92400E" }, blue: { bg: "#DBEAFE", fg: "#1D4ED8" } }[
      tone as "amber" | "blue"
    ] || { bg: "#F1F5F9", fg: "#334155" };
  return (
    <div className="swidget p-4 lift">
      <span
        className="icon-tile"
        style={{ background: conf.bg, color: conf.fg, width: 30, height: 30, borderRadius: 9 }}
      >
        {icon}
      </span>
      <div className="mt-3 num text-[18px] font-extrabold text-slate-900 leading-none">{value}</div>
      <div className="mt-1 text-[12px] text-slate-500 font-semibold">{label}</div>
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

function LiveRiskDay({
  day,
  sibling,
  expert,
  onEnableExpert,
}: {
  day: ReedRiskDay;
  sibling: ReedRiskDay;
  expert: boolean;
  onEnableExpert: () => void;
}) {
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
                  ? `${day.badge} krijgt vandaag een verhoogde score. Reed let vooral op timing, regen en windstoten rond het aangegeven venster.`
                  : day.calmReason}
              </p>
            </div>
          </div>
        </section>

        {!expert ? (
          <button
            className="w-full swidget flex items-center justify-between p-4 lift"
            style={{ cursor: "pointer" }}
            onClick={onEnableExpert}
          >
            <span className="flex items-center gap-2.5">
              <IcInfo size={15} stroke={2.2} style={{ color: "#0F172A" }} />
              <span className="text-[13.5px] font-bold text-slate-900">Toon expertlaag</span>
            </span>
            <IcArrow size={14} stroke={2.2} style={{ color: "#64748B" }} />
          </button>
        ) : null}
      </div>
    </>
  );
}

function LiveRisicoperiode({
  view,
  expert,
  onEnableExpert,
}: {
  view: ReedView;
  expert: boolean;
  onEnableExpert: () => void;
}) {
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
      <LiveRiskDay day={current} sibling={sibling} expert={expert} onEnableExpert={onEnableExpert} />
    </div>
  );
}

/* ---------- 4. Risicoperiode ---------- */
function Risicoperiode({ expert, onEnableExpert }: { expert: boolean; onEnableExpert: () => void }) {
  const [day, setDay] = useState<"vr" | "za">("vr");
  return (
    <div className="rcard overflow-hidden">
      {/* Day toggle strip */}
      <div
        className="px-5 sm:px-7 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(15,23,42,.05)" }}
      >
        <button className="day-nav" onClick={() => setDay("vr")} disabled={day === "vr"} aria-label="Vorige dag">
          <IcChevL size={16} stroke={2.4} />
        </button>
        <div className="day-tabs">
          <button className="day-tab" data-active={day === "vr"} onClick={() => setDay("vr")}>
            <span>Vrijdag</span>
            <span className="date num">29 mei</span>
          </button>
          <button className="day-tab" data-active={day === "za"} onClick={() => setDay("za")}>
            <span>Zaterdag</span>
            <span className="date num">30 mei</span>
          </button>
        </div>
        <button className="day-nav" onClick={() => setDay("za")} disabled={day === "za"} aria-label="Volgende dag">
          <IcChevR size={16} stroke={2.4} />
        </button>
      </div>

      {day === "vr" && (
        <>
          {/* Header strip */}
          <div className="px-5 sm:px-7 pt-6 pb-5">
            <div className="flex items-center justify-between gap-3">
              <Micro>Risicoperiode #1</Micro>
              <span className="rchip rchip-orange">
                <IcBolt size={11} stroke={2.4} /> Onweer
              </span>
            </div>
            <h3 className="mt-2 text-[22px] sm:text-[26px] leading-[1.15] font-extrabold tracking-tight text-slate-900">
              Vrijdag van 14:00 tot 20:00
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-[13.5px] text-slate-500 flex-wrap">
              <IcClock size={13} />
              <span>
                Piek rond <b className="text-slate-900 num">17:30</b>
              </span>
              <span className="text-slate-300">·</span>
              <span>duur ~ 6 uur</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="rchip rchip-amber">
                <IcWind size={11} stroke={2.4} /> Windstoten 75 km/u
              </span>
              <span className="rchip rchip-red">Hagel 1–2 cm</span>
              <span className="rchip rchip-blue">
                <IcCloudRain size={11} stroke={2.4} /> 20–35 mm/u
              </span>
            </div>
          </div>

          <div className="divider" />

          <div className="p-5 sm:p-7 space-y-6">
            {/* Gauge */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <Micro>Risico-indicator</Micro>
                <span className="rchip rchip-amber">75% komende 6 u</span>
              </div>
              <div className="swidget flex flex-col items-center pt-5 pb-4">
                <Gauge value={75} />
                <div className="mt-3 grid grid-cols-3 gap-2 w-full text-center">
                  <MiniStat label="Donderdag" value="22%" tone="slate" />
                  <MiniStat label="Vrijdag" value="75%" tone="amber" emph />
                  <MiniStat label="Zaterdag" value="12%" tone="blue" />
                </div>
              </div>
            </section>

            {/* Probabilities */}
            <section>
              <Micro className="mb-2">Kans per type</Micro>
              <div className="swidget">
                <Probabilities />
              </div>
            </section>

            {/* Simple-mode CTA — only when expert is OFF */}
            {!expert && (
              <section>
                <button
                  onClick={onEnableExpert}
                  className="w-full p-5 rounded-2xl text-left flex items-center gap-4"
                  style={{
                    background: "linear-gradient(180deg, #FFFBEB 0%, #FFF1D6 100%)",
                    border: "1px solid rgba(249,115,22,.35)",
                    boxShadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 10px 24px -14px rgba(249,115,22,.35)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="icon-tile flex-shrink-0"
                    style={{
                      background: "linear-gradient(180deg,#FB923C,#F97316)",
                      color: "#fff",
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      boxShadow: "0 6px 14px -6px rgba(249,115,22,.55), inset 0 1px 0 rgba(255,255,255,.4)",
                    }}
                  >
                    <IcBolt size={20} stroke={2.2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-extrabold tracking-[.18em] uppercase" style={{ color: "#9A3412" }}>
                      Open volledige analyse
                    </div>
                    <div className="mt-1 text-[15.5px] font-extrabold text-slate-900">
                      Schakel expert-modus aan voor parameters &amp; modeldata
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-slate-600">
                      CAPE · Lifted Index · CIN · Windschering · stormstructuur
                    </div>
                  </div>
                  <IcArrow size={18} stroke={2.2} style={{ color: "#F97316" }} />
                </button>
              </section>
            )}

            {/* Expert-only deep dive */}
            {expert && (
              <>
                {/* Stormstructuur */}
                <section>
                  <Micro className="mb-2">Stormstructuur</Micro>
                  <div className="swidget">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[17px] font-extrabold text-slate-900">Pulsbuien</div>
                        <div className="text-[12.5px] text-slate-500 mt-0.5">losstaand · korte levensduur</div>
                      </div>
                      <span className="rchip rchip-orange">Actieve modus</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      {[
                        { k: "Pulsen", active: true },
                        { k: "Multicel", active: false },
                        { k: "Supercel", active: false },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className={`text-center py-2.5 text-[11.5px] font-extrabold uppercase tracking-wider rounded-lg ${
                            s.active ? "rchip-orange" : ""
                          }`}
                          style={s.active ? {} : { background: "#F1F5F9", color: "#64748B" }}
                        >
                          {s.k}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Impact + Atmosfeer */}
                <section className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                  <ExplainerPanel
                    tone="amber"
                    title="Verwachte impact"
                    icon={<IcShield size={15} stroke={2.2} />}
                    body={
                      <>
                        Korte, felle <b>onweersbuien</b> met windstoten tot <b className="num">75 km/u</b> en
                        kortstondige hagel <b className="num">(1–2 cm)</b>. Op de weg: aquaplaning en slecht zicht. Plan
                        reistijd om de piek heen.
                      </>
                    }
                    tags={[
                      ["amber", "Verkeer"],
                      ["amber", "Buitenwerk"],
                      ["amber", "Outdoor events"],
                    ]}
                  />
                  <ExplainerPanel
                    tone="blue"
                    title="Atmosferische oorzaak"
                    icon={<IcWind size={15} stroke={2.2} />}
                    body={
                      <>
                        Een trog trekt vanuit het zuidwesten binnen en duwt <b> warme, vochtige lucht</b> omhoog.
                        Daarboven stroomt koude lucht in, daardoor wordt de atmosfeer instabiel en ontstaan buien.
                      </>
                    }
                    tags={[
                      ["blue", "SW-stroming"],
                      ["blue", "Td 18°C"],
                      ["blue", "500 hPa −18°C"],
                    ]}
                  />
                </section>

                {/* Parameters */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <Micro>Atmosferische parameters</Micro>
                    <span className="text-[11.5px] text-slate-500">vertaald voor leken</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ParamCard
                      tone="orange"
                      icon={<IcBolt size={14} stroke={2.2} />}
                      label="CAPE · Energie"
                      value="750"
                      unit="J/kg"
                      summary="Matige energie — genoeg om buien te voeden."
                      pct={48}
                      scale={["Stabiel", "Explosief"]}
                    />
                    <ParamCard
                      tone="blue"
                      icon={<IcDown size={14} stroke={2.2} />}
                      label="Lifted Index · Stabiliteit"
                      value="−3"
                      unit="°C"
                      summary="Onstabiel. Stijgende lucht — buien komen vlot op gang."
                      pct={62}
                      scale={["Stabiel", "Zeer onstabiel"]}
                    />
                    <ParamCard
                      tone="red"
                      icon={<IcLayers size={14} stroke={2.2} />}
                      label="CIN · Remming"
                      value="45"
                      unit="J/kg"
                      summary="Matige deksel. Een front moet de lucht erdoorheen duwen."
                      pct={35}
                      scale={["Open", "Sterk afgesloten"]}
                    />
                    <ParamCard
                      tone="purple"
                      icon={<IcCompass size={14} stroke={2.2} />}
                      label="Windschering · Dynamiek"
                      value="28"
                      unit="km/u"
                      summary="Beperkt. Losstaande pulsbuien, geen stormsystemen."
                      pct={32}
                      scale={["Pulsen", "Supercel"]}
                    />
                  </div>
                </section>

                {/* Duur & organisatie */}
                <section>
                  <Micro className="mb-2">Duur &amp; organisatie</Micro>
                  <div className="grid grid-cols-2 gap-3">
                    <MetaCard icon={<IcClock size={14} stroke={2.2} />} value="6 u" label="Risico-window" tone="amber" />
                    <MetaCard icon={<IcLayers size={14} stroke={2.2} />} value="Laag" label="Organisatie" tone="blue" />
                  </div>
                </section>

                {/* Onweersdreiging summary */}
                <section className="p-5 rounded-2xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div className="flex items-start gap-3">
                    <span
                      className="icon-tile"
                      style={{ background: "#fff", border: "1px solid #E2E8F0", color: "#0F172A", width: 32, height: 32, borderRadius: 10 }}
                    >
                      <IcInfo size={14} stroke={2.2} />
                    </span>
                    <div className="flex-1">
                      <div className="rmicro mb-1">Onweersdreiging</div>
                      <p className="text-[14px] leading-relaxed text-slate-700">
                        Met een maximale energie (CAPE) van <b className="num">750 J/kg</b> en een atmosferische
                        instabiliteit (LI <b className="num">−3°C</b>) is er voldoende basis voor convectie. De beperkte
                        windschering (<b className="num">28 km/u</b>) houdt cellen kort en losstaand — zwaar maar lokaal,
                        niet georganiseerd.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Reasoning link */}
                <button className="w-full swidget flex items-center justify-between p-4 lift" style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-2.5">
                    <IcInfo size={15} stroke={2.2} style={{ color: "#0F172A" }} />
                    <span className="text-[13.5px] font-bold text-slate-900">Hoe komt Reed tot dit oordeel?</span>
                  </span>
                  <IcArrow size={14} stroke={2.2} style={{ color: "#64748B" }} />
                </button>
              </>
            )}
          </div>
        </>
      )}

      {day === "za" && (
        <>
          <div className="px-5 sm:px-7 pt-6 pb-5">
            <div className="flex items-center justify-between gap-3">
              <Micro>Zaterdag</Micro>
              <span className="rchip rchip-cyan">Rustig</span>
            </div>
            <h3 className="mt-2 text-[22px] sm:text-[26px] leading-[1.15] font-extrabold tracking-tight text-slate-900">
              Geen actieve risicoperiode
            </h3>
            <div className="mt-1.5 text-[13.5px] text-slate-500">
              De trog van vrijdag is dan voorbij — droog, vrij zonnig met hooguit een verdwaalde spatje.
            </div>
          </div>

          <div className="divider" />

          <div className="p-5 sm:p-7 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-2">
                <Micro>Risico-indicator</Micro>
                <span className="rchip rchip-cyan">12% komende 24 u</span>
              </div>
              <div className="swidget flex flex-col items-center pt-5 pb-4">
                <Gauge value={12} />
                <div className="mt-3 grid grid-cols-3 gap-2 w-full text-center">
                  <MiniStat label="Vrijdag" value="75%" tone="amber" />
                  <MiniStat label="Zaterdag" value="12%" tone="blue" emph />
                  <MiniStat label="Zondag" value="28%" tone="slate" />
                </div>
              </div>
            </section>

            <section>
              <Micro className="mb-2">Kans per type</Micro>
              <div className="swidget">
                <Probabilities onweer={6} regen={24} />
              </div>
            </section>

            <section className="p-5 rounded-2xl" style={{ background: "#F0F9FF", border: "1px solid rgba(14,165,233,.18)" }}>
              <div className="flex items-start gap-3">
                <span
                  className="icon-tile"
                  style={{ background: "#fff", border: "1px solid rgba(14,165,233,.22)", color: "#0369A1", width: 32, height: 32, borderRadius: 10 }}
                >
                  <IcInfo size={14} stroke={2.2} />
                </span>
                <div className="flex-1">
                  <div className="rmicro mb-1" style={{ color: "#0369A1" }}>
                    Waarom rustig?
                  </div>
                  <p className="text-[14px] leading-relaxed text-slate-700">
                    Vrijdagavond trekt de trog richting Duitsland. CAPE valt terug onder <b className="num"> 200 J/kg</b>,
                    een hogedrukrug bouwt zich op en stabiliseert de atmosfeer. Hooguit een spatje in de namiddag — geen
                    onweer.
                  </p>
                </div>
              </div>
            </section>

            <button className="w-full swidget flex items-center justify-between p-4 lift" style={{ cursor: "pointer" }}>
              <span className="flex items-center gap-2.5">
                <IcInfo size={15} stroke={2.2} style={{ color: "#0F172A" }} />
                <span className="text-[13.5px] font-bold text-slate-900">Hoe komt Reed tot dit oordeel?</span>
              </span>
              <IcArrow size={14} stroke={2.2} style={{ color: "#64748B" }} />
            </button>
          </div>
        </>
      )}

      {/* Footer action row */}
      <div className="divider" />
      <div className="px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
          <span className="rmicro">Volgende update</span>
          <span className="num text-slate-900 font-bold">12:30</span>
          <span className="text-slate-300">·</span>
          <span>elke 60 min</span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button className="rbtn-ghost justify-center">
            <IcShare size={14} stroke={2.2} /> Deel
          </button>
          <button className="rbtn-primary justify-center">
            <IcBell size={14} stroke={2.2} /> Push-alerts
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. Estofex Day-1 Outlook (kaart + synopsis) ---------- */
export type EstofexInfo = {
  level: 1 | 2 | 3;
  synopsis: string;
  imageUrl: string;
  sourceUrl: string;
  validUntil: string | null;
} | null;

function EstofexOutlook({ data }: { data: EstofexInfo }) {
  const active = !!data;
  const levelChip = data
    ? data.level >= 3
      ? "rchip-red"
      : data.level === 2
        ? "rchip-orange"
        : "rchip-amber"
    : "rchip-green";
  return (
    <div className="mt-6 rcard p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Micro>Estofex · Day-1 Outlook</Micro>
          <div className="mt-1.5 text-[16.5px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.01em" }}>
            {active ? `Lvl ${data!.level} · Europa-outlook` : "Geen actuele Europa-brede waarschuwing"}
          </div>
          <p className="mt-1 text-[13.5px] text-slate-600 max-w-[58ch]">
            {active
              ? data!.synopsis
              : "Estofex heeft nu geen verhoogd risico uitgegeven voor de Lage Landen of Duitsland. Reed toont de outlook hier zodra die wordt vrijgegeven."}
          </p>
        </div>
        <span className={`rchip ${levelChip} flex-shrink-0`}>{active ? `Lvl ${data!.level}` : "Rustig"}</span>
      </div>

      {active && (
        <div
          className="mt-4 relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(15,23,42,.08)", background: "#EAF2FB" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data!.imageUrl}
            alt={`Estofex Day-1 outlook · Level ${data!.level}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="block w-full h-auto"
          />
          <span
            className="absolute bottom-2.5 right-3 text-[10.5px] font-bold rounded-lg px-2 py-1"
            style={{
              color: "rgba(15,23,42,.6)",
              background: "rgba(255,255,255,.78)",
              border: "1px solid rgba(15,23,42,.06)",
              backdropFilter: "blur(6px)",
            }}
          >
            © ESTOFEX · CC BY-NC-SA
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="rmicro text-[10px]">Europa-breed · universeel voor NL / BE / DE</div>
        <a
          href={data?.sourceUrl ?? "https://estofex.org"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:text-slate-900"
        >
          {active ? "Lees volledige outlook" : "Bekijk op"} estofex.org <IcExt size={11} stroke={2.4} />
        </a>
      </div>
    </div>
  );
}

/* ---------- 6. Chaser tools ---------- */
function ModelRow({ name, peak, note }: { name: string; peak: number; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0" style={{ width: 108 }}>
        <div className="text-[12.5px] font-extrabold text-slate-900 leading-tight">{name}</div>
        <div className="text-[10.5px] text-slate-400 font-semibold">{note}</div>
      </div>
      <div className="flex-1 bar" style={{ height: 8 }}>
        <i
          style={{
            background: "linear-gradient(90deg,#FBBF24,#F97316)",
            transform: `scaleX(${peak / 100})`,
            transition: "transform 1s cubic-bezier(.2,.7,.2,1)",
            boxShadow: "0 0 10px rgba(249,115,22,.35)",
          }}
        />
      </div>
      <div className="num text-[14.5px] font-extrabold text-slate-900 text-right" style={{ width: 44 }}>
        {peak}%
      </div>
    </div>
  );
}
function ChaserLink({ icon, label, sub, href = "#" }: { icon: ReactNode; label: string; sub: string; href?: string }) {
  return (
    <a href={href} className="swidget p-3 flex items-center gap-2.5 lift" style={{ cursor: "pointer", textDecoration: "none" }}>
      <span className="icon-tile" style={{ background: "#F1F5F9", color: "#475569", width: 32, height: 32, borderRadius: 10 }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-slate-900 truncate">{label}</div>
        <div className="text-[11.5px] text-slate-500 truncate">{sub}</div>
      </div>
      <IcExt size={13} stroke={2.2} style={{ color: "#94A3B8" }} />
    </a>
  );
}
function ChaserTools() {
  return (
    <div className="mt-6 rcard overflow-hidden">
      <div className="px-5 sm:px-7 pt-6 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Micro>Voor de chasers</Micro>
          <span className="rchip rchip-purple">Diepgang</span>
        </div>
        <h3 className="mt-2 text-[20px] sm:text-[24px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.02em" }}>
          Model-overeenstemming &amp; diepere tools
        </h3>
        <p className="mt-1 text-[13.5px] text-slate-500 max-w-[58ch]">
          Reed combineert officiële waarschuwingen, buienparameters en modelruns. Hier zie je waar ze het over eens
          zijn — en waar de echte onzekerheid zit.
        </p>
      </div>

      <div className="divider" />

      <div className="p-5 sm:p-7 space-y-5">
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <Micro>Vrijdag · piekkans onweer per model</Micro>
            <span className="rchip rchip-green">68% overeenstemming</span>
          </div>
          <div className="swidget space-y-3">
            <ModelRow name="ECMWF" peak={72} note="3-uurs run · EU" />
            <ModelRow name="HARMONIE-AROME" peak={78} note="hi-res NL · KNMI" />
            <ModelRow name="ICON-D2" peak={64} note="2.5 km · DWD" />
            <ModelRow name="GFS" peak={58} note="NOAA" />
          </div>
          <p className="mt-3 text-[12.5px] text-slate-500 leading-relaxed">
            <b className="text-slate-900 num">Spread 20%</b> tussen hoogste (HARMONIE 78) en laagste (GFS 58). De vier
            zijn het eens dát er iets gebeurt — marges zitten in piekhoogte en timing.
          </p>
        </section>

        <section>
          <Micro className="mb-2">Verder kijken</Micro>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ChaserLink icon={<IcSounding size={15} stroke={2.2} />} label="Skew-T sounding" sub="De Bilt · 12z run" />
            <ChaserLink icon={<IcRadar size={15} stroke={2.2} />} label="Live radar" sub="composiet + bliksem-overlay" />
            <ChaserLink icon={<IcBolt size={15} stroke={2.2} />} label="Bliksem live" sub="Blitzortung-feed" />
            <ChaserLink icon={<IcMapPin size={15} stroke={2.2} />} label="Storm reports" sub="van de community" />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- 7. Live Bliksemradar (live Blitzortung-kaart) ---------- */
function LightningRadar({ lat, lon }: { lat: number; lon: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = `https://map.blitzortung.org/#7/${lat}/${lon}`;
  return (
    <div className="mt-6 rcard p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Micro>Lightningmaps · Blitzortung-feed</Micro>
          <div className="mt-1.5 text-[16.5px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.01em" }}>
            Live bliksemradar
          </div>
          <p className="mt-1 text-[13.5px] text-slate-600 max-w-[58ch]">
            Realtime ontladingen boven NL, BE en DE — direct van het Blitzortung-netwerk. Reed waarschuwt zodra de
            eerste cellen ontstaan.
          </p>
        </div>
        <span className="rchip rchip-red flex-shrink-0 inline-flex items-center gap-1.5">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 9999,
              background: "#EF4444",
              boxShadow: "0 0 0 0 rgba(239,68,68,.6)",
              animation: "reedLive 1.6s ease-out infinite",
              display: "inline-block",
            }}
          />
          Live
        </span>
      </div>

      <div
        className="mt-4 relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(15,23,42,.08)", background: "#0b1b2e", height: 380 }}
      >
        {mounted ? (
          <iframe
            title="Live bliksemradar — Blitzortung"
            src={src}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse" style={{ background: "#11223a" }} />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="rmicro text-[10px]">Real-time · update elke ~50 s</div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.lightningmaps.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:text-slate-900"
          >
            lightningmaps.org <IcExt size={11} stroke={2.4} />
          </a>
          <a
            href="https://www.blitzortung.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:text-slate-900"
          >
            blitzortung.org <IcExt size={11} stroke={2.4} />
          </a>
        </div>
      </div>
    </div>
  );
}

function TeslaExpertPanel({ signal }: { signal: NonNullable<ReedView["tesla"]> }) {
  const confidence = Math.round(signal.confidence.model_agreement * 100);
  return (
    <div className="mt-6 rcard overflow-hidden">
      <div className="px-5 sm:px-7 pt-6 pb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Micro>Expertlaag</Micro>
          <span className="rchip rchip-purple">Diepgang</span>
        </div>
        <h3 className="mt-2 text-[20px] sm:text-[24px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.02em" }}>
          Convectieve duiding
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 max-w-[58ch]">
          {signal.mariana_summary || signal.reasoning_chain[0] || "Er is een actieve expertduiding voor deze regio."}
        </p>
      </div>

      <div className="divider" />

      <div className="p-5 sm:p-7 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <MetaCard icon={<IcClock size={14} stroke={2.2} />} value={signal.timing_window || "Onbekend"} label="Venster" tone="amber" />
          <MetaCard icon={<IcLayers size={14} stroke={2.2} />} value={signal.expected_mode || "Onbekend"} label="Modus" tone="blue" />
        </div>
        <section className="swidget p-4">
          <div className="flex items-center justify-between mb-2">
            <Micro>Model-overeenstemming</Micro>
            <span className="rchip rchip-green">{confidence}%</span>
          </div>
          <Bar value={confidence} gradient="linear-gradient(90deg,#22C55E,#F97316)" glow="rgba(34,197,94,.25)" />
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
            {signal.model_conflict.summary || signal.model_consensus}
          </p>
        </section>
        {signal.failure_modes.length > 0 ? (
          <section className="p-4 rounded-2xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Micro className="mb-2">Waar Reed nog op let</Micro>
            <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-700">
              {signal.failure_modes.slice(0, 3).map((item, i) => (
                <li key={i}>- {item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 8. Footer trust strip ---------- */
function FooterTrust() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 flex-wrap text-[12.5px] text-slate-700">
      <div className="flex items-center gap-2">
        <IcCheck size={14} stroke={2.4} style={{ color: "#15803D" }} />
        <span>
          Reed opent op Mariana Tesla. KNMI, ESTOFEX, radar en bliksemdata blijven context zodra er echt iets speelt.
        </span>
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
  fontClassName = "",
  weatherCode = 2,
  isDay = true,
  lat = 52.1,
  lon = 5.18,
}: {
  view: ReedView;
  fontClassName?: string;
  weatherCode?: number;
  isDay?: boolean;
  lat?: number;
  lon?: number;
}) {
  const [expert, setExpert] = useState(true);
  const hasWarning = !!view.active;
  return (
    <main className={`reed-skin relative min-h-screen ${fontClassName}`}>
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />}>
        <WeatherBackground weatherCode={weatherCode} isDay={isDay} />
      </Suspense>
      <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-6 sm:py-10 reed-stagger">
        <StatusHeader view={view} expert={expert} onChange={setExpert} />
        {hasWarning ? (
          <>
            <ActiveWarning data={view.active!} />
            <LightningRadar lat={lat} lon={lon} />
            <SectionHeader windowLabel={view.windowLabel} />
            <LiveRisicoperiode view={view} expert={expert} onEnableExpert={() => setExpert(true)} />
            <EstofexOutlook data={view.estofex} />
            {view.tesla ? <TeslaExpertPanel signal={view.tesla} /> : null}
            <FooterTrust />
          </>
        ) : null}
      </div>
    </main>
  );
}
