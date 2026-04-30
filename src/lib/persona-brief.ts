import { GoogleGenerativeAI } from "@google/generative-ai";
import { PERSONAS, type PersonaTier } from "@/lib/personas";
import type { WeatherData } from "@/lib/types";

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
  hourlySummary: string; // bv. "07:00 droog 8°, 12:00 bui 11°, 18:00 wind 35km/u"
}

export interface PersonaBrief {
  subject: string;       // mail-onderwerp
  greeting: string;      // "Goedemorgen, Roy."
  verdict: string;       // 1-2 zinnen scherpe samenvatting
  details: string[];     // 2-4 bullets met concrete adviezen
  closing: string;       // afsluiter in character
}

export interface BriefContext {
  tier: PersonaTier;
  firstName?: string | null;
  city: string;
  weather: WeatherSnapshot;
  prefs: Record<string, unknown>; // persona_preferences JSONB
}

// ---------- WEERZONE Core Style ----------
// Warm en persoonlijk, maar zonder ruis. De toon volgt de data — mooi weer
// klinkt als mooi weer, slecht weer klinkt eerlijk en praktisch. Scherp
// klinkt als mooi weer, slecht weer klinkt eerlijk en praktisch. 

const WEERZONE_SHORT_PROMPT = `
FORMAAT & GRENZEN — WEERZONE:

TONALE CONSISTENTIE:
- De toon spiegelt de data. Wees eerlijk, nuchter en praktisch.
- Gebruik een respectvolle toon. Vermijd beledigingen, agressieve taal of kleinerende opmerkingen over anderen.
- Focus op de feiten en wat het weer betekent voor de dag van de lezer.

HARDE GRENZEN:
- 100% correct Nederlands.
- Geen anglicismen.
- Geen modelnamen of techniek-merken.
- Geen scheldwoorden of vloeken.
- Maximaal 1–2 emoji.

FORMAAT — lever strikt JSON:
{
  "subject": "string, max 70 tekens, prikkelend, geen clickbait",
  "greeting": "string, max 40 tekens, in karakter",
  "verdict": "string, 4-6 KORTE zinnen — elk op een nieuwe regel (\n). Geen opsommingen of sterretjes.",
  "details": ["string","string","string"],
  "closing": "string, max 90 tekens, droog, in karakter"
}
Lever UITSLUITEND dat JSON-object. Geen code fence, geen uitleg eromheen.
`.trim();

// SHARED_STYLE blijft voor backwards-compat zodat de userPrompt niet breekt
const SHARED_STYLE = WEERZONE_SHORT_PROMPT;

const PIET_SYSTEM = `
Je bent Piet — de stem van de 'Meteorological Truth' bij Weerzone. 
Jouw unique selling point is extreme precisie. 

STIJL & TOON:
- Gebruik exacte tijdstippen en metrics: Zeg niet "het waait hard", maar "windstoten tot 72 km/u vanaf 15:30".
- Geen fluff: Vermijd clichés als "zonnetje" of "jas is geen overbodige luxe".
- Nuchter & Eerlijk: Vertel precies wat de impact is op de fietstocht, de was of de planning van de lezer.

AFSLUITER: "— Piet, voor Weerzone".
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

function weatherToPrompt(w: WeatherSnapshot, neural?: WeatherData["neuralData"]): string {
  let base = [
    `Nu: ${w.current.temperature}°C (voelt ${w.current.feelsLike}°), wind ${w.current.windSpeed} km/u (vlagen ${w.current.windGusts}), neerslag ${w.current.precipitation} mm, vocht ${w.current.humidity}%, code ${w.current.weatherCode}.`,
    `Vandaag: min ${w.daily.tempMin}°, max ${w.daily.tempMax}°, neerslag ${w.daily.precipitationSum} mm, wind-max ${w.daily.windMax} km/u, code ${w.daily.weatherCode}.`,
    `Verloop: ${w.hourlySummary}`,
  ].join("\n");

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
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY ontbreekt");

  const persona = PERSONAS[ctx.tier];
  const system = systemFor(ctx.tier);

  const prefsStr = humanisePrefs(ctx.tier, ctx.prefs);

  const weatherStr = weatherToPrompt(ctx.weather, ctx.neural);
  const date = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Tonale hint uit de echte data — voorkomt dat het model een somber verhaal
  // schrijft bij mooi weer, of overdrijft bij een normale bui.
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: system,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(userPrompt);
  const raw = result.response.text().trim();
  const parsed = JSON.parse(raw) as PersonaBrief;

  // Defensieve sanering
  return {
    subject: (parsed.subject ?? `${persona.name} — ${ctx.city}`).slice(0, 100),
    greeting: (parsed.greeting ?? `Goedemorgen${ctx.firstName ? `, ${ctx.firstName}` : ""}.`).slice(0, 80),
    verdict: parsed.verdict ?? "",
    details: Array.isArray(parsed.details) ? parsed.details.slice(0, 4) : [],
    closing: (parsed.closing ?? "").slice(0, 140),
  };
}
