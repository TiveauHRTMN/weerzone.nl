import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { AgentSystemResult } from "@/lib/agents/orchestrator";
import type { AgentHeadsUp, WeatherAgent } from "@/lib/agents/types";
import type { DayContext } from "@/lib/agents/day-context";
import {
  activeAgentKeys,
  type AgentPreferenceKey,
} from "@/lib/agents/preferences";

interface AgentMeta {
  label: string;
  role: string;
  accent: string;
  accentBg: string;
  accentFg: string;
  icon: ReactNode;
}

const Sun = () => <span aria-hidden>O</span>;
const Bolt = () => <span aria-hidden>!</span>;
const Compass = () => <span aria-hidden>+</span>;
const Arrow = () => <span aria-hidden>-&gt;</span>;

const AGENT_META: Record<WeatherAgent, AgentMeta> = {
  piet: { label: "Piet", role: "Je dag", accent: "#0284C7", accentBg: "#e0f2fe", accentFg: "#0369a1", icon: <Sun /> },
  reed: { label: "Reed", role: "Risico", accent: "#EA580C", accentBg: "#ffedd5", accentFg: "#9a3412", icon: <Bolt /> },
  koos: { label: "Koos", role: "Eropuit", accent: "#059669", accentBg: "#d1fae5", accentFg: "#047857", icon: <Compass /> },
  steve: { label: "Steve", role: "Zakelijk", accent: "#7c3aed", accentBg: "#ede9fe", accentFg: "#6d28d9", icon: <Sun /> },
};

const AGENT_HREF: Record<AgentPreferenceKey, string> = {
  piet: "/vandaag#piet",
  reed: "/vandaag#reed",
  koos: "/vandaag#koos",
};

const AGENT_CTA: Record<AgentPreferenceKey, string> = {
  piet: "Bekijk het volledige dagbeeld",
  reed: "Bekijk alle risico's",
  koos: "Bekijk de beste buitenmomenten",
};

const SEVERITY_DOT: Record<AgentHeadsUp["severity"], string> = {
  urgent: "#EF4444",
  important: "#F97316",
  useful: "#F59E0B",
  info: "#94A3B8",
};

function severityLabel(severity: AgentHeadsUp["severity"]): string {
  if (severity === "urgent") return "Urgent";
  if (severity === "important") return "Let op";
  if (severity === "useful") return "Handig";
  return "Rustig";
}

function accentVars(agent: WeatherAgent): CSSProperties {
  const meta = AGENT_META[agent];
  return {
    "--va-accent": meta.accent,
    "--va-accent-bg": meta.accentBg,
    "--va-accent-fg": meta.accentFg,
  } as CSSProperties;
}

function nlLongDate(isoDate: string): string {
  const value = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(`${isoDate}T12:00:00`));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dayBadge(day: DayContext): string | null {
  if (day.isHoliday && day.holidayName) return day.holidayName;
  if (day.isSchoolHoliday && day.schoolHolidayName) return day.schoolHolidayName;
  if (day.isWeekend) return "Weekend";
  return null;
}

function AgentChip({ agent }: { agent: AgentPreferenceKey }) {
  const meta = AGENT_META[agent];
  return <span className="va-chip">{meta.icon}{meta.label} - {meta.role}</span>;
}

