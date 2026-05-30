/**
 * Mariana Oracle — regime-packet.
 *
 * Oracle redeneert op LANDELIJK regime-niveau (48-96u), niet per mesoschaal-
 * regio zoals Tesla. We bemonsteren één NL-centraal analysepunt voor de
 * synoptische velden en stellen een compact, feitelijk packet samen dat ná het
 * cache-breakpoint in de user-turn gaat: per-model digests + ruwe model-
 * disagreement + founder regime-input. De LLM doet de regime-redenering.
 */

import type { RegimeWindow, SynopticModelDigest } from "./regime-data";
import { collectSynopticDigests } from "./regime-data";
import type { OracleTrigger } from "./types";

/** NL-centraal analysepunt (ongeveer midden Nederland, Flevoland/Veluwe-rand). */
export const NL_CENTROID = { lat: 52.2, lon: 5.5 };

function fmt(n: number | null, unit = ""): string {
  return n == null ? "n/b" : `${n}${unit}`;
}

function digestLine(d: SynopticModelDigest): string {
  if (!d.available) return `[${d.modelKey}] geen bruikbare data`;
  const parts = [
    `T2m ${fmt(d.tMin, "C")}..${fmt(d.tMax, "C")}`,
    `T850 ${fmt(d.t850Mean, "C")}`,
    `T500 ${fmt(d.t500Mean, "C")}`,
    `Z500 ${fmt(d.z500Min)}-${fmt(d.z500Max, " gpm")}`,
    `MSLP ${fmt(d.mslpMin)}-${fmt(d.mslpMax, " hPa")}`,
    `neerslag ${fmt(d.precipTotal, "mm")}`,
    `gust ${fmt(d.maxGust, " km/h")}`,
    `850-richting ${fmt(d.meanDir850, "°")}`,
    `CAPE-max ${fmt(d.capeMax, " J/kg")}`,
  ];
  return `[${d.modelKey}] ${parts.join(" | ")}`;
}

/** Ruwe T850-spreiding over modellen — luchtmassa-disagreement-hint. */
function t850SpreadLine(digests: SynopticModelDigest[]): string {
  const vals = digests
    .filter((d) => d.available && d.t850Mean != null)
    .map((d) => ({ key: d.modelKey, v: d.t850Mean as number }));
  if (vals.length < 2) return "T850-spreiding: onvoldoende modellen.";
  const min = Math.min(...vals.map((x) => x.v));
  const max = Math.max(...vals.map((x) => x.v));
  const lo = vals.find((x) => x.v === min)?.key ?? "?";
  const hi = vals.find((x) => x.v === max)?.key ?? "?";
  return `T850 spreidt ${min}..${max}C (koudst ${lo}, warmst ${hi}) — luchtmassa-onzekerheid.`;
}

/** Ruwe CAPE-spreiding — vroege onstabiliteits-/gate-hint. */
function capeSpreadLine(digests: SynopticModelDigest[]): string {
  const vals = digests
    .filter((d) => d.available && d.capeMax != null)
    .map((d) => ({ key: d.modelKey, v: d.capeMax as number }));
  if (vals.length === 0) return "CAPE-max: geen data.";
  const max = Math.max(...vals.map((x) => x.v));
  const hi = vals.find((x) => x.v === max)?.key ?? "?";
  return `CAPE-max tot ${max} J/kg (hoogst ${hi}) — grove onstabiliteits-hint voor de gate.`;
}

export interface BuildOraclePacketArgs {
  trigger: OracleTrigger;
  /** Optioneel expliciet venster; anders het default 48-96u-venster. */
  window?: RegimeWindow;
  /** Founder regime-observaties (Azorenhoog, rugas, jet, blokkade, pomp…). */
  founderNotes?: string[];
  /** Optioneel ander analysepunt; default NL-centraal. */
  point?: { lat: number; lon: number };
}

export interface BuiltOraclePacket {
  text: string;
  window: RegimeWindow;
  digests: SynopticModelDigest[];
}

export async function buildOraclePacket(args: BuildOraclePacketArgs): Promise<BuiltOraclePacket> {
  const point = args.point ?? NL_CENTROID;
  const { window, digests } = await collectSynopticDigests(point.lat, point.lon, args.window);

  const founder =
    args.founderNotes && args.founderNotes.length > 0
      ? args.founderNotes.map((n) => `- ${n}`).join("\n")
      : "- geen";

  const text = `=== MARIANA ORACLE - REGIME-PACKET (48-96u) ===
Analysepunt (NL-centraal): ${point.lat}, ${point.lon}
Analysevenster (lokaal): ${window.fromIso} t/m ${window.untilIso}
Trigger: ${args.trigger}

--- SYNOPTISCHE MODELVELDEN (GFS/ECMWF/AIFS, geaggregeerd over venster) ---
${digests.map(digestLine).join("\n")}

--- MODEL-DISAGREEMENT (ruwe feiten) ---
${t850SpreadLine(digests)}
${capeSpreadLine(digests)}

--- FOUNDER REGIME-INPUT (regime-modifier, geen absolute waarheid) ---
${founder}

=== EINDE PACKET ===
Analyseer strikt volgens je vaste volgorde (regimeclassificatie -> drukverdeling/rugas
-> jetstream -> luchtmassa -> fronten/troggen -> convective gate -> scenario tree).
De gate is BINAIR: OFF of ACTIVATE. Bij een geloofwaardige onstabiliteitskans:
ACTIVATE (Tesla zoekt de ernst zelf uit). Geef UITSLUITEND het JSON-object terug.`;

  return { text, window, digests };
}
