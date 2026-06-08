/**
 * AgentFeed — de gedeelde, gecoördineerde heads-up feed van /vandaag.
 *
 * Rendert de orkestrator-uitkomst: Piet, Reed en Koos als één systeem. De
 * leidende agent (Reed bij gevaar, anders Piet) opent met zijn stem; daaronder
 * de gerangschikte, ontdubbelde heads-ups, elk met agent-identiteit + concrete
 * actie. Server component — geen client-state, beweging via CSS (vandaag-skin).
 */

import type { CSSProperties, ReactNode } from "react";
import type { AgentSystemResult } from "@/lib/agents/orchestrator";
import type { AgentHeadsUp, WeatherAgent } from "@/lib/agents/types";
import type { DayContext } from "@/lib/agents/day-context";

interface AgentMeta {
  label: string;
  role: string;
  accent: string;
  accentBg: string;
  accentFg: string;
  icon: ReactNode;
}

const Bolt = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);
const Sun = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>
);
const Compass = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="16.2 7.8 13 13 7.8 16.2 11 11" fill="currentColor" stroke="none" /></svg>
);
const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="18" y2="12" /><polyline points="12 6 18 12 12 18" /></svg>
);

const AGENT_META: Record<WeatherAgent, AgentMeta> = {
  piet: { label: "Piet", role: "Je dag", accent: "#0284C7", accentBg: "#e0f2fe", accentFg: "#0369a1", icon: <Sun /> },
  reed: { label: "Reed", role: "Onweer & storm", accent: "#EA580C", accentBg: "#ffedd5", accentFg: "#9a3412", icon: <Bolt /> },
  koos: { label: "Koos", role: "Eropuit", accent: "#059669", accentBg: "#d1fae5", accentFg: "#047857", icon: <Compass /> },
  steve: { label: "Steve", role: "Zakelijk", accent: "#7c3aed", accentBg: "#ede9fe", accentFg: "#6d28d9", icon: <Sun /> },
};

const SEVERITY_DOT: Record<AgentHeadsUp["severity"], string> = {
  urgent: "#EF4444",
  important: "#F97316",
  useful: "#F59E0B",
  info: "#94A3B8",
};

function accentVars(agent: WeatherAgent): CSSProperties {
  const m = AGENT_META[agent];
  return {
    "--va-accent": m.accent,
    "--va-accent-bg": m.accentBg,
    "--va-accent-fg": m.accentFg,
  } as CSSProperties;
}

function nlLongDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const s = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayBadge(day: DayContext): string | null {
  if (day.isHoliday && day.holidayName) return day.holidayName;
  if (day.isSchoolHoliday && day.schoolHolidayName) return day.schoolHolidayName;
  if (day.isWeekend) return "Weekend";
  return null;
}

function AgentChip({ agent }: { agent: WeatherAgent }) {
  const m = AGENT_META[agent];
  return (
    <span className="va-chip">
      {m.icon}
      {m.label} · {m.role}
    </span>
  );
}

function HeadsUpCard({ h, lead = false }: { h: AgentHeadsUp; lead?: boolean }) {
  const m = AGENT_META[h.agent];
  return (
    <article className="va-card p-5 sm:p-6" style={accentVars(h.agent)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <AgentChip agent={h.agent} />
        <span className="flex items-center gap-1.5 va-micro" style={{ color: m.accentFg }}>
          <span className={`va-dot ${h.severity === "urgent" ? "is-urgent" : ""}`} style={{ background: SEVERITY_DOT[h.severity] }} />
          {lead ? "Nu belangrijk" : h.severity === "urgent" ? "Urgent" : h.severity === "important" ? "Let op" : h.severity === "useful" ? "Handig" : "Goed om te weten"}
        </span>
      </div>

      <h2
        className={`mt-3 font-extrabold text-slate-900 leading-tight ${lead ? "text-[22px] sm:text-[26px]" : "text-[17px] sm:text-[18px]"}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        {h.title}
      </h2>

      <p className={`mt-1.5 text-slate-600 leading-relaxed max-w-[58ch] ${lead ? "text-[15px]" : "text-[14px]"}`}>
        {h.message}
      </p>

      <div className="mt-4 flex items-center gap-2 va-action">
        <Arrow />
        <span>{h.action}</span>
      </div>
    </article>
  );
}

export default function AgentFeed({
  result,
  locationName,
  day,
}: {
  result: AgentSystemResult;
  locationName: string;
  day: DayContext;
}) {
  const [leadHeadsUp, ...rest] = result.headsUps;
  const leadVoice = result.reports[result.leadAgent]?.voice ?? null;
  const badge = dayBadge(day);

  return (
    <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-8 sm:py-12 va-stagger space-y-4">
      {/* Kop */}
      <header className="pb-1">
        <div className="va-micro">WEERZONE · Vandaag</div>
        <h1 className="mt-2 text-[30px] sm:text-[40px] font-extrabold text-slate-900 leading-[1.04]" style={{ letterSpacing: "-0.03em" }}>
          Jouw dag in {locationName}
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap text-[14px] text-slate-500 font-semibold">
          <span>{nlLongDate(day.date)}</span>
          {badge && (
            <>
              <span className="text-slate-300">·</span>
              <span className="va-chip" style={{ "--va-accent-bg": "#fef3c7", "--va-accent-fg": "#92400e" } as CSSProperties}>
                {badge}
              </span>
            </>
          )}
        </div>
        {leadVoice && (
          <p className="mt-4 text-[15.5px] leading-relaxed text-slate-700 max-w-[60ch]">{leadVoice}</p>
        )}
      </header>

      {/* Feed */}
      {result.headsUps.length === 0 ? (
        <div className="va-card p-7 sm:p-9 text-center" style={accentVars("piet")}>
          <div className="va-micro">Rust</div>
          <p className="mt-3 text-[20px] sm:text-[24px] font-extrabold text-slate-900">{result.emptyState}</p>
          <p className="mt-2 text-[14px] text-slate-500">Piet, Reed en Koos houden het voor je in de gaten. Zodra er iets speelt, zie je het hier.</p>
        </div>
      ) : (
        <>
          {leadHeadsUp && <HeadsUpCard h={leadHeadsUp} lead />}
          {rest.map((h) => (
            <HeadsUpCard key={h.id} h={h} />
          ))}
        </>
      )}

      {/* Voet */}
      <footer className="pt-2 text-[12.5px] text-slate-500">
        Drie agents, één dag. <a href="/piet" className="font-bold text-slate-800">Piet</a> voor het hele beeld,{" "}
        <a href="/reed" className="font-bold text-slate-800">Reed</a> voor de extremen,{" "}
        <a href="/koos" className="font-bold text-slate-800">Koos</a> als je eropuit wilt.
      </footer>
    </div>
  );
}
