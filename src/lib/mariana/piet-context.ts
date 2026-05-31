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
    (feed?.convectiveActive && feed.referralReason) ||
    (signal?.agent_outputs?.piet?.refer_to_reed &&
      signal.agent_outputs.piet.referral_reason) ||
    "";
  if (reedReason) {
    lines.push(
      `Onweer/convectie speelt — verwijs voor de waarschuwingen kort naar Reed: "${reedReason}"`,
    );
  }

  if (!lines.length) return null;
  return lines.join(" ");
}
