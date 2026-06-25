/**
 * Mariana Studio — beslist of slide 4 (heads-up) vandaag gepost wordt.
 * Prioriteit bij meerdere triggers: onweer > KNMI-code > hitte > kou (één slide/dag).
 * Geen bron- of modelnamen in de output (Global Constraints).
 */

import { fetchKNMIWarnings, highestSeverity, type KNMIWarning } from "@/lib/knmi-warnings";
import { hermesChat } from "@/lib/hermes";
import type { HeadsUp, HeadsUpType, Ranked } from "./types";

export interface HeadsUpInput {
  morgenRanked: Ranked[];     // forecastRanking(1)
  oracleGateActive: boolean;  // oracle.convective_gate === "ACTIVATE" || run_tesla
  regionThunder: boolean;     // een regio meldt thunder/storm
}

/** True als het waarschuwingsvenster (deels) op de dag van morgen valt. Null-data = meenemen. */
function overlapsTomorrow(w: KNMIWarning): boolean {
  const start = new Date(Date.now() + 86400000); start.setHours(0, 0, 0, 0);
  const end = new Date(Date.now() + 86400000); end.setHours(23, 59, 59, 999);
  const from = w.validFrom ? new Date(w.validFrom).getTime() : -Infinity;
  const until = w.validUntil ? new Date(w.validUntil).getTime() : Infinity;
  return from <= end.getTime() && until >= start.getTime();
}

function morgenLabel(): string {
  return new Date(Date.now() + 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

/** Korte, menselijke heads-up-intro. Geen vakjargon; faalt → deterministische copy. */
async function headsUpCopy(type: HeadsUpType, max: number): Promise<{ titel: string; intro: string; advies: string }> {
  const presets: Record<HeadsUpType, { titel: string; intro: string; advies: string }> = {
    onweer: {
      titel: "Onweer trekt binnen",
      intro: `Na een warme dag wordt de lucht onstabiel. Vanuit het zuidwesten trekken stevige buien het land binnen, met kans op onweer en korte felle regen.`,
      advies: "Zet tuinmeubels vast en plan je rit vóór de buien arriveren.",
    },
    knmi: {
      titel: "Let op: waarschuwing morgen",
      intro: `Voor morgen geldt een weerwaarschuwing. Houd rekening met pittige omstandigheden en pas je plannen daarop aan.`,
      advies: "Check vanavond nog even de laatste verwachting voor jouw regio.",
    },
    hitte: {
      titel: "Morgen wordt het bloedheet",
      intro: `Morgen loopt de temperatuur flink op, tot ${Math.round(max)} graden. Een dag om het rustig aan te doen en de hitte voor te zijn.`,
      advies: "Drink genoeg, zoek de schaduw en check op tijd je medicatie.",
    },
    kou: {
      titel: "Winterse toestanden op komst",
      intro: `Morgen wordt het glad en koud. Houd rekening met vorst, gladheid of sneeuw en geef jezelf extra tijd onderweg.`,
      advies: "Krab je ruiten op tijd en pas je snelheid aan de weg aan.",
    },
  };
  const base = presets[type];
  // Optioneel verfijnen via LLM, maar de preset is altijd correct en cijfervrij (behalve hitte, met exacte max).
  try {
    const gen = (await hermesChat(
      [
        { role: "system", content: `Je bent Mariana van Weerzone. Herschrijf deze heads-up-intro in 2 korte, menselijke zinnen. 100% correct Nederlands, geen vakjargon, geen modelnamen, geen Engels, geen emoji.${type === "hitte" ? ` Noem ${Math.round(max)} graden exact.` : ""}` },
        { role: "user", content: base.intro },
      ],
      { model: "persona", temperature: 0.7, maxTokens: 150, nlGuard: true },
    )).trim();
    const ok = gen.length > 20 && !/subsidentie|convect|hpa|850|model|regime/i.test(gen) && (type !== "hitte" || gen.includes(String(Math.round(max))));
    if (ok) return { ...base, intro: gen };
  } catch { /* preset blijft */ }
  return base;
}

export async function decideHeadsUp(input: HeadsUpInput): Promise<HeadsUp | null> {
  if (!input.morgenRanked.length) return null;

  const morgenMax = input.morgenRanked[0]?.value ?? 0;
  const morgenMin = input.morgenRanked[input.morgenRanked.length - 1]?.value ?? 0;

  // KNMI-severity voor morgen (landelijk hoogste, alleen waarschuwingen die morgen raken).
  let knmiYellowPlus = false;
  try {
    const warnings = await fetchKNMIWarnings();
    const relevant = warnings.filter(overlapsTomorrow);
    const sev = highestSeverity(relevant);
    knmiYellowPlus = sev === "YELLOW" || sev === "ORANGE" || sev === "RED";
  } catch { /* geen warnings → false */ }

  const onweer = input.oracleGateActive || input.regionThunder;
  const hitte = morgenMax >= 30;
  const kou = morgenMin <= 0;

  let type: HeadsUpType | null = null;
  if (onweer) type = "onweer";
  else if (knmiYellowPlus) type = "knmi";
  else if (hitte) type = "hitte";
  else if (kou) type = "kou";
  if (!type) return null;

  const copy = await headsUpCopy(type, morgenMax);
  const verwacht: Record<HeadsUpType, string> = {
    onweer: "Onweer, windstoten, felle regen",
    knmi: "Pittige omstandigheden — code geel of hoger",
    hitte: `Tot ${Math.round(morgenMax)} graden, veel zon`,
    kou: "Vorst, gladheid of sneeuw",
  };
  return {
    type,
    badge: "Heads-up · morgen",
    titel: copy.titel,
    intro: copy.intro,
    rijen: {
      wanneer: `Morgen, ${morgenLabel().split(" ").slice(0, 2).join(" ")}`,
      waar: type === "onweer" ? "Zuiden & midden van het land" : "Vrijwel het hele land",
      verwacht: verwacht[type],
    },
    advies: copy.advies,
  };
}
