/**
 * Mariana NL — besluit-packet (operationele baan).
 *
 * Condenseert de feiten voor één locatie tot een compact packet dat ná het
 * cache-breakpoint in de user-turn gaat: hi-res 0-48u modeldata (WeatherData) +
 * Oracle-regimecontext + de convectieve gate-status. De LLM doet de lokale
 * besluitvorming; dit packet levert alleen feiten.
 */

import type { WeatherData } from "@/lib/types";
import type { OracleRun } from "@/lib/mariana/oracle/types";

/** Status van de convectieve baan voor deze locatie (door de engine bepaald). */
export interface ConvectiveGateStatus {
  active: boolean;
  regionName: string | null;
  /** Korte duiding (bv. Tesla's mariana_summary), alleen als actief. */
  note: string | null;
}

function fmtHour(iso: string): string {
  return iso.length >= 16 ? iso.slice(11, 16) : iso;
}

/** Compacte 0-48u samenvatting uit WeatherData: piekuren + dagelijkse extrema. */
function hiResBlock(weather: WeatherData): string {
  const hours = weather.hourly.slice(0, 48);
  if (hours.length === 0) return "Hi-res: geen uurdata beschikbaar.";

  let maxTemp = -Infinity;
  let maxTempAt = "";
  let minTemp = Infinity;
  let totalPrecip = 0;
  let maxGust = 0;
  let maxGustAt = "";
  let maxCape = 0;
  let maxCapeAt = "";
  let wettestVal = 0;
  let wettestAt = "";

  for (const h of hours) {
    if (h.temperature > maxTemp) { maxTemp = h.temperature; maxTempAt = h.time; }
    if (h.temperature < minTemp) minTemp = h.temperature;
    totalPrecip += h.precipitation ?? 0;
    if ((h.windSpeed ?? 0) > maxGust) { maxGust = h.windSpeed; maxGustAt = h.time; }
    if ((h.cape ?? 0) > maxCape) { maxCape = h.cape; maxCapeAt = h.time; }
    if ((h.precipitation ?? 0) > wettestVal) { wettestVal = h.precipitation; wettestAt = h.time; }
  }

  const daily = weather.daily.slice(0, 2)
    .map((d) => `${d.date}: ${d.tempMin}-${d.tempMax}C, neerslag ${d.precipitationSum}mm, wind tot ${d.windSpeedMax}km/h`)
    .join("\n");

  return [
    `Nu: ${weather.current.temperature}C (gevoel ${weather.current.feelsLike}C), wind ${weather.current.windSpeed}km/h, ${weather.current.precipitation}mm, bewolking ${weather.current.cloudCover}%.`,
    `0-48u extrema: temp ${Math.round(minTemp)}..${Math.round(maxTemp)}C (piek @ ${fmtHour(maxTempAt)}), neerslag-som ${Math.round(totalPrecip * 10) / 10}mm (natste uur ${wettestVal}mm @ ${fmtHour(wettestAt)}), max wind ${Math.round(maxGust)}km/h @ ${fmtHour(maxGustAt)}.`,
    `Max CAPE 0-48u: ${Math.round(maxCape)} J/kg @ ${fmtHour(maxCapeAt)}.`,
    `Dagvooruitzicht:\n${daily}`,
  ].join("\n");
}

/** Oracle-regimecontext compact (alleen de Mariana-relevante velden). */
function oracleBlock(oracle: OracleRun | null): string {
  if (!oracle) return "Oracle: geen recente regimecontext beschikbaar.";
  const s = oracle.signal;
  return [
    `Dominant regime (48-96u): ${s.dominant_regime || "n/b"}.`,
    s.regime_summary ? `Samenvatting: ${s.regime_summary}` : "",
    `Druk/rugas: ${s.pressure_pattern || "n/b"}`,
    `Jetstream: ${s.jetstream_assessment || "n/b"}`,
    `Luchtmassa: ${s.airmass_assessment || "n/b"}`,
    `Temp-impact: ${s.domain_impacts.temperature || "n/b"} | regen: ${s.domain_impacts.rain || "n/b"} | wind: ${s.domain_impacts.wind || "n/b"} | comfort: ${s.domain_impacts.comfort || "n/b"} | pollen: ${s.domain_impacts.pollen || "n/b"}`,
    `Modelconflict: ${s.model_conflict.level}${s.model_conflict.summary ? ` — ${s.model_conflict.summary}` : ""}`,
  ].filter(Boolean).join("\n");
}

function gateBlock(gate: ConvectiveGateStatus): string {
  if (!gate.active) {
    return "Convectieve gate: OFF — geen actief onweer voor deze locatie. Piet verwijst NIET door naar /reed.";
  }
  return [
    `Convectieve gate: ACTIEF (Tesla draaide voor regio ${gate.regionName ?? "n/b"}).`,
    gate.note ? `Convectieve duiding: ${gate.note}` : "",
    "=> Piet MOET doorverwijzen naar /reed voor de waarschuwingen (refer_to_reed=true).",
  ].filter(Boolean).join("\n");
}

export interface BuildMarianaPacketArgs {
  locationName: string;
  lat: number;
  lon: number;
  weather: WeatherData;
  oracle: OracleRun | null;
  gate: ConvectiveGateStatus;
}

export function buildMarianaPacket(args: BuildMarianaPacketArgs): string {
  return `=== MARIANA - BESLUIT-PACKET (0-48u, NL) ===
Locatie: ${args.locationName} (${args.lat}, ${args.lon})

--- HI-RES MODELDATA (0-48u, HARMONIE/AROME/ICON-D2 + EC/GFS/AIFS blend) ---
${hiResBlock(args.weather)}

--- ORACLE-REGIMECONTEXT (48-96u; richting, geen lokale waarheid) ---
${oracleBlock(args.oracle)}

--- CONVECTIEVE GATE-STATUS ---
${gateBlock(args.gate)}

=== EINDE PACKET ===
Beslis lokaal volgens je analysevolgorde. Geef UITSLUITEND het JSON-object terug
(Piet + Koos + locatie-contract). Schrijf Reed NIET; bepaal alleen of Piet
doorverwijst naar /reed.`;
}
