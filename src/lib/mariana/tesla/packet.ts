/**
 * Mariana Tesla — situatie-packet.
 *
 * Stelt per regio een compacte, feitelijke "convective situation packet" samen
 * die ná het cache-breakpoint in de user-turn gaat. Het bevat de model-digests
 * (convective-data), officiële forecasts/waarschuwingen (ESTOFEX/KNMI), en
 * optionele founder-input. De LLM doet de echte redenering; dit packet levert
 * alleen de feiten — geen interpretatie.
 */

import { fetchEstofexBeneluxSummary, summarizeEstofexNL } from "@/lib/estofex";
import { fetchKNMIWarnings, nearestProvinceSlug, warningsForProvince } from "@/lib/knmi-warnings";
import type { AnalysisWindow, ConvectiveModelDigest } from "./convective-data";
import { collectConvectiveDigests } from "./convective-data";
import type { TeslaRegion } from "./regions";
import type { TeslaTrigger } from "./types";

function fmtExtremum(
  e: { value: number; atIso: string } | null,
  unit: string,
  round = 0
): string {
  if (!e) return "n/b";
  const v = round > 0 ? e.value.toFixed(round) : Math.round(e.value).toString();
  const hh = e.atIso.slice(11, 16);
  return `${v}${unit} @ ${hh}`;
}

function digestLine(d: ConvectiveModelDigest): string {
  if (!d.available) return `[${d.modelKey}] geen bruikbare data`;
  const parts = [
    `CAPE-piek ${fmtExtremum(d.peakCape, " J/kg")}`,
    `CIN sterkst ${fmtExtremum(d.strongestCin, " J/kg")}`,
    `LI min ${fmtExtremum(d.minLiftedIndex, "")}`,
    d.bulkShearProxyAtPeak != null ? `shear~ ${d.bulkShearProxyAtPeak} km/h` : "shear n/b",
    d.t500AtPeak != null ? `T500 ${d.t500AtPeak}C` : "T500 n/b",
    `gust ${fmtExtremum(d.maxGust, " km/h")}`,
    `dauwpunt ${fmtExtremum(d.maxDewPoint, "C")}`,
    d.precipTotal != null ? `neerslag ${d.precipTotal}mm` : "neerslag n/b",
    d.meanCloudCoverLow != null ? `lage bew. ${d.meanCloudCoverLow}%` : "lage bew. n/b",
  ];
  return `[${d.modelKey}] ${parts.join(" | ")}`;
}

/** Ruwe CAPE-spreiding over modellen — feitelijke disagreement-hint, geen oordeel. */
function capeSpreadLine(digests: ConvectiveModelDigest[]): string {
  const peaks = digests
    .filter((d) => d.available && d.peakCape)
    .map((d) => ({ key: d.modelKey, v: d.peakCape!.value }));
  if (peaks.length < 2) return "CAPE-piek: onvoldoende modellen voor spreiding.";
  const values = peaks.map((p) => p.v);
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const lo = peaks.find((p) => Math.round(p.v) === min)?.key ?? "?";
  const hi = peaks.find((p) => Math.round(p.v) === max)?.key ?? "?";
  return `CAPE-piek spreidt ${min}-${max} J/kg (laagst ${lo}, hoogst ${hi}).`;
}

async function estofexBlock(): Promise<string> {
  try {
    const est = await fetchEstofexBeneluxSummary(1);
    if (!est) return "ESTOFEX: geen actieve forecast.";
    const summary = summarizeEstofexNL(est);
    if (summary) return `ESTOFEX: ${summary}`;
    const window =
      est.validFrom && est.validUntil ? ` (geldig ${est.validFrom} - ${est.validUntil})` : "";
    return `ESTOFEX: level ${est.maxLevel} actief${window}; geen expliciete Benelux-tekst.`;
  } catch {
    return "ESTOFEX: niet beschikbaar.";
  }
}

async function knmiBlock(lat: number, lon: number): Promise<string> {
  try {
    const slug = await nearestProvinceSlug(lat, lon);
    if (!slug) return "KNMI: geen provincie-match.";
    const all = await fetchKNMIWarnings();
    const here = warningsForProvince(all, slug);
    if (here.length === 0) return `KNMI (${slug}): geen actieve waarschuwingen.`;
    const lines = here.map((w) => {
      const win =
        w.validFrom && w.validUntil
          ? ` ${w.validFrom.slice(11, 16)}-${w.validUntil.slice(11, 16)}`
          : "";
      return `${w.severity} ${w.type}${win}`;
    });
    return `KNMI (${slug}): ${lines.join("; ")}`;
  } catch {
    return "KNMI: niet beschikbaar.";
  }
}

export interface BuildPacketArgs {
  region: TeslaRegion;
  trigger: TeslaTrigger;
  /** Optioneel expliciet venster; anders het default dagvenster van de collector. */
  window?: AnalysisWindow;
  /** Founder-observaties (mesoscale modifier, geen absolute waarheid). */
  founderNotes?: string[];
  /**
   * Oracle's 48-96u regimecontext als platte tekst (regime, gate-reden,
   * scenario's). Tesla gebruikt dit als context, niet als waarheid. Optioneel:
   * Tesla kan ook draaien op directe founder-observatie zonder Oracle.
   */
  oracleContext?: string;
}

export interface BuiltPacket {
  text: string;
  window: AnalysisWindow;
  digests: ConvectiveModelDigest[];
}

/** Bouwt het volledige situatie-packet voor één regio. */
export async function buildSituationPacket(args: BuildPacketArgs): Promise<BuiltPacket> {
  const { region, trigger } = args;
  const { window, digests } = await collectConvectiveDigests(region.lat, region.lon, args.window);

  const [estofex, knmi] = await Promise.all([estofexBlock(), knmiBlock(region.lat, region.lon)]);

  const founder =
    args.founderNotes && args.founderNotes.length > 0
      ? args.founderNotes.map((n) => `- ${n}`).join("\n")
      : "- geen";

  const oracleBlock =
    args.oracleContext && args.oracleContext.trim()
      ? args.oracleContext.trim()
      : "Geen Oracle-context aangeleverd (Tesla draait op directe gate/observatie).";

  const text = `=== MARIANA TESLA - SITUATIE-PACKET ===
Regio: ${region.name} (${region.lat}, ${region.lon})
Mesoscale rol: ${region.role}
Analysevenster (lokaal): ${window.fromIso} t/m ${window.untilIso}
Trigger: ${trigger}

--- ORACLE-CONTEXT (48-96u regime; context, geen waarheid) ---
${oracleBlock}

--- MODELVELDEN (per model, extrema binnen venster) ---
${digests.map(digestLine).join("\n")}

--- MODEL-DISAGREEMENT (ruwe feiten) ---
${capeSpreadLine(digests)}

--- OFFICIELE FORECASTS / WAARSCHUWINGEN ---
${estofex}
${knmi}

--- FOUNDER-INPUT (mesoscale modifier, geen absolute waarheid) ---
${founder}

=== EINDE PACKET ===
Analyseer strikt volgens je vaste analysevolgorde (regime -> synoptiek -> thermodynamica -> CIN-fracture -> trigger/timing -> upstream-hijack -> seed-cell -> inflow/outflow -> modus -> mesoschaal -> modelconflict -> founder -> Reed-actie). Geef UITSLUITEND het gestructureerde Tesla-signaal terug.`;

  return { text, window, digests };
}
