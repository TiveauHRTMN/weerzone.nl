/**
 * Mariana Local — voeding vanuit Mariana Regions.
 *
 * Mariana Local = de bestaande wiskunde-laag (arbitration.ts: model-blend, bias,
 * confidence, regime, risks). Tot nu toe draaide die op STATISCHE defaults
 * (DEFAULT_WEIGHTS, vaste confidence). Dit bestand levert de adapter die de
 * dagelijkse Regions-duiding (MarianaLocalFeed) vertaalt naar de knoppen die de
 * wiskunde gebruikt — zodat Local "slim gevoed" rekent i.p.v. op aannames.
 *
 * Local blijft GRATIS en per-request: deze feed wordt 1x/dag door Regions
 * geschreven en door de leeslaag (regions/storage.nearestRegionFeed) opgehaald;
 * Local past 'm alleen toe. Geen LLM in het request-pad.
 *
 * Zonder feed valt Local terug op z'n eigen defaults (identiek aan vroeger) —
 * cruciaal voor niet-NL locales die geen Regions-laag hebben.
 */

import type { MarianaLocalFeed } from "@/lib/mariana/regions/types";

/** De afgeleide knoppen die de wiskunde-laag van Regions overneemt. */
export interface LocalTuning {
  /** Per-model basisgewichten (vervangt DEFAULT_WEIGHTS waar aanwezig). */
  weights: Record<string, number>;
  /** Prior op de confidence-score (0..1), gemengd met de meetkundige score. */
  confidencePrior: number | null;
  /** Regime-label voor de interpretatietekst. */
  regimeLabel: string | null;
  /** Actieve gevaren die Local's risks-laag forceert. */
  hazardFlags: string[];
  /** Of de convectieve baan actief is (Reed-doorverwijzing relevant). */
  convectiveActive: boolean;
  /** Reden voor doorverwijzing naar /reed (leeg als niet actief). */
  referralReason: string;
}

/** Lege/neutrale tuning: Local draait dan op z'n eigen statische defaults. */
export const NEUTRAL_TUNING: LocalTuning = {
  weights: {},
  confidencePrior: null,
  regimeLabel: null,
  hazardFlags: [],
  convectiveActive: false,
  referralReason: "",
};

/** Vertaalt een Regions-feed naar Local-tuning. */
export function tuningFromFeed(feed: MarianaLocalFeed | null | undefined): LocalTuning {
  if (!feed) return NEUTRAL_TUNING;
  return {
    weights: feed.modelWeights ?? {},
    confidencePrior:
      typeof feed.confidencePrior === "number" && Number.isFinite(feed.confidencePrior)
        ? Math.min(1, Math.max(0, feed.confidencePrior))
        : null,
    regimeLabel: feed.regimeLabel || feed.regimeCode || null,
    hazardFlags: Array.isArray(feed.hazardFlags) ? feed.hazardFlags : [],
    convectiveActive: feed.convectiveActive === true,
    referralReason: feed.referralReason || "",
  };
}
