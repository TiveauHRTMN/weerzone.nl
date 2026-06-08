/**
 * AgentFeed — de gedeelde, gecoördineerde heads-up feed van /vandaag.
 *
 * Rendert de orkestrator-uitkomst als één "ochtendbriefing" boven de live
 * weer-lucht: een frosted hero met de stem van de leidende agent, daaronder de
 * gerangschikte heads-ups (leidende eerst, geaccentueerd), elk met agent-
 * identiteit, concrete actie en een doorlink naar de agentpagina. Server
 * component — geen client-state; beweging via CSS (vandaag-skin).
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="18" y2="12" /><polyline points="12 6 18 12 12 18" /></svg>
);

const AGENT_META: Record<WeatherAgent, AgentMeta> = {
  piet: { label: "Piet", role: "Je dag", accent: "#0284C7", accentBg: "#e0f2fe", accentFg: "#0369a1", icon: <Sun /> },
  reed: { label: "Reed", role: "Onweer & storm", accent: "#EA580C", accentBg: "#ffedd5", accentFg: "#9a3412", icon: <Bolt /> },
  koos: { label: "Koos", role: "Eropuit", accent: "#059669", accentBg: "#d1fae5", accentFg: "#047857", icon: <Compass /> },
  steve: { label: "Steve", role: "Zakelijk", accent: "#7c3aed", accentBg: "#ede9fe", accentFg: "#6d28d9", icon: <Sun /> },
};

const AGENT_HREF: Record<WeatherAgent, string> = {
  piet: "/piet",
  reed: "/reed",
  koos: "/koos",
  steve: "/steve",
};

const SEVERITY_DOT: Record<AgentHeadsUp["severity"], string> = {
  urgent: "#EF4444",
  important: "#F97316",
  useful: "#F59E0B",
  info: "#94A3B8",
};

function severityLabel(s: AgentHeadsUp["severity"]): string {
  return s === "urgent" ? "Urgent" : s === "important" ? "Let op" : s === "useful" ? "Handig" : "Goed om te weten";
}

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
    <article className={`va-card has-accent ${lead ? "va-lead" : ""} p-5 sm:p-6`} style={accentVars(h.agent)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <AgentChip agent={h.agent} />
        <span className="flex items-center gap-1.5 va-micro" style={{ color: m.accentFg }}>
          <span className={`va-dot ${h.severity === "urgent" ? "is-urgent" : ""}`} style={{ background: SEVERITY_DOT[h.severity] }} />
          {lead ? "Nu belangrijk" : severityLabel(h.severity)}
        </span>
      </div>

      <h2
        className={`mt-3 font-extrabold text-slate-900 leading-tight ${lead ? "text-[23px] sm:text-[27px]" : "text-[17px] sm:text-[19px]"}`}
        style={{ letterSpacing: "-0.022em" }}
      >
        {h.title}
      </h2>

      <p className={`mt-2 text-slate-600 leading-relaxed max-w-[56ch] ${lead ? "text-[15px]" : "text-[14px]"}`}>
        {h.message}
      </p>

      <div className="mt-4 flex items-start gap-2 va-action">
        <span className="mt-[2px] flex-none"><Arrow /></span>
        <span>{h.action}</span>
      </div>

      <a href={AGENT_HREF[h.agent]} className="va-deeplink mt-3">
        Meer bij {m.label} <span aria-hidden>→</span>
      </a>
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
  const hasFeed = result.headsUps.length > 0;

  return (
    <div className="relative z-10 max-w-[640px] mx-auto px-4 sm:px-6 py-9 sm:py-14 va-stagger space-y-4">
      {/* Hero — frosted, met de stem van de leidende agent */}
      <header className="va-card has-accent p-6 sm:p-8" style={accentVars(result.leadAgent)}>
        <div className="flex items-center justify-between gap-3">
          <span className="va-micro text-slate-400">WEERZONE · Vandaag</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            <span className="va-dot" style={{ background: "#22c55e" }} /> Live
          </span>
        </div>
        <h1 className="mt-3 text-[30px] sm:text-[40px] font-extrabold text-slate-900 leading-[1.03]" style={{ letterSpacing: "-0.032em" }}>
          Jouw dag in {locationName}
        </h1>
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[14px] text-slate-500 font-semibold">
          <span>{nlLongDate(day.date)}</span>
          {badge && (
            <span className="va-chip" style={{ "--va-accent-bg": "#fef3c7", "--va-accent-fg": "#92400e" } as CSSProperties}>
              {badge}
            </span>
          )}
        </div>
        {leadVoice && (
          <p className="mt-5 text-[15.5px] leading-relaxed text-slate-700 max-w-[58ch]">{leadVoice}</p>
        )}
      </header>

      {/* Feed */}
      {hasFeed ? (
        <>
          <div className="va-onsky va-micro px-1 pt-1">Wat er speelt</div>
          {leadHeadsUp && <HeadsUpCard h={leadHeadsUp} lead />}
          {rest.map((h) => (
            <HeadsUpCard key={h.id} h={h} />
          ))}
        </>
      ) : (
        <div className="va-card has-accent p-7 sm:p-9 text-center" style={accentVars("piet")}>
          <div className="va-micro text-slate-400">Rust</div>
          <p className="mt-3 text-[21px] sm:text-[25px] font-extrabold text-slate-900 leading-snug">{result.emptyState}</p>
          <p className="mt-2 text-[14px] text-slate-500 max-w-[44ch] mx-auto">
            Piet, Reed en Koos houden het voor je in de gaten. Zodra er iets speelt, zie je het hier.
          </p>
        </div>
      )}

      {/* Voet — op de lucht, wit met schaduw */}
      <footer className="va-onsky pt-2 text-[13px] font-medium leading-relaxed">
        Drie agents, één dag.{" "}
        <a href="/piet" className="font-bold underline-offset-2 hover:underline">Piet</a> voor het hele beeld,{" "}
        <a href="/reed" className="font-bold underline-offset-2 hover:underline">Reed</a> voor de extremen,{" "}
        <a href="/koos" className="font-bold underline-offset-2 hover:underline">Koos</a> als je eropuit wilt.
      </footer>
    </div>
  );
}
