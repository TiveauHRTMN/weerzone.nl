/**
 * Mariana Tesla — engine/orkestratie.
 *
 * Verbindt de losse delen: bouw situatie-packet -> laat het reasoning-model
 * (claude-opus-4-8) redeneren -> normaliseer naar een gevalideerd TeslaSignal ->
 * verpak met uitvoeringscontext tot een TeslaRun. Dit is wat Mariana/Reed straks
 * consumeert. Storage/cron komen in een aparte laag erbovenop.
 */

import { runTeslaReasoning } from "./client";
import { buildSituationPacket } from "./packet";
import type { AnalysisWindow } from "./convective-data";
import { TESLA_REGIONS, getTeslaRegion, type TeslaRegion } from "./regions";
import { normalizeTeslaSignal, type TeslaRun, type TeslaTrigger } from "./types";

export interface RunTeslaOptions {
  trigger?: TeslaTrigger;
  window?: AnalysisWindow;
  founderNotes?: string[];
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

/** Draait Tesla voor één regio en geeft een volledige TeslaRun terug. */
export async function runTeslaForRegion(
  region: TeslaRegion,
  opts: RunTeslaOptions = {}
): Promise<TeslaRun> {
  const trigger: TeslaTrigger = opts.trigger ?? "manual";

  const packet = await buildSituationPacket({
    region,
    trigger,
    window: opts.window,
    founderNotes: opts.founderNotes,
  });

  const result = await runTeslaReasoning(packet.text, {
    model: opts.model,
    effort: opts.effort,
  });

  const signal = normalizeTeslaSignal(result.raw);

  return {
    regionSlug: region.slug,
    regionName: region.name,
    lat: region.lat,
    lon: region.lon,
    runAt: new Date().toISOString(),
    validFrom: packet.window.fromIso,
    validUntil: packet.window.untilIso,
    trigger,
    model: result.model,
    signal,
  };
}

/** Draait Tesla voor een regio op slug. Gooit als de slug onbekend is. */
export async function runTeslaForRegionSlug(
  slug: string,
  opts: RunTeslaOptions = {}
): Promise<TeslaRun> {
  const region = getTeslaRegion(slug);
  if (!region) throw new Error(`Onbekende Tesla-regio: ${slug}`);
  return runTeslaForRegion(region, opts);
}

/**
 * Draait Tesla voor alle (of een subset) mesoschaal-regio's, sequentieel om
 * rate-limits en kosten te beheersen. Per-regio falen breekt de batch niet.
 */
export async function runTeslaForAllRegions(
  opts: RunTeslaOptions & { regionSlugs?: string[] } = {}
): Promise<{ runs: TeslaRun[]; errors: { regionSlug: string; error: string }[] }> {
  const regions = opts.regionSlugs
    ? (opts.regionSlugs.map(getTeslaRegion).filter(Boolean) as TeslaRegion[])
    : [...TESLA_REGIONS];

  const runs: TeslaRun[] = [];
  const errors: { regionSlug: string; error: string }[] = [];

  for (const region of regions) {
    try {
      runs.push(await runTeslaForRegion(region, opts));
    } catch (err) {
      errors.push({
        regionSlug: region.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { runs, errors };
}