function HeadsUpCard({ headsUp, lead, anchorId }: { headsUp: AgentHeadsUp; lead: boolean; anchorId?: string }) {
  const agent = headsUp.agent as AgentPreferenceKey;
  const meta = AGENT_META[agent];
  return (
    <article id={anchorId} className={`va-card ${lead ? "va-lead" : ""} scroll-mt-24 p-5 sm:p-6`} style={accentVars(agent)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <AgentChip agent={agent} />
        <span className="flex items-center gap-1.5 va-micro" style={{ color: meta.accentFg }}>
          <span className={`va-dot ${headsUp.severity === "urgent" ? "is-urgent" : ""}`} style={{ background: SEVERITY_DOT[headsUp.severity] }} />
          {lead ? "Nu belangrijk" : severityLabel(headsUp.severity)}
        </span>
      </div>
      <h2 className={`mt-3 font-extrabold leading-tight text-slate-900 ${lead ? "text-[23px] sm:text-[27px]" : "text-[17px] sm:text-[19px]"}`}>
        {headsUp.title}
      </h2>
      <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-slate-600">{headsUp.message}</p>
      <div className="va-action mt-4"><Arrow /><span>{headsUp.action}</span></div>
      <Link href={AGENT_HREF[agent]} className="va-deeplink mt-3">{AGENT_CTA[agent]} <span aria-hidden>-&gt;</span></Link>
    </article>
  );
}

function CalmCard({ agent }: { agent: AgentPreferenceKey }) {
  const meta = AGENT_META[agent];
  const copy: Record<AgentPreferenceKey, string> = {
    piet: "Geen extra actie nodig voor het gewone dagverloop.",
    reed: "Geen relevant risico door buien, wind of onweer.",
    koos: "Je eigen plek en planning zijn nu een logische keuze.",
  };
  return (
    <article id={agent} className="va-card scroll-mt-24 p-5 sm:p-6" style={accentVars(agent)}>
      <div className="flex items-center justify-between gap-3"><AgentChip agent={agent} /><span className="va-micro text-emerald-700">Rust</span></div>
      <h2 className="mt-3 text-[17px] font-extrabold text-slate-900">Geen bijzonderheden die je planning veranderen</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy[agent]}</p>
      <Link href={AGENT_HREF[agent]} className="va-deeplink mt-3">{AGENT_CTA[agent]} <span aria-hidden>-&gt;</span></Link>
    </article>
  );
}

export default function AgentFeed({ result, locationName, day }: { result: AgentSystemResult; locationName: string; day: DayContext }) {
  const activeAgents = activeAgentKeys(result.preferences);
  const visibleHeadsUps = result.headsUps;
  const agentsWithHeadsUp = new Set(visibleHeadsUps.map((item) => item.agent));
  const firstHeadsUpIndex = new Map<WeatherAgent, number>();
  visibleHeadsUps.forEach((item, index) => {
    if (!firstHeadsUpIndex.has(item.agent)) firstHeadsUpIndex.set(item.agent, index);
  });
  const leadVoice = result.reports[result.leadAgent]?.voice ?? null;
  const badge = dayBadge(day);

  return (
    <div className="va-stagger relative z-10 mx-auto max-w-[640px] space-y-4 px-4 py-9 sm:px-6 sm:py-14">
      <header className="va-card p-6 sm:p-8" style={accentVars(result.leadAgent)}>
        <div className="flex items-center justify-between gap-3">
          <span className="va-micro text-slate-400">WEERZONE - Vandaag</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><span className="va-dot" style={{ background: "#22c55e" }} />Actueel</span>
          </span>
        </div>
        <h1 className="mt-3 text-[30px] font-extrabold leading-[1.03] text-slate-900 sm:text-[40px]">Jouw dag in {locationName}</h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-slate-500">
          <span>{nlLongDate(day.date)}</span>
          {badge && <span className="va-chip" style={{ "--va-accent-bg": "#fef3c7", "--va-accent-fg": "#92400e" } as CSSProperties}>{badge}</span>}
        </div>
        {leadVoice && <p className="mt-5 max-w-[58ch] text-[15.5px] leading-relaxed text-slate-700">{leadVoice}</p>}
      </header>

      <div className="va-onsky va-micro px-1 pt-1">Jouw briefing</div>
      {visibleHeadsUps.map((headsUp, index) => (
        <HeadsUpCard
          key={headsUp.id}
          headsUp={headsUp}
          lead={index === 0}
          anchorId={firstHeadsUpIndex.get(headsUp.agent) === index ? headsUp.agent : undefined}
        />
      ))}
      {activeAgents.filter((agent) => !agentsWithHeadsUp.has(agent)).map((agent) => (
        <CalmCard key={agent} agent={agent} />
      ))}

      <footer className="va-onsky pt-2 text-[13px] font-medium leading-relaxed">
        Je ziet {activeAgents.map((agent) => AGENT_META[agent].label).join(", ")} in dit overzicht.
      </footer>
    </div>
  );
}
