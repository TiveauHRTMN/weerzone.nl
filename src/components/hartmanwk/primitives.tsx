/* Hartman WK Poule — visuele primitives (vlaggen, iconen, avatars, badges). */
import type { CSSProperties } from "react";
import { TEAMS, type FlagSpec, type FlagOp, type WeatherKind } from "@/lib/wkpoule-data";

// ---------------------------------------------------------------- Vlag
function starPath(cx: number, cy: number, r: number, ir?: number) {
  const inner = ir ?? r * 0.382;
  let p = "";
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? inner : r;
    p += (i ? "L" : "M") + (cx + Math.cos(ang) * rr).toFixed(2) + "," + (cy + Math.sin(ang) * rr).toFixed(2);
  }
  return p + "Z";
}

function flagBase(base: (string | number)[]) {
  const [kind, ...rest] = base as [string, ...(string | number)[]];
  if (kind === "solid") return [<rect key="b" x="0" y="0" width="30" height="20" fill={rest[0] as string} />];
  if (kind === "h") {
    const n = rest.length;
    return rest.map((c, i) => <rect key={i} x="0" y={((i * 20) / n).toFixed(3)} width="30" height={(20 / n + 0.05).toFixed(3)} fill={c as string} />);
  }
  if (kind === "v") {
    const n = rest.length;
    return rest.map((c, i) => <rect key={i} x={((i * 30) / n).toFixed(3)} y="0" width={(30 / n + 0.05).toFixed(3)} height="20" fill={c as string} />);
  }
  if (kind === "rep") {
    const [c1, c2, n] = rest as [string, string, number];
    const out = [];
    for (let i = 0; i < n; i++) out.push(<rect key={i} x="0" y={((i * 20) / n).toFixed(3)} width="30" height={(20 / n + 0.05).toFixed(3)} fill={i % 2 ? c2 : c1} />);
    return out;
  }
  return [];
}

function flagOp(op: FlagOp, i: number) {
  switch (op.t) {
    case "r":
      return <rect key={i} x={op.x} y={op.y} width={op.w} height={op.h} fill={op.c} />;
    case "p":
      return <polygon key={i} points={op.d} fill={op.c} />;
    case "c":
      return <circle key={i} cx={op.cx} cy={op.cy} r={op.r} fill={op.c || "none"} stroke={op.stroke} strokeWidth={op.sw} />;
    case "s":
      return <path key={i} d={starPath(op.cx, op.cy, op.r, op.ir)} fill={op.c || "none"} stroke={op.stroke} strokeWidth={op.sw} />;
    case "path":
      return <path key={i} d={op.d} fill={op.c || "none"} stroke={op.stroke} strokeWidth={op.sw} />;
    case "l":
      return <line key={i} x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} stroke={op.c} strokeWidth={op.sw} />;
    default:
      return null;
  }
}

export function Flag({ code, w = 30 }: { code: string; w?: number }) {
  const team = TEAMS[code];
  if (!team) return null;
  const fl: FlagSpec = team.fl;
  const base = Array.isArray(fl) ? fl : fl.b;
  const ops = Array.isArray(fl) ? [] : fl.o || [];
  const h = (w * 20) / 30;
  return (
    <svg
      viewBox="0 0 30 20"
      width={w}
      height={h}
      className="team-flag"
      preserveAspectRatio="xMidYMid slice"
      style={{ borderRadius: 3, display: "block", flex: "0 0 auto", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)", overflow: "hidden" }}
    >
      {flagBase(base)}
      {ops.map(flagOp)}
    </svg>
  );
}

// ---------------------------------------------------------------- Weericoon
export function WeatherIcon({ c, size = 18 }: { c: WeatherKind; size?: number }) {
  const sun = (cx: number, cy: number, r: number, color = "#F6A724") => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (r + 1.5);
        const y1 = cy + Math.sin(rad) * (r + 1.5);
        const x2 = cx + Math.cos(rad) * (r + 3.6);
        const y2 = cy + Math.sin(rad) * (r + 3.6);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" strokeLinecap="round" />;
      })}
    </g>
  );
  const cloud = (fill = "#C3D3E0") => <path d="M7 17 a4 4 0 0 1 0.4 -7.9 a5 5 0 0 1 9.5 1.2 a3.4 3.4 0 0 1 -0.4 6.7 z" fill={fill} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      {c === "sun" && sun(12, 12, 5.5)}
      {c === "part" && (
        <g>
          {sun(8.5, 8.5, 4)}
          {cloud("#D7E3EC")}
        </g>
      )}
      {c === "cloud" && cloud("#B8C8D6")}
      {c === "rain" && (
        <g>
          {cloud("#A9BBCB")}
          {[8, 12, 16].map((x, i) => (
            <line key={i} x1={x} y1={18.5} x2={x - 1.5} y2={22} stroke="#5FA8DC" strokeWidth="1.6" strokeLinecap="round" />
          ))}
        </g>
      )}
    </svg>
  );
}

