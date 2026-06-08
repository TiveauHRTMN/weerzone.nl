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

/** Koos-agent over de context: picks + heads-ups + stem (day-aware, soft-fail). */
export async function koosAgent(ctx: AgentContext): Promise<AgentReport> {
  const origin = { name: ctx.location.name, lat: ctx.location.lat, lon: ctx.location.lon };
  const { picks } = await findGetawayPicks(origin).catch(() => ({
    origin: null,
    picks: [] as KoosPick[],
  }));
  const headsUps = koosHeadsUps(picks, ctx.day, ctx.location.name, ctx.now);
  const voice =
    picks.length > 0
      ? await koosVoice(
          origin,
          picks.map((p) => p.opportunity),
          { marianaText: marianaKoosText(ctx.mariana), dayFlavour: koosDayFlavour(ctx.day) },
        ).catch(() => null)
      : null;
  return { agent: "koos", headsUps, voice };
}
