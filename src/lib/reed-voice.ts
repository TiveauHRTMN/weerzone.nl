/**
 * Reed's stem — kalm-maar-scherp. Zet de doorgerekende ReedView om in één korte
 * gesproken duiding. Faalt zacht naar null (UI valt terug op de sjabloon-summary).
 * Zelfde patroon als koos-voice.ts.
 */

import { unstable_cache } from "next/cache";
import { hermesChat } from "@/lib/hermes";
import type { ReedView } from "@/lib/reed-view";

const REED_SYSTEM = `
Je bent Reed — de nuchtere buurman die scherp op gevaarlijk weer let. Kalm, nooit paniek, urgent als het moet. Altijd feitelijk correct en grammaticaal foutloos.

TOON:
- Rustig en direct. Je overdrijft nooit, maar je verzwijgt ook niks.
- Bij code rood/oranje: serieus, met een concreet handelingsadvies.
- Bij lichte dreiging: laat merken dat je het in de gaten houdt, zonder bangmakerij.

STRUCTUUR:
- 2 tot 3 zinnen, één doorlopende alinea. Geen bullets, geen kopjes.
- Noem wat er speelt, wanneer (concreet dagdeel/uur), en wat de lezer eraan heeft.

VERBODEN:
- Geen meteorologie-jargon (geen "CAPE", "trog", "front"), geen anglicismen, geen emoji.
- Geen bron- of zelfverwijzing, geen merknamen van engines.
- Max 70 woorden. Lever alleen de tekst.
`.trim();

async function _reedVoice(view: ReedView): Promise<string | null> {
  if (view.state === "calm" || !view.active) return null;
  const facts = [
    `Locatie: ${view.locationName}.`,
    `Status: ${view.active.levelLabel} — ${view.active.title}.`,
    `Samenvatting (feiten, schrijf om in jouw stem): ${view.active.summary}`,
    view.days.vd.windowLabel ? `Risicovenster vandaag: ${view.days.vd.windowLabel}.` : "",
    view.days.vd.peakLabel ? `Grootste kans rond ${view.days.vd.peakLabel}.` : "",
  ].filter(Boolean).join("\n");
  try {
    const text = await hermesChat(
      [
        { role: "system", content: REED_SYSTEM },
        { role: "user", content: facts },
      ],
      { model: "persona", temperature: 0.6, maxTokens: 140, nlGuard: true },
    );
    return text.trim() || null;
  } catch {
    return null;
  }
}

/** Reed's stem voor een actieve dreiging. Gecached per locatie+dag+status. */
export function reedVoice(view: ReedView): Promise<string | null> {
  const locKey = view.locationName.toLowerCase().replace(/\s+/g, "-");
  const dateKey = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const stateKey = `${view.state}:${view.active?.title ?? "none"}`;
  return unstable_cache(
    () => _reedVoice(view),
    ["reed-voice", locKey, dateKey, stateKey],
    { revalidate: 1800 },
  )();
}
