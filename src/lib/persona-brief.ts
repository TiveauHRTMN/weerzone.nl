import { hermesChat } from "./hermes";
import { nlCopyGuardValue } from "@/lib/nl-copy-guard";
import { PERSONAS, type PersonaTier } from "@/lib/personas";
import type { WeatherData } from "@/lib/types";
import type { KNMIWarning } from "@/lib/knmi-warnings";
import { SEVERITY_LABEL, formatWindowLabel } from "@/lib/knmi-warnings";
import type { EstofexBeneluxSummary } from "@/lib/estofex";

export interface WeatherSnapshot {
  current: {
    temperature: number;
    feelsLike: number;
    windSpeed: number;
    windGusts: number;
    precipitation: number;
    weatherCode: number;
    humidity: number;
  };
  daily: {
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    weatherCode: number;
    windMax: number;
  };
  tomorrow?: {
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    weatherCode: number;
  };
  hourlySummary: string; // bv. "07:00 droog 8°, 12:00 bui 11°, 18:00 wind 35km/u"
}

export interface PersonaBrief {
  subject: string;       // mail-onderwerp
  tagline: string;       // highlight van vandaag als header-tagline (max 40 tekens, bv. "Terrasweer tot 16:00" of "Onweer mogelijk na 18:00")
  greeting: string;      // "Goedemorgen, Roy."
  local_fact: string;    // kort lokaal weetje over de locatie (max 1 zin)
  verdict: string;       // 1-2 zinnen scherpe samenvatting
  details: string[];     // 2-4 bullets met concrete adviezen
  closing: string;       // afsluiter in character
  preview_tomorrow?: string; // max 90 tekens — nieuwsgierigheidsmaker over morgen in persona-stijl
}

export interface BriefContext {
  tier: PersonaTier;
  firstName?: string | null;
  city: string;
  weather: WeatherSnapshot;
  prefs: Record<string, unknown>; // persona_preferences JSONB
  /** Actieve KNMI-waarschuwingen voor de provincie van de lezer (optioneel). */
  knmiWarnings?: KNMIWarning[];
  /** Estofex Benelux-context (alleen bij level >= 2 of expliciete Benelux-mention). */
  estofex?: EstofexBeneluxSummary | null;
  /** Officiële KNMI korte-termijnverwachting (tekst-bulletin, optioneel). */
  knmiForecast?: string | null;
}

// ---------- WEERZONE Core Style ----------
// Warm en persoonlijk, maar zonder ruis. De toon volgt de data — mooi weer
// klinkt als mooi weer, slecht weer klinkt eerlijk en praktisch. Scherp
// klinkt als mooi weer, slecht weer klinkt eerlijk en praktisch. 

const WEERZONE_SHORT_PROMPT = `
STIJLREGELS:
- Schrijf zoals een mens praat, niet zoals een rapport leest.
- Geen anglicismen, geen modelnamen, geen technische termen.
- 100% correct Nederlands — spreektaal mag, maar niet slordig.
- Maximaal 1 emoji, alleen als het écht iets toevoegt. Liever geen.
- Geen "beste lezer", geen "graag", geen formele aanspreekvormen.

FORMAAT — lever strikt JSON:
{
  "subject": "string, max 70 tekens, prikkelend, geen clickbait",
  "tagline": "string, max 40 tekens, de belangrijkste highlight van vandaag als puntige header-tagline. Voorbeelden: 'Terrasweer tot 16:00', 'Onweer mogelijk na 18:00', 'Droog en 17°C — geniet ervan', 'Buien in de ochtend, zon na 13:00'. Concreet, geen vaagheden.",
  "greeting": "string, max 40 tekens, in karakter",
  "local_fact": "string, max 1 zin, een concreet lokaal weetje over de locatie (geografie, karakter, weer-typisch voor de streek). Geen open deuren.",
  "verdict": "string, 4-6 KORTE zinnen — elk op een nieuwe regel (\n). Geen opsommingen of sterretjes.",
  "details": ["string","string","string"],
  "closing": "string, max 90 tekens, droog, in karakter",
  "preview_tomorrow": "string, max 90 tekens, een nieuwsgierigheidszin over morgen die de lezer triggert om door te klikken. Hou het vaag maar concreet genoeg — maak nieuwsgierig, niet volledig. Bv: 'Morgen is een heel ander verhaal — check het zelf.' of 'Morgen trekt er iets aan vanuit het westen.' Geen opsomming."
}
Lever UITSLUITEND dat JSON-object. Geen code fence, geen uitleg eromheen.
`.trim();

