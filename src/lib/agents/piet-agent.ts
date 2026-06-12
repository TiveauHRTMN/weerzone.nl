/**
 * Piet-agent: de alledaagse heads-up. Pure `pietHeadsUps` leidt dag-advies +
 * een "beste moment" af uit de PietView en de DayContext (weekend/feestdag/
 * vakantie kleuren toon en relevantie). `pietAgent` voegt Piet's LLM-stem toe
 * (fetchPietWeerbericht, soft-fail naar de sjabloon-story).
 *
 * Piet emit NOOIT gevaar-categorieën (regen/wind/onweer) — dat is Reed's werk.
 */

import type { AgentContext, AgentReport } from "@/lib/agents/context";
import type { AgentHeadsUp } from "@/lib/agents/types";
import type { DayContext } from "@/lib/agents/day-context";
import type { PietView } from "@/lib/piet-view";
import { buildPietView } from "@/lib/piet-view";
import { fetchPietWeerbericht } from "@/lib/piet-forecast";

/** Kleine toon-hint uit de dag-context (weekend/feestdag/vakantie). */
function dayFlavour(day: DayContext): string {
  if (day.isHoliday && day.holidayName) return ` Het is ${day.holidayName}.`;
  if (day.isWeekend) return " Het is weekend.";
  if (day.isSchoolHoliday && day.schoolHolidayName) return ` Het is ${day.schoolHolidayName}.`;
  return "";
}

/**
 * Pure: PietView + DayContext → heads-ups. Altijd minstens een daily_advice;
 * een best_moment als er een duidelijk droog/zonnig venster is.
 */
export function pietHeadsUps(view: PietView, day: DayContext, now: Date): AgentHeadsUp[] {
  const out: AgentHeadsUp[] = [];
  const vd = view.days.vd;

  // 1) Dag-advies (altijd). Concreet kledings-/planning-advies uit de cijfers.
  const clothing = view.scores.find((s) => s.key === "kleding");
  out.push({
    id: `piet:daily_advice:${vd.date}`,
    agent: "piet",
    category: "daily_advice",
    severity: "info",
    title: `${vd.weekday}: ${vd.tagline.toLowerCase()}`,
    message: `${view.headline}${dayFlavour(day)}`,
    action: clothing?.tip ?? "Kleed je op de temperatuur van vandaag.",
    confidence: 0.8,
    validFrom: now.toISOString(),
    locationId: view.locationName,
    createdAt: now.toISOString(),
  });

  // 2) Beste moment: droge, relatief zonnige dag → tip het beste dagdeel.
  const dryEnough = vd.regen <= 30;
  const sunny = vd.zon >= 5;
  if (dryEnough && sunny) {
    const parts = vd.dagdelen;
    const best =
      parts.middag.k !== "rain"
        ? { label: "vanmiddag", t: parts.middag.t }
        : parts.ochtend.k !== "rain"
          ? { label: "vanochtend", t: parts.ochtend.t }
          : { label: "vanavond", t: parts.avond.t };
    const terras = view.scores.find((s) => s.key === "terras");
    out.push({
      id: `piet:best_moment:${vd.date}`,
      agent: "piet",
      category: "best_moment",
      severity: "useful",
      title: "Beste moment om buiten te zijn",
      message: `${best.label.charAt(0).toUpperCase() + best.label.slice(1)} is het droog en aangenaam, een graad of ${best.t}.${day.isWeekend ? " Mooi weekendweer." : ""}`,
      action: terras && terras.score >= 4 ? terras.tip : `Plan je buitenplannen rond ${best.label}.`,
      confidence: 0.7,
      validFrom: now.toISOString(),
      locationId: view.locationName,
      createdAt: now.toISOString(),
    });
  }

  return out;
}

/** Piet-agent over de context: heads-ups + de echte LLM-stem (soft-fail). */
export async function pietAgent(ctx: AgentContext, options: { includeVoice?: boolean } = {}): Promise<AgentReport> {
  const view = buildPietView(ctx.weather, ctx.location.name, null, ctx.now);
  const headsUps = pietHeadsUps(view, ctx.day, ctx.now);
  const voice = options.includeVoice === false
    ? null
    : await fetchPietWeerbericht(
        ctx.location.lat,
        ctx.location.lon,
        ctx.location.name,
        ctx.weather,
      ).catch(() => null);
  return { agent: "piet", headsUps, voice };
}
