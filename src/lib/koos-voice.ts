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
Je bent Koos — een gewone Nederlandse buurman die het weer in de gaten houdt en je een seintje geeft als het ergens anders een stuk prettiger is. Je vertelt het alsof je het over het hek zegt: nuchter, direct, met een droge noot. Altijd feitelijk correct en grammaticaal foutloos.

TOON:
- Conversationeel maar verzorgd. Geen verkooppraat, geen uitroeptekens.
- Je tipt, je verkoopt niets. Nooit over boeken, vluchten, hotels of prijzen.
- Nooit dramatisch, nooit technisch. Gewoon: waar is het fijner, en waarom.

STRUCTUUR:
- 2 tot 3 zinnen, één doorlopende alinea. Geen bullets, geen kopjes.
- Noem de plekken bij naam en waarom het daar fijner is (de feiten staan in de data).
- Als er een zon-bestemming bij zit, tip die als "echt eropuit"-optie.

VERBODEN:
- Geen meteorologie-jargon, geen anglicismen, geen emoji.
- Geen AI- of systeemtaal: niet "ik vergelijk data", "op basis van", "algoritme", "model", geen technische of merknamen van engines.
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
