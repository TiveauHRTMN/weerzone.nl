import type { CSSProperties } from "react";
import Link from "next/link";
import type { AgentContext } from "@/lib/agents/context";
import type { AgentPreferenceKey, AgentPreferences } from "@/lib/agents/preferences";
import { activeAgentKeys } from "@/lib/agents/preferences";
import { getWeatherDescription } from "@/lib/weather";

const META: Record<AgentPreferenceKey, { label: string; role: string; color: string; bg: string; fg: string }> = {
  piet: { label: "Piet", role: "Dagbeeld", color: "#0284C7", bg: "#e0f2fe", fg: "#0369a1" },
  reed: { label: "Reed", role: "Risico", color: "#EA580C", bg: "#ffedd5", fg: "#9a3412" },
  koos: { label: "Koos", role: "Planning", color: "#059669", bg: "#d1fae5", fg: "#047857" },
};

const CTA: Record<AgentPreferenceKey, string> = {
  piet: "Bekijk het volledige dagbeeld",
  reed: "Bekijk alle risico's",
  koos: "Bekijk de beste buitenmomenten",
};

function vars(agent: AgentPreferenceKey): CSSProperties {
  const meta = META[agent];
  return { "--va-accent": meta.color, "--va-accent-bg": meta.bg, "--va-accent-fg": meta.fg } as CSSProperties;
}

function nlDate(date: string): string {
  const value = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(new Date(`${date}T12:00:00`));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function bestWindow(ctx: AgentContext, date: string): string | null {
  const daytime = ctx.weather.hourly.filter((hour) => hour.time.startsWith(date) && Number(hour.time.slice(11, 13)) >= 8 && Number(hour.time.slice(11, 13)) <= 20);
  if (!daytime.length) return null;
  const best = daytime.reduce((current, hour) => {
    const score = hour.precipitation * 20 + hour.windSpeed - hour.temperature;
    const currentScore = current.precipitation * 20 + current.windSpeed - current.temperature;
    return score < currentScore ? hour : current;
  });
  const hour = Number(best.time.slice(11, 13));
  return `${String(hour).padStart(2, "0")}:00-${String(Math.min(hour + 2, 22)).padStart(2, "0")}:00`;
}

function TomorrowCard({ agent, title, detail, action, status }: {
  agent: AgentPreferenceKey;
  title: string;
  detail: string;
  action: string;
  status: string;
}) {
  const meta = META[agent];
  return (
    <article id={agent} className="va-card scroll-mt-24 p-5 sm:p-6" style={vars(agent)}>
      <div className="flex items-center justify-between gap-3">
        <span className="va-chip">{meta.label} - {meta.role}</span>
        <span className="va-micro" style={{ color: meta.fg }}>{status}</span>
      </div>
      <h2 className="mt-3 text-[18px] font-extrabold leading-tight text-slate-900 sm:text-[20px]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
      <div className="va-action mt-4"><span aria-hidden>-&gt;</span><span>{action}</span></div>
      <Link href={`/${agent}`} className="va-deeplink mt-3">{CTA[agent]} <span aria-hidden>-&gt;</span></Link>
    </article>
  );
}

export default function TomorrowAgentFeed({ ctx, preferences }: { ctx: AgentContext; preferences: AgentPreferences }) {
  const tomorrow = ctx.weather.daily[1];
  if (!tomorrow) return null;

  const tomorrowHours = ctx.weather.hourly.filter((hour) => hour.time.startsWith(tomorrow.date));
  const maxCape = Math.max(0, ...tomorrowHours.map((hour) => hour.cape ?? 0));
  const maxWind = Math.max(tomorrow.windSpeedMax, ...tomorrowHours.map((hour) => hour.windSpeed ?? 0));
  const warning = ctx.knmi.length > 0 || maxCape >= 800 || maxWind >= 60;
  const window = bestWindow(ctx, tomorrow.date);
  const activeAgents = activeAgentKeys(preferences);

  const cards: Record<AgentPreferenceKey, { title: string; detail: string; action: string; status: string }> = {
    piet: {
      title: `${getWeatherDescription(tomorrow.weatherCode)}, ${Math.round(tomorrow.tempMin)} tot ${Math.round(tomorrow.tempMax)} graden`,
      detail: `${tomorrow.precipitationSum > 0.5 ? `${tomorrow.precipitationSum.toFixed(1)} mm neerslag mogelijk.` : "Nauwelijks neerslag verwacht."} De wind haalt ongeveer ${Math.round(tomorrow.windSpeedMax)} km/u.`,
      action: tomorrow.precipitationSum > 1 ? "Plan met een droge marge en neem iets tegen de regen mee." : "Je kunt de dag zonder grote weersaanpassing plannen.",
      status: "Basis",
    },
    reed: {
      title: warning ? "Houd rekening met een onrustig moment" : "Geen zwaar weersignaal voor morgen",
      detail: warning ? `Er kunnen stevige wind of felle buien voorkomen. De wind kan oplopen tot ongeveer ${Math.round(maxWind)} km/u.` : "Er zijn nu geen aanwijzingen voor zwaar weer op jouw plek.",
      action: warning ? "Controleer morgenochtend de laatste waarschuwingen." : "Je hoeft je planning nu niet aan te passen.",
      status: warning ? "Let op" : "Rust",
    },
    koos: {
      title: window ? `Beste kans om eropuit te gaan: ${window}` : "Nog geen duidelijk buitenmoment",
      detail: window ? "In dit tijdvak is de combinatie van droogte, temperatuur en wind het gunstigst." : "Er is nog geen duidelijk beste moment. Morgenochtend is de verwachting nauwkeuriger.",
      action: window ? `Gebruik ${window} als eerste keuze voor buitenplannen.` : "Kijk morgenochtend opnieuw voordat je vertrekt.",
      status: window ? "Kans" : "Volgt",
    },
  };

  return (
    <div className="va-stagger relative z-10 mx-auto max-w-[640px] space-y-4 px-4 py-9 sm:px-6 sm:py-14">
      <header className="va-card p-6 sm:p-8" style={vars(activeAgents[0] ?? "piet")}>
        <div className="flex items-center justify-between gap-3">
          <span className="va-micro text-slate-400">WEERZONE - Morgen</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><span className="va-dot" style={{ background: "#22c55e" }} />Actueel</span>
          </span>
        </div>
        <h1 className="mt-3 text-[30px] font-extrabold leading-[1.03] text-slate-900 sm:text-[40px]">Morgen in {ctx.location.name}</h1>
        <p className="mt-2.5 text-[14px] font-semibold text-slate-500">{nlDate(tomorrow.date)}</p>
        <p className="mt-5 max-w-[58ch] text-[15.5px] leading-relaxed text-slate-700">Eerst het dagbeeld, daarna alleen het risico en de planning die ertoe doen.</p>
      </header>
      <div className="va-onsky va-micro px-1 pt-1">Jouw vooruitblik</div>
      {activeAgents.map((agent) => <TomorrowCard key={agent} agent={agent} {...cards[agent]} />)}
      <footer className="va-onsky pt-2 text-[13px] font-medium">Gebaseerd op recente weergegevens voor jouw plek.</footer>
    </div>
  );
}