export function WeatherChip({ weer }: { weer: { t: number; c: WeatherKind } }) {
  return (
    <span className="weerchip" title="Weer bij de speelstad">
      <WeatherIcon c={weer.c} size={15} />
      <span>{weer.t}°</span>
    </span>
  );
}

// ---------------------------------------------------------------- Avatar
const PALETTE = ["#3B8EEA", "#2E9E8F", "#C77D2E", "#7A6BD6", "#C25B7E", "#3E8E5A", "#5E89B0"];
export function Avatar({ name, me, size = 38 }: { name: string; me?: boolean; size?: number }) {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(" ");
  const initials = (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  const bg = me ? "var(--crimson)" : PALETTE[Math.abs(hash) % PALETTE.length];
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: bg,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    fontSize: size * 0.38,
    flex: "0 0 auto",
    letterSpacing: ".02em",
    boxShadow: me ? "0 0 0 3px rgba(255,0,48,.25)" : "none",
  };
  return <div style={style}>{initials}</div>;
}

// ---------------------------------------------------------------- Nav-iconen
type IconName = "stand" | "ball" | "groups" | "user" | "trophy" | "fantasy";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    stand: <g {...p}><path d="M6 20V10M12 20V4M18 20v-7" /></g>,
    ball: <g {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5l3.5 2.6-1.3 4.1h-4.4L8.5 10.1z" /><path d="M12 7.5V4M15.5 10.1l3-1.6M14.2 14.2l1.8 3M9.8 14.2l-1.8 3M8.5 10.1l-3-1.6" /></g>,
    groups: <g {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></g>,
    user: <g {...p}><circle cx="12" cy="8.5" r="3.7" /><path d="M5 20a7 7 0 0 1 14 0" /></g>,
    trophy: <g {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M17 5h2.5a2.5 2.5 0 0 1-2.5 4M7 5H4.5A2.5 2.5 0 0 0 7 9M10 13.5h4M9 20h6M12 13.5V20" /></g>,
    fantasy: <g {...p}><path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L4.5 8.5l5.2-.8z" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

// ---------------------------------------------------------------- Delta (stijger/daler)
export function Delta({ d }: { d: number }) {
  if (d === 0) return <span className="delta delta-flat">—</span>;
  const up = d > 0;
  return (
    <span className={"delta " + (up ? "delta-up" : "delta-down")}>
      <svg width="9" height="9" viewBox="0 0 10 10" style={{ display: "block" }}>
        <path d={up ? "M5 1L9 7H1z" : "M5 9L1 3h8z"} fill="currentColor" />
      </svg>
      {Math.abs(d)}
    </span>
  );
}

// ---------------------------------------------------------------- Medaille (top 3)
export function Medal({ rank }: { rank: 1 | 2 | 3 }) {
  const colors: Record<number, [string, string]> = {
    1: ["#FFD75E", "#E6A700"],
    2: ["#E2E8F0", "#9AA8BC"],
    3: ["#E5A977", "#C77B43"],
  };
  const [c1, c2] = colors[rank];
  return (
    <span className={"medal medal-" + rank} aria-label={rank + "e plaats"}>
      <svg width="26" height="26" viewBox="0 0 24 24">
        <defs>
          <linearGradient id={"med" + rank} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="12" cy="14" r="7.5" fill={`url(#med${rank})`} stroke="rgba(0,0,0,.18)" strokeWidth="0.6" />
        <path d="M8 2h3l1 5-2.5 1z" fill={c2} opacity=".8" />
        <path d="M16 2h-3l-1 5 2.5 1z" fill={c2} opacity=".8" />
        <text x="12" y="17.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#3a2a00">{rank}</text>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------- Progress bar
export function Progress({ value, max, tone = "crimson" }: { value: number; max: number; tone?: "crimson" | "good" | "accent" }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="progress">
      <div className={"progress-fill progress-" + tone} style={{ width: pct + "%" }} />
    </div>
  );
}
