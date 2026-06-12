"use client";

/**
 * Koos · Beter weer elders
 * High-fidelity recreation of design_handoff_koos.
 * Visual-first demo content (destinations/travel are mock per the handoff;
 * routing + live destination weather are explicitly out of scope).
 * Dynamic weather background keyed off the visitor's local weather.
 * Styling: src/app/(site)/koos/koos-skin.css (scoped under .koos-skin).
 */

import { type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { KoosView, KoosDestinationView } from "@/lib/koos-view";

/* ---------- Lucide-style inline icons ---------- */
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
const IcCar = (p: IP) => (
  <Icon {...p}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </Icon>
);
const IcTrain = (p: IP) => (
  <Icon {...p}>
    <rect x="4" y="3" width="16" height="16" rx="2" />
    <path d="M4 11h16" />
    <path d="M12 3v8" />
    <path d="m8 19-2 3" />
    <path d="m18 22-2-3" />
    <path d="M8 15h.01" />
    <path d="M16 15h.01" />
  </Icon>
);
const IcPlane = (p: IP) => (
  <Icon {...p}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </Icon>
);
const IcMapPin = (p: IP) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
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
const IcArrowR = (p: IP) => (
  <Icon {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
);
const IcRoute = (p: IP) => (
  <Icon {...p}>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
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
const IcSparkles = (p: IP) => (
  <Icon {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
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

/* ---------- Weather icon helper ---------- */
type HourKind = "sun" | "cloudsun" | "cloud" | "rain";
const WeatherIcon = ({ k, size = 18, style }: { k: HourKind; size?: number; style?: CSSProperties }) => {
  const map: Record<HourKind, ComponentType<IP>> = { sun: IcSun, cloudsun: IcCloudSun, cloud: IcCloud, rain: IcCloudRain };
  const I = map[k] || IcSun;
  return <I size={size} stroke={2.2} style={style} />;
};
const conditionColor = (k: HourKind) =>
  k === "sun" ? "#F59E0B" : k === "cloudsun" ? "#06B6D4" : k === "cloud" ? "#64748B" : k === "rain" ? "#2563EB" : "#64748B";

/* ---------- Tones ---------- */
type DestTone = "yellow" | "orange" | "red" | "cyan" | "lime" | "blue";
const TONE_RGB: Record<DestTone, string> = {
  yellow: "245,158,11",
  orange: "249,115,22",
  red: "239,68,68",
  cyan: "6,182,212",
  lime: "132,204,22",
  blue: "37,99,235",
};
const TONE_FG: Record<DestTone, string> = {
  yellow: "#92400E",
  orange: "#9A3412",
  red: "#B91C1C",
  cyan: "#155E75",
  lime: "#3F6212",
  blue: "#1D4ED8",
};
const TONE_RAIL: Record<DestTone, string> = {
  yellow: "#F59E0B",
  orange: "#F97316",
  red: "#EF4444",
  cyan: "#06B6D4",
  lime: "#84CC16",
  blue: "#2563EB",
};
const rgba = (tone: DestTone, a: number) => `rgba(${TONE_RGB[tone]},${a})`;

/* ---------- View model (echte data via props; zie src/lib/koos-view.ts) ---------- */
type Dest = KoosDestinationView;

/* ---------- 1. Koos hero ---------- */
function KoosHero({ view, count }: { view: KoosView; count: number }) {
  const homeK: HourKind = view.homeWeatherCode >= 51 ? "rain" : view.homeWeatherCode <= 1 ? "sun" : "cloudsun";
  return (
    <div className="rcard p-7 sm:p-9 relative overflow-hidden">
      <div
        className="absolute -right-12 -top-12 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(6,182,212,.30), transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Micro>Koos · weer elders</Micro>
            <div className="livechip">
              <i />
              Live
            </div>
          </div>
          {view.homeTemp !== null && (
            <Chip tone={homeK === "rain" ? "blue" : "slate"} icon={<WeatherIcon k={homeK} size={11} />}>
              Hier: {view.homeTemp}°
            </Chip>
          )}
        </div>

        <h1 className="mt-5 text-[30px] sm:text-[40px] leading-[1.05] font-extrabold text-slate-900" style={{ letterSpacing: "-0.028em" }}>
          Geen zin in dit weer?
          <span
            style={{
              background: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {" "}
            Ik heb {count} {count === 1 ? "betere plek" : "betere plekken"}
          </span>
          .
        </h1>

        <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600 max-w-[58ch]">
          {view.intro ??
            `Verderop is het de komende dagen een stuk prettiger dan in ${view.locationName}. Koos houdt het in de gaten en tipt je waar het droger en zonniger is — hij tipt alleen, jij regelt de rest.`}
        </p>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <span className="text-[13.5px] text-slate-500">
            Jouw plek: <b className="text-slate-900">{view.locationName}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Top pick ---------- */
function TopPick({ d }: { d: Dest }) {
  const fg = TONE_FG[d.tone];
  const rail = TONE_RAIL[d.tone];
  return (
    <div className="mt-6 rcard overflow-hidden relative">
      <div
        className="absolute -right-12 top-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${rgba(d.tone, 0.13)}, transparent 70%)` }}
      />
      <div className="relative px-5 sm:px-7 pt-6 pb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Micro className="flex items-center gap-1.5">
            <IcSparkles size={11} stroke={2.4} style={{ color: rail }} />
            Top-keuze van Koos
          </Micro>
          <Chip tone={d.tone}>Beste de komende dagen</Chip>
        </div>

        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Chip tone="slate">{d.flag}</Chip>
              <span className="text-[12px] text-slate-500 font-semibold">{d.country}</span>
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-slate-900 leading-[1.02]" style={{ letterSpacing: "-0.03em" }}>
              {d.city}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <WeatherIcon k={d.k} size={36} style={{ color: conditionColor(d.k) }} />
            <div className="num font-extrabold text-slate-900 leading-none" style={{ fontSize: "56px", letterSpacing: "-0.04em" }}>
              {d.temp}
              <span style={{ color: "#94A3B8" }}>°</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          <Chip tone="yellow" icon={<IcSun size={11} stroke={2.4} />}>
            <b className="num">{d.zon} u</b> zon
          </Chip>
          <Chip tone={d.regen > 30 ? "blue" : "slate"} icon={<IcCloudRain size={11} stroke={2.4} />}>
            <b className="num">{d.regen}%</b> regen
          </Chip>
          {d.distanceKm > 0 && (
            <Chip tone="slate" icon={<IcMapPin size={11} stroke={2.4} />}>
              <b className="num">{d.distanceKm} km</b>
            </Chip>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="px-5 sm:px-7 py-5">
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: `linear-gradient(180deg, ${rgba(d.tone, 0.1)}, rgba(255,255,255,0))`, border: `1px solid ${rgba(d.tone, 0.22)}` }}
        >
          <span
            className="icon-tile"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: `linear-gradient(180deg,#fff,${rgba(d.tone, 0.18)})`,
              color: fg,
              border: `1px solid ${rgba(d.tone, 0.22)}`,
            }}
          >
            <IcSparkles size={14} stroke={2.2} />
          </span>
          <p className="flex-1 text-[14px] leading-relaxed text-slate-800">{d.tip}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. Destination card ---------- */
function DestinationCard({ d }: { d: Dest }) {
  const fg = TONE_FG[d.tone];
  return (
    <div className="dest-card lift" style={{ "--dest-glow": rgba(d.tone, 0.13) } as CSSProperties}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Chip tone="slate">{d.flag}</Chip>
            <span className="text-[11px] text-slate-500 font-semibold truncate">{d.country}</span>
          </div>
          <div className="text-[16.5px] font-extrabold text-slate-900 leading-tight truncate" style={{ letterSpacing: "-0.015em" }}>
            {d.city}
          </div>
        </div>
        <span
          className="icon-tile flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: `linear-gradient(180deg,#fff,${rgba(d.tone, 0.18)})`,
            color: fg,
            border: `1px solid ${rgba(d.tone, 0.22)}`,
          }}
        >
          <WeatherIcon k={d.k} size={18} />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="num font-extrabold text-slate-900 leading-none" style={{ fontSize: "34px", letterSpacing: "-0.03em" }}>
          {d.temp}
          <span style={{ color: "#94A3B8", fontSize: "22px" }}>°</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip tone="yellow" icon={<IcSun size={10} stroke={2.4} />}>
            <b className="num">{d.zon}u</b>
          </Chip>
          {d.regen > 0 && (
            <Chip tone={d.regen > 30 ? "blue" : "slate"}>
              <b className="num">{d.regen}%</b>
            </Chip>
          )}
        </div>
      </div>

      {d.distanceKm > 0 && (
        <div className="mt-4 flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,.04)" }}>
          <IcMapPin size={14} stroke={2.2} style={{ color: "#475569" }} />
          <div className="num text-[13px] font-extrabold text-slate-900 leading-tight">{d.distanceKm} km hiervandaan</div>
        </div>
      )}

      <div className="mt-3 text-[12.5px] leading-snug text-slate-600 min-h-[2.6em]">{d.tip}</div>
    </div>
  );
}

/* ---------- 4. Destinations grid ---------- */
function Destinations({ alts }: { alts: Dest[] }) {
  if (alts.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <Micro>Meer betere plekken</Micro>
        <span className="text-[11.5px] font-semibold text-slate-500 num">{alts.length} opties</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {alts.map((d) => (
          <DestinationCard key={d.city} d={d} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 5. Footer trust ---------- */
function FooterTrust() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 flex-wrap text-[12.5px] text-slate-700">
      <div className="flex items-center gap-2">
        <IcCheck size={14} stroke={2.4} style={{ color: "#15803D" }} />
        <span>Koos tipt alleen als het ergens écht beter is dan bij jou.</span>
      </div>
      <a href="/over" className="font-bold text-slate-900 inline-flex items-center gap-1">
        Over Koos <IcExt size={11} stroke={2.4} />
      </a>
    </div>
  );
}

/* ---------- 7. Rust-staat (Koos zwijgt) ---------- */
function KoosRust({ locationName }: { locationName: string }) {
  return (
    <div className="mt-6 rcard p-7 sm:p-9 text-center">
      <span className="icon-tile mx-auto" style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(180deg,#fff,#FEF3C7)", color: "#92400E", border: "1px solid #FEF3C7" }}>
        <IcSun size={20} stroke={2.2} />
      </span>
      <h2 className="mt-4 text-[22px] font-extrabold text-slate-900" style={{ letterSpacing: "-0.02em" }}>
        Thuis zit je de komende dagen prima
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-slate-600 max-w-[44ch] mx-auto">
        In {locationName} is het goed genoeg dat eropuit gaan weinig oplevert. Koos houdt het in de gaten en zegt het
        zodra er ergens iets beters opduikt.
      </p>
    </div>
  );
}

/* ---------- Page ---------- */
export default function KoosTravelPage({
  view,
  fontClassName = "",
  isDay = true,
}: {
  view: KoosView;
  fontClassName?: string;
  isDay?: boolean;
}) {
  const count = (view.top ? 1 : 0) + view.alternatives.length;
  return (
    <main className={`koos-skin relative min-h-screen ${fontClassName}`}>
      <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-6 sm:py-10 koos-stagger">
        <KoosHero view={view} count={count} />
        {view.top ? (
          <>
            <TopPick d={view.top} />
            <Destinations alts={view.alternatives} />
          </>
        ) : (
          <KoosRust locationName={view.locationName} />
        )}
        <FooterTrust />
      </div>
    </main>
  );
}
