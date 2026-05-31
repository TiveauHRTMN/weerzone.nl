/**
 * Pure context-builder voor Piets weerbericht.
 *
 * Zet de rijke nieuwe-Mariana duiding (uit het opgeslagen MarianaSignal) +
 * de compacte local_feed om in één contextblok dat als feitelijke basis aan
 * Deepseek V4 wordt meegegeven (zie piet-forecast.ts). Geen Next-/Supabase-
 * afhankelijkheden, zodat dit los te testen is.
 *
 * Voorkeur: signaal (rijk) boven feed (compact). Feed dient als terugval als de
 * signaal-kolom (nog) niet beschikbaar is.
 */
import type { MarianaSignal, MarianaLocalFeed } from "@/lib/mariana/regions/types";

/** Alleen de verhaal-delen die Piet nodig heeft. */
type SignalNarrative = Pick<
  MarianaSignal,
  "dominant_short_term_regime" | "risk_summary" | "mariana_summary" | "agent_outputs"
>;

export function buildMarianaContext(
  signal: SignalNarrative | null,
  feed: MarianaLocalFeed | null,
): string | null {
  const lines: string[] = [];

  const regime =
    signal?.dominant_short_term_regime || feed?.regimeLabel || feed?.regimeCode || "";
  if (regime) lines.push(`Regime vandaag: ${regime}.`);

  const pietText = signal?.agent_outputs?.piet?.text;
  if (pietText) lines.push(`Mariana's dagbeeld: ${pietText}`);

  const rs = signal?.risk_summary;
  if (rs) {
    const risks = [
      rs.rain && `regen: ${rs.rain}`,
      rs.wind && `wind: ${rs.wind}`,
      rs.thunder && `onweer: ${rs.thunder}`,
      rs.temperature && `temperatuur: ${rs.temperature}`,
      rs.comfort && `comfort: ${rs.comfort}`,
      rs.pollen && `pollen: ${rs.pollen}`,
    ].filter(Boolean);
    if (risks.length) lines.push(`Aandachtspunten — ${risks.join("; ")}.`);
  } else if (feed?.hazardFlags?.length) {
    lines.push(`Aandachtspunten: ${feed.hazardFlags.join(", ")}.`);
  }

  if (signal?.mariana_summary) lines.push(`Samenvatting: ${signal.mariana_summary}`);

  const reedReason =
    (signal?.agent_outputs?.piet?.refer_to_reed &&
      signal.agent_outputs.piet.referral_reason) ||
    (feed?.convectiveActive && feed.referralReason) ||
    "";
  if (reedReason) {
    lines.push(
      `Onweer/convectie speelt — verwijs voor de waarschuwingen kort naar Reed: "${reedReason}"`,
    );
  }

  if (!lines.length) return null;
  return lines.join(" ");
}

const DEFAULT_MAX_AGE_HOURS = 36;

/**
 * Is de cascade-run te oud om Piet nog te voeden? De cascade draait 1×/dag; een
 * run ouder dan ~36u betekent dat de cron minstens één keer is overgeslagen — dan
 * tonen we liever niets dan de duiding van eergisteren. Ontbrekende/ongeldige
 * timestamp -> behandelen als NIET stale (we kunnen niets beoordelen, en de data
 * bestaat wel).
 */
export function isMarianaRunStale(
  runAt: string | null | undefined,
  now: Date = new Date(),
  maxAgeHours: number = DEFAULT_MAX_AGE_HOURS,
): boolean {
  if (!runAt) return false;
  const ts = new Date(runAt).getTime();
  if (!Number.isFinite(ts)) return false;
  return now.getTime() - ts > maxAgeHours * 3_600_000;
}
