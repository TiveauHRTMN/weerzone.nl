/**
 * Mariana Studio — narratieve copy via Hermes.
 * Dezelfde discipline als de oude TikTok-brief: NL-guard, exacte-cijfer-validatie,
 * deterministische terugval. Cijfers komen uit de pipeline, nooit uit de LLM.
 */

import { hermesChat } from "@/lib/hermes";
import type { Ranked } from "./types";

/** Regimecode → gewone mensentaal (geen vakjargon, geen modelnamen). */
export function humanRegime(regime: string): string {
  const r = (regime || "").toLowerCase();
  if (/hitte|hittekoepel/.test(r)) return "een hittekoepel boven Nederland";
  if (/azoren|hogedruk|subsident/.test(r)) return "een stabiel hogedrukgebied";
  if (/storm|zwaar.?weer/.test(r)) return "een stormachtig weertype";
  if (/onweer|convect/.test(r)) return "een onweersgevoelige dag";
  if (/regen|nat|front|laag/.test(r)) return "wisselvallig, nat weer";
  return "wisselvallig weer";
}

const BAD_LANG = /subsidentie|convect|hpa|850|model|gateway|regime/i;
const BAD_WAAIT = /waait[^.!?]*graden/i;

/** True als de LLM-tekst bruikbaar is: lang genoeg, geen jargon, geen fout taalgebruik. */
function cleanLang(text: string): boolean {
  return text.length > 20 && !BAD_LANG.test(text) && !BAD_WAAIT.test(text) && !/het graspollen/i.test(text);
}

/** Pakkende, gegarandeerd-correcte terugval (plaatsnamen als onderwerp → altijd correct). */
export function catchyFallback(w: Ranked, k: Ranked, spread: number, pollen: string): string {
  const tw = Math.round(w.value), tk = Math.round(k.value);
  const pollenLine = /hoog/i.test(pollen) ? " Ga je naar buiten? De graspollen vliegen je om de oren." : "";
  const hook = spread >= 10
    ? `${spread} graden verschil — in hetzelfde land, op dezelfde dag.`
    : tw >= 25 ? `Nederland zit in de zon, maar niet overal even fel.`
      : `Nederland laat zich vandaag van twee kanten zien.`;
  const warmVerb = tw >= 28 ? "kookt op" : tw >= 20 ? "warmt op tot" : "komt tot";
  return `${hook} Terwijl ${w.name} ${warmVerb} ${tw} graden, blijft ${k.name} steken op ${tk}°.${pollenLine}`;
}

/** Intro voor slide 1 (Dagverwachting). Validatie tegen exacte cijfers, anders terugval. */
export async function dagIntro(input: {
  warmst: Ranked; koelst: Ranked; spread: number; pollen: string; regime: string;
}): Promise<string> {
  const tw = Math.round(input.warmst.value), tk = Math.round(input.koelst.value);
  const system = `Je bent Mariana, het weergezicht van Weerzone. Schrijf een KORTE, pakkende landelijke dagverwachting voor vandaag, voor een TikTok-slide.
STIJL: menselijk, energiek, spreektaal. 100% correct Nederlands — geen Engelse woorden, geen vaktermen (zoals 'subsidentie'), geen modelnamen.
LENGTE: 2 tot 3 korte zinnen.
TEMPERATUUR schrijf je als "het wordt X graden" of "X graden" — nooit "het waait X graden".
HARDE REGELS: gebruik de gegeven getallen en plaatsnamen EXACT. Verzin geen extra plaatsen, dagen of weersclaims. Geen emoji, geen aanhef, geen ondertekening.`;
  const user = `Cijfers van vandaag (exact overnemen):
• Warmste plek: ${input.warmst.name} ${tw} graden
• Koelste plek: ${input.koelst.name} ${tk} graden
• Verschil: ${input.spread} graden
• Graspollen: ${input.pollen}
• Weertype: ${humanRegime(input.regime)}`;
  try {
    const gen = (await hermesChat(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { model: "persona", temperature: 0.7, maxTokens: 220, nlGuard: true },
    )).trim();
    if (gen.includes(String(tw)) && gen.includes(String(tk)) && cleanLang(gen)) return gen;
  } catch { /* terugval */ }
  return catchyFallback(input.warmst, input.koelst, input.spread, input.pollen);
}

/** Alinea voor slide 3 (Morgen). Validatie tegen de morgen-max, anders terugval. */
export async function morgenAlinea(input: {
  morgenMax: number; tendens: string; regime: string;
}): Promise<string> {
  const t = Math.round(input.morgenMax);
  const system = `Je bent Mariana van Weerzone. Schrijf in 2 korte zinnen wat morgen het weer doet, voor een TikTok-slide.
STIJL: menselijk, spreektaal, 100% correct Nederlands, geen vakjargon, geen modelnamen, geen Engels.
HARDE REGELS: noem de temperatuur ${t} graden exact. Verzin geen plaatsen of harde claims. Geen emoji, geen aanhef.`;
  const user = `Morgen: maximaal ${t} graden. Tendens t.o.v. vandaag: ${input.tendens}. Weertype: ${humanRegime(input.regime)}.`;
  try {
    const gen = (await hermesChat(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { model: "persona", temperature: 0.7, maxTokens: 180, nlGuard: true },
    )).trim();
    if (gen.includes(String(t)) && cleanLang(gen)) return gen;
  } catch { /* terugval */ }
  const richting = input.tendens.includes("koeler") ? "Het koelt iets af" : input.tendens.includes("warmer") ? "Het wordt nog warmer" : "Het weer verandert weinig";
  return `${richting}: morgen ${t} graden. Verder een rustig weerbeeld zonder grote uitschieters.`;
}
