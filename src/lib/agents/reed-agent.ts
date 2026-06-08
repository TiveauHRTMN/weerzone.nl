/**
 * Reed-agent: severe weather. Pure `reedHeadsUps` leidt heads-ups af uit de
 * (Tesla/KNMI/ESTOFEX-gevoede) ReedView; `reedAgent` bouwt de view uit de
 * AgentContext en voegt Reed's stem toe (soft-fail).
 */

import type { AgentContext, AgentReport } from "@/lib/agents/context";
import type {
  AgentHeadsUp,
  AgentHeadsUpSeverity,
  AgentHeadsUpCategory,
} from "@/lib/agents/types";
import type { EstofexBeneluxSummary } from "@/lib/estofex";
import type { ReedEstofex, ReedView } from "@/lib/reed-view";
import { buildReedView } from "@/lib/reed-view";
import { reedVoice } from "@/lib/reed-voice";

/** EstofexBeneluxSummary → de ReedEstofex-vorm die buildReedView verwacht. */
export function estofexToReed(s: EstofexBeneluxSummary | null): ReedEstofex | null {
  if (!s) return null;
  return {
    level: s.maxLevel,
    synopsis: s.beneluxText ?? "",
    imageUrl: s.imageUrl,
    sourceUrl: s.sourceUrl,
    validUntil: s.validUntil,
  };
}

function categoryFor(view: ReedView): AgentHeadsUpCategory {
  const badge = view.days.vd.badge;
  if (badge === "Wind") return "wind_risk";
  if (badge === "Zware regen") return "rain_risk";
  return "thunderstorm_risk"; // "Onweer" of generiek severe
}

/**
 * Pure: ReedView → heads-ups. Calm → []. Severity volgt de view-state, met een
 * extra escalatie als het Tesla-signaal hoog staat (≥2 = enhanced/high-end).
 */
export function reedHeadsUps(view: ReedView, now: Date): AgentHeadsUp[] {
  if (view.state === "calm" || !view.active) return [];

  const teslaHot = (view.tesla?.tesla_signal ?? 0) >= 2;
  let severity: AgentHeadsUpSeverity = view.state === "warning" ? "urgent" : "important";
  if (view.state === "watch" && teslaHot) severity = "important";

  const vd = view.days.vd;
  const when = vd.windowLabel ? ` ${vd.windowLabel}` : "";
  const action =
    severity === "urgent"
      ? `Stel buitenplannen uit en blijf${when || " tijdens de piek"} zo veel mogelijk binnen.`
      : `Hou${when} rekening met ${vd.badge.toLowerCase()} en kies een rustig moment voor wat buiten moet.`;

  return [
    {
      id: `reed:${categoryFor(view)}:${vd.dateLabel}`,
      agent: "reed",
      category: categoryFor(view),
      severity,
      title: view.active.title,
      message: view.active.summary,
      action,
      confidence: view.tesla?.confidence?.severe,
      validFrom: now.toISOString(),
      locationId: view.locationName,
      createdAt: now.toISOString(),
    },
  ];
}

/** Reed-agent over de context: bouwt view (met echte KNMI/ESTOFEX/Tesla) + stem. */
export async function reedAgent(ctx: AgentContext): Promise<AgentReport> {
  const view = buildReedView({
    weather: ctx.weather,
    locationName: ctx.location.name,
    provinceLabel: ctx.location.provinceLabel,
    estofex: estofexToReed(ctx.estofex),
    knmi: ctx.knmi,
    tesla: ctx.tesla,
    now: ctx.now,
  });
  const headsUps = reedHeadsUps(view, ctx.now);
  const voice = headsUps.length > 0 ? await reedVoice(view).catch(() => null) : null;
  return { agent: "reed", headsUps, voice };
}
