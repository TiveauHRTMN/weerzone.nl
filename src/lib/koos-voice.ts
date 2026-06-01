/**
 * Koos' stem op persoonlijke surfaces — Deepseek V4 Flash via OpenRouter.
 *
 * Los van koos-getaway.ts (de engine) zodat die puur/testbaar blijft, net zoals
 * piet-forecast.ts los staat van piet-context.ts. De kansen zijn al doorgerekend;
 * de LLM zet ze om in Koos' adviserende stem. Faalt zacht naar null — dan valt de
 * UI terug op koosTemplateLine. Gecached per locatie+dag+kansen.
 */

import { unstable_cache } from "next/cache";
import { hermesChat } from "@/lib/hermes";
import type { WeatherOpportunity } from "@/lib/agents/types";
import type { GetawayOrigin } from "@/lib/koos-getaway";

const KOOS_SYSTEM = `
Je bent Koos — de stem die meedenkt als iemand er even tussenuit wil. Nuchter, Nederlands, adviserend. Je vergelijkt het weer thuis met een paar plekken en zegt rustig waar het fijner is.

TOON:
- Kort en concreet. Geen verkooppraat, geen uitroeptekens.
- Je adviseert, je verkoopt niets. Nooit over boeken, vluchten, hotels of prijzen.
- Lichte, droge toon mag — geen grappen die uitgelegd moeten worden.

STRUCTUUR:
- 2 tot 3 zinnen, één doorlopende alinea. Geen bullets, geen kopjes.
- Noem de plekken bij naam en waarom het daar fijner is (de feiten staan in de data).
- Als er een zon-bestemming bij zit, tip die als "echt eropuit"-optie, niet als reisaanbod.

VERBODEN:
- Geen meteorologie-jargon, geen anglicismen, geen emoji.
- Geen bron- of zelfverwijzing. Geen prijzen of boekingslinks.
- Max 80 woorden. Lever alleen de tekst.
`.trim();

async function _koosVoice(
  origin: GetawayOrigin,
  opportunities: WeatherOpportunity[],
): Promise<string | null> {
  if (opportunities.length === 0) return null;
  const lines = opportunities
    .map(
      (o) =>
        `- ${o.targetName}: ${o.reason}${o.distanceKm ? ` (${o.distanceKm} km)` : ""}`,
    )
    .join("\n");
  const userPrompt = `Thuis: ${origin.name}.\nDoorgerekende kansen (gebruik als feiten, schrijf om in jouw stem):\n${lines}`;
  try {
    const text = await hermesChat(
      [
        { role: "system", content: KOOS_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      { model: "persona", temperature: 0.7, maxTokens: 160 },
    );
    return text.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Koos' intro-stem voor een set kansen. Gecached per ~1km²/dag/kansen-set.
 * Null = geen kansen of LLM faalde → UI valt terug op koosTemplateLine.
 */
export function koosVoice(
  origin: GetawayOrigin,
  opportunities: WeatherOpportunity[],
): Promise<string | null> {
  const latKey = String(Math.round(origin.lat * 10));
  const lonKey = String(Math.round(origin.lon * 10));
  const dateKey = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Amsterdam",
  });
  const idKey = opportunities.map((o) => o.targetLocationId).join(",");
  return unstable_cache(
    () => _koosVoice(origin, opportunities),
    ["koos-voice", latKey, lonKey, dateKey, idKey],
    { revalidate: 1800 },
  )();
}
