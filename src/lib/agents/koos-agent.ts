/**
 * Koos-agent: "eropuit". Pure `koosHeadsUps` zet doorgerekende KoosPicks om in
 * heads-ups, met day-context als weging (weekend/vrije dag telt zwaarder).
 * `koosAgent` haalt de picks op (findGetawayPicks) en voegt Koos' stem toe.
 */

import type { AgentContext, AgentReport } from "@/lib/agents/context";
import type { AgentHeadsUp, AgentHeadsUpSeverity } from "@/lib/agents/types";
import type { DayContext } from "@/lib/agents/day-context";
import type { KoosPick } from "@/lib/koos-getaway";
import { findGetawayPicks } from "@/lib/koos-getaway";
import { koosVoice } from "@/lib/koos-voice";
import { marianaKoosText } from "@/lib/mariana/agent-context";

/** Korte "wanneer"-hint voor Koos (weekend/feestdag/vakantie). */
export function koosDayFlavour(day: DayContext): string | null {
  if (day.isHoliday && day.holidayName) return `${day.holidayName} — een vrije dag.`;
  if (day.isWeekend) return "het is weekend.";
  if (day.isSchoolHoliday && day.schoolHolidayName) return `${day.schoolHolidayName}.`;
  return null;
}

/**
 * Pure: KoosPicks + DayContext → heads-ups. Lege picks → []. Op een vrije dag
 * (weekend/feestdag) krijgt de sterkste kans iets meer gewicht (severity).
 */
export function koosHeadsUps(
  picks: KoosPick[],
  day: DayContext,
  originName: string,
  now: Date,
): AgentHeadsUp[] {
  if (picks.length === 0) return [];
  const freeDay = day.isWeekend || day.isHoliday;
  // Toon hooguit de 2 sterkste als heads-up (de pagina toont de volledige lijst).
  const top = [...picks].sort((a, b) => b.opportunity.score - a.opportunity.score).slice(0, 2);
  return top.map((p, i) => {
    const o = p.opportunity;
    const strong = o.score >= 20;
    const severity: AgentHeadsUpSeverity = i === 0 && freeDay && strong ? "useful" : "info";
    const dist = o.distanceKm ? ` (${o.distanceKm} km)` : "";
    return {
      id: `koos:better_place:${o.targetLocationId}`,
      agent: "koos",
      category: "better_place",
      severity,
      title: `Beter weer in ${o.targetName}`,
      message: o.reason,
      action: `${freeDay ? "Mooie dag om eropuit te gaan" : "Als je een moment hebt"}: richting ${o.targetName}${dist}.`,
      confidence: o.confidence,
      validFrom: now.toISOString(),
      locationId: originName,
      targetLocationId: o.targetLocationId,
      createdAt: now.toISOString(),
    };
  });
}

function localKoosHeadsUps(ctx: AgentContext): AgentHeadsUp[] {
  const date = ctx.day.date;
  const currentHour = Number(new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Amsterdam",
  }).format(ctx.now));
  const hours = ctx.weather.hourly.filter((hour) => {
    if (!hour.time.startsWith(date)) return false;
    const localHour = Number(hour.time.slice(11, 13));
    return localHour >= Math.max(8, currentHour) && localHour <= 20;
  });
  if (hours.length === 0) return [];

  const best = hours.reduce((current, hour) => {
    const score = hour.precipitation * 25 + hour.windSpeed - hour.temperature * 0.3;
    const currentScore = current.precipitation * 25 + current.windSpeed - current.temperature * 0.3;
    return score < currentScore ? hour : current;
  });
  const hour = Number(best.time.slice(11, 13));
  const start = `${String(hour).padStart(2, "0")}:00`;
  const end = `${String(Math.min(hour + 2, 22)).padStart(2, "0")}:00`;
  return [{
    id: `koos:local-window:${date}:${hour}`,
    agent: "koos",
    category: "going_out",
    severity: "info",
    title: `Beste buitenmoment: ${start}`,
    message: `Tussen ${start} en ${end} is de lokale combinatie van neerslag, wind en temperatuur het gunstigst.`,
    action: `Plan buitenactiviteiten bij voorkeur tussen ${start} en ${end}.`,
    confidence: 0.7,
    validFrom: ctx.now.toISOString(),
    locationId: ctx.location.name,
    createdAt: ctx.now.toISOString(),
  }];
}

/** Koos-agent over de context: picks + heads-ups + stem (day-aware, soft-fail). */
function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function koosAgent(
  ctx: AgentContext,
  options: { includeVoice?: boolean; timeoutMs?: number; localOnly?: boolean } = {},
): Promise<AgentReport> {
  if (options.localOnly) {
    return { agent: "koos", headsUps: localKoosHeadsUps(ctx), voice: null };
  }
  const origin = { name: ctx.location.name, lat: ctx.location.lat, lon: ctx.location.lon };
  const fallback = { origin: null, picks: [] as KoosPick[] };
  const { picks } = options.timeoutMs
    ? await withDeadline(findGetawayPicks(origin), options.timeoutMs, fallback)
    : await findGetawayPicks(origin).catch(() => fallback);
  const headsUps = koosHeadsUps(picks, ctx.day, ctx.location.name, ctx.now);
  const voice =
    picks.length > 0 && options.includeVoice !== false
      ? await koosVoice(
          origin,
          picks.map((p) => p.opportunity),
          { marianaText: marianaKoosText(ctx.mariana), dayFlavour: koosDayFlavour(ctx.day) },
        ).catch(() => null)
      : null;
  return { agent: "koos", headsUps, voice };
}