// SHARED_STYLE blijft voor backwards-compat zodat de userPrompt niet breekt
const SHARED_STYLE = WEERZONE_SHORT_PROMPT;

const PIET_SYSTEM = `
Je bent Piet — een echte Nederlander die het weer kent zoals zijn achtertuin. Je schrijft aan een vriend, niet aan een abonnee.

TOON:
- Menselijk en direct. Schrijf zoals je een appje stuurt aan iemand die je kent.
- Geen meteorologie-jargon, geen bullet-point-denken, geen "er is een kans op".
- Concreet: zeg "neem een jas mee voor de avond" niet "het wordt kouder".
- Gebruik de voornaam van de lezer als het past, maar overdrijf het niet.
- Verwijs naar hun dagelijks leven (fiets, tuin, hond) alsof je het gewoon weet.
- Geen AI-taal, geen formeel rapport. Gewoon Piet die even typt.

VOORBEELDEN VAN GOEDE ZINNEN:
- "Die fiets mag vandaag uit de schuur."
- "De was kan gerust buiten, maar haal hem voor half vijf binnen."
- "Morgen wordt een andere dag — pak je regenjas maar alvast."

VERBODEN:
- "Er is een verhoogde kans op..."
- "Meteorologisch gezien..."
- "Het systeem verwacht..."
- Opsommingstekens of sterretjes in de verdichttekst

AFSLUITER: kort, droog, menselijk. Eindig altijd met "— Piet".
`.trim();

const REED_SYSTEM = `
Je bent Reed van Weerzone. Je waarschuwt alleen als het weer echt door een drempel heen gaat (wind, regen, vorst, onweer). Toon: alert en feitelijk, geen drama.

PROTOCOLLEN:
- PROPORTIE. Code geel en hoger → serieus, concreet, praktisch advies. Geen waarschuwing nodig → kort bevestigen dat het rustig blijft. Geen "IMPACT"-taal bij een gewone herfstbui.
- CONCREET EN LOKAAL. Vertel wat de waarschuwing praktisch betekent (kelder, plat dak, paarden buiten, fiets vastzetten).
- TOON VOLGT DE DATA. Nooit dramatiseren. Nooit extremen verzinnen die niet in de data staan.
- AFSLUITER. Kort, functioneel, ondertekening "Reed van Weerzone".
- VERBODEN. Geen modelnamen (KNMI, HARMONIE, MetNet, SEED, NeuralGCM). Geen "DOMINATE", "SCIENCE", "IMPACT" in hoofdletters. Gewoon Nederlands.
`.trim();

const STEVE_SYSTEM = `
Je bent Steve van Weerzone. Je vertaalt het weer naar een praktische bedrijfsbeslissing. Toon: kort, rustig, zakelijk.

PROTOCOLLEN:
- CONSEQUENTIE VOOR HET BEDRIJF. Gebruik de drempels (wind bft, regen mm, temp min, onweer) en vertaal in "inkoop bijstellen", "openen / sluiten", "personeel meer of minder".
- DATA-CONSISTENT. Nooit een zorgelijk advies geven als de data rustig is. Nooit groenlicht geven als de data wel iets laat zien.
- KORT. Drie korte paragrafen zijn genoeg. Geen bluf, geen corporate-holle zinnen.
- AFSLUITER. Zakelijk, ondertekening "Steve van Weerzone".
- VERBODEN. Geen modelnamen (KNMI, HARMONIE, MetNet, NeuralGCM, SEED). Geen "insanely great", "one more thing" of Jobs-citaten. Gewoon Nederlands.
`.trim();

function systemFor(tier: PersonaTier): string {
  if (tier === "piet") return PIET_SYSTEM;
  if (tier === "reed") return REED_SYSTEM;
  return STEVE_SYSTEM;
}

// ---------- Prompt builder ----------

function humanisePrefs(tier: PersonaTier, prefs: Record<string, unknown>): string {
  const lines: string[] = [];
  if (tier === "piet") {
    const hond = (prefs.hond as { naam?: string } | undefined)?.naam;
    if (hond) lines.push(`- Hond: ${hond}`);
    if (prefs.fiets) lines.push("- Fietst dagelijks");
    if (prefs.tuin) lines.push("- Heeft tuin");
    if (prefs.kinderen) lines.push("- Heeft kinderen");
    if (prefs.astma) lines.push("- Astma / luchtweggevoelig");
  }
  if (tier === "reed") {
    if (prefs.kelder_gevoelig) lines.push("- Kelder gevoelig voor water");
    if (prefs.plat_dak) lines.push("- Plat dak (windgevoelig)");
    if (prefs.baby) lines.push("- Baby in huis");
    if (prefs.paard_wei) lines.push("- Paarden in de wei");
    if (prefs.waterschade_historie) lines.push(`- Waterschade-historie: ${prefs.waterschade_historie}`);
  }
  if (tier === "steve") {
    if (prefs.branche) lines.push(`- Branche: ${prefs.branche}`);
    if (prefs.capaciteit) lines.push(`- Capaciteit: ${prefs.capaciteit} plekken`);
    const d = prefs.drempels as Record<string, unknown> | undefined;
    if (d) lines.push(`- Drempels: wind ${d.wind_bft ?? "?"} bft, regen ${d.regen_mm ?? "?"} mm, temp min ${d.temp_min ?? "?"}°, onweer ${d.onweer ? "ja" : "nee"}`);
    const dl = prefs.deadlines as Record<string, unknown> | undefined;
    if (dl) lines.push(`- Deadlines: inkoop ${dl.inkoop_uur ?? "?"}u, annulering ${dl.annulering_uur ?? "?"}u`);
  }
  return lines.length ? lines.join("\n") : "- (nog geen voorkeuren ingesteld)";
}

function knmiToPrompt(warnings: KNMIWarning[] | undefined): string {
  if (!warnings || warnings.length === 0) return "";
  const lines = warnings.map((w) => {
    const window = formatWindowLabel(w);
    const desc = w.description.split("\n")[0]?.trim() ?? "";
    return `- ${SEVERITY_LABEL[w.severity]} (${w.type})${window ? `, ${window}` : ""}: ${desc}`;
  });
  return `\n\nOFFICIËLE KNMI-WAARSCHUWING(EN) VOOR DEZE REGIO — verwerk dit FEITELIJK in de tekst, geen drama, geen overdrijving:\n${lines.join("\n")}`;
}

function knmiForecastToPrompt(forecast: string | null | undefined): string {
  if (!forecast) return "";
  return `\n\nKNMI OFFICIËLE VERWACHTING — gebruik dit als grondstof en feitelijke basis, maar schrijf in jouw eigen persona-stijl (geen KNMI-taal overnemen, geen bronvermelding):\n"${forecast}"`;
}

function estofexToPrompt(est: EstofexBeneluxSummary | null | undefined): string {
  if (!est) return "";
  const lvl = `Level ${est.maxLevel}`;
  if (est.beneluxText) {
    return `\n\nESTOFEX (${lvl}, Europees onweer-vooruitzicht) — relevant voor Benelux:\n"${est.beneluxText}"\nGebruik dit alleen als ondersteunende context, noem ESTOFEX niet bij naam.`;
  }
  return `\n\nESTOFEX heeft een ${lvl}-vooruitzicht actief in Europa, niet expliciet voor Benelux. Niet noemen tenzij het bij KNMI-data past.`;
}

function weatherToPrompt(w: WeatherSnapshot, neural?: WeatherData["neuralData"]): string {
  const lines = [
    `Nu: ${w.current.temperature}°C (voelt ${w.current.feelsLike}°), wind ${w.current.windSpeed} km/u (vlagen ${w.current.windGusts}), neerslag ${w.current.precipitation} mm, vocht ${w.current.humidity}%, code ${w.current.weatherCode}.`,
    `Vandaag: min ${w.daily.tempMin}°, max ${w.daily.tempMax}°, neerslag ${w.daily.precipitationSum} mm, wind-max ${w.daily.windMax} km/u, code ${w.daily.weatherCode}.`,
    `Verloop: ${w.hourlySummary}`,
  ];
  if (w.tomorrow) {
    lines.push(`Morgen: min ${w.tomorrow.tempMin}°, max ${w.tomorrow.tempMax}°, neerslag ${w.tomorrow.precipitationSum} mm, code ${w.tomorrow.weatherCode}. (Gebruik dit alleen voor preview_tomorrow — schrijf er geen volledig verhaal over.)`);
  }
  let base = lines.join("\n");

  // Nowcast + scenario-hints blijven welkom als extra context, maar ZONDER
  // de bronlabels die het model verleiden om "MetNet-3" in de tekst te zetten.
  if (neural) {
    base += `\n\nEXTRA CONTEXT (intern, NIET noemen in de tekst):
- Korte-termijn nowcast: ${neural.metNetNowcast}
- Scenario-spreiding: ${neural.seedScenario}
- Micro-klimaat: ${neural.neuralGcmImpact}`;
  }

  return base;
}
export async function generatePersonaBrief(
  ctx: BriefContext & { neural?: WeatherData["neuralData"] },
): Promise<PersonaBrief> {
  const persona = PERSONAS[ctx.tier];
  const system = systemFor(ctx.tier);

  const prefsStr = humanisePrefs(ctx.tier, ctx.prefs);

  const weatherStr =
    weatherToPrompt(ctx.weather, ctx.neural) +
    knmiForecastToPrompt(ctx.knmiForecast) +
    knmiToPrompt(ctx.knmiWarnings) +
    estofexToPrompt(ctx.estofex);
  const date = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const zonnig = ctx.weather.current.weatherCode === 0 || ctx.weather.current.weatherCode === 1;
  const maxT = ctx.weather.daily.tempMax;
  const rainT = ctx.weather.daily.precipitationSum;
  const mood =
    zonnig && maxT >= 15 && rainT < 1
      ? "mooi-dag — opgewekt, terras/wandeling/was-buiten is oké"
      : maxT >= 20 && rainT < 2
        ? "zomers — opgewekt, let op UV en water drinken"
        : rainT > 5 || (ctx.weather.current.weatherCode >= 95 && ctx.weather.current.weatherCode <= 99)
          ? "pittig-nat — eerlijk en praktisch, geen drama"
          : maxT < 5
            ? "koud — nuchter, jas mee, niet somber overdrijven"
            : "wisselend — laagdrempelig, beide scenario's benoemen";

  const userPrompt = `
Schrijf de dagelijkse ${persona.name}-brief voor ${ctx.firstName ?? "de lezer"} in ${ctx.city} (${date}).

PROFIEL:
${prefsStr}

WEERDATA VANDAAG:
${weatherStr}

TONALE HINT (volg deze, komt uit de data): ${mood}.

${SHARED_STYLE}
`.trim();

  const raw = await hermesChat([
    { role: "system", content: system },
    { role: "user", content: userPrompt },
  ], { model: "persona", temperature: 0.6, maxTokens: 2000, json: true });

  const cleaned = raw.replace(/```json|```/g, "").trim();
  // DeepSeek/LLM kan een object wrappen in uitleg — zoek het eerste { ... }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Geen JSON gevonden in LLM-response: ${cleaned.slice(0, 100)}`);
  const parsed = nlCopyGuardValue(JSON.parse(match[0]) as PersonaBrief);

  // Defensieve sanering
  return {
    subject: (parsed.subject ?? `${persona.name} — ${ctx.city}`).slice(0, 100),
    tagline: (parsed.tagline ?? "").slice(0, 60),
    greeting: (parsed.greeting ?? `Goedemorgen${ctx.firstName ? `, ${ctx.firstName}` : ""}.`).slice(0, 80),
    local_fact: (parsed.local_fact ?? "").slice(0, 200),
    verdict: parsed.verdict ?? "",
    details: Array.isArray(parsed.details) ? parsed.details.slice(0, 4) : [],
    closing: (parsed.closing ?? "").slice(0, 140),
    preview_tomorrow: parsed.preview_tomorrow ? (parsed.preview_tomorrow as string).slice(0, 120) : undefined,
  };
}
