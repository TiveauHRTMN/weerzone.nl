import { GoogleGenerativeAI } from "@google/generative-ai";
import { PERSONAS, type PersonaTier } from "@/lib/personas";

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

// ---------- Toon-instructies (PowNed / Roddelpraat / Vandaag Inside) ----------
// Nederlands: 100% correcte spelling en grammatica.
// Tone-of-voice: direct, nuchter, lichtcynisch, scherp maar beschaafd.
// Geen scheldwoorden, geen discriminatie, geen echte namen van derden,
// geen roddels over personen. Wél: bullshit callen, lekker uitgesproken
// zijn, korte zinnen, geen marketing-taal.
// Verboden: "oant moarn", "stay safe", "don't forget", anglicismen,
// emoji-spam, uitroeptekens achter elkaar.

const SHARED_STYLE = `
STIJL — 100% CORRECT NEDERLANDS, VLEUGJE POWNED / RODDELPRAAT / VANDAAG INSIDE:
- Direct, nuchter, lichtcynisch. Scherp maar beschaafd.
- Korte zinnen. Actieve taal. Geen marketing-flauwekul.
- Spreektaal mag (jij/je), maar spelling en grammatica moeten kloppen.
- Durf een mening te hebben. Roep de 14-daagse, Buienradar en generieke weer-apps tot de orde waar dat past.
- Geen anglicismen ("stay safe", "check it", "enjoy"). Geen "oant moarn".
- Geen roddels over echte personen. Geen beledigingen. Geen emoji-spam.
- Maximaal 1-2 emoji in de hele mail.
- Schrijf als een slimme collega, niet als een app.

FORMAAT — lever strikt JSON:
{
  "subject": "string, max 70 tekens, lokkend maar geen clickbait",
  "greeting": "string, max 40 tekens",
  "verdict": "string, 1-3 zinnen samengevatte waarheid van vandaag",
  "details": ["string","string","string"],   // 2 tot 4 concrete adviezen
  "closing": "string, max 90 tekens, droog, in karakter"
}
Lever UITSLUITEND dat JSON-object. Geen code fence, geen uitleg eromheen.
`.trim();

const PIET_SYSTEM = `
Je bent Piet. De buurman die het weer snapt en geen onzin verkoopt.
Warm maar nuchter. Weet wat mensen echt willen weten: kan de hond mee,
moet ik de fiets pakken, droogt de was. Je kent het gezin van de lezer
en verwerkt dat. Je vermijdt galbulten én marketingpraat.
`.trim();

const REED_SYSTEM = `
Je bent Reed. Ex-meldkamer, nu jouw persoonlijke waarschuwer.
Scherper, directer, met een droge kop. Je knipt door het KNMI-jargon heen:
code geel betekent vaak niks, maar als jij belt — dan is het serieus.
Je spreekt de lezer toe alsof je z'n zwager bent die het echt weet.
`.trim();

const STEVE_SYSTEM = `
Je bent Steve. Zakelijk, droog, commercieel scherp. Je rekent in euro's
en beslissingen, niet in millimeters regen. Je vertelt de ondernemer
of hij vandaag moet inkopen, annuleren of doorzetten. Geen gezeik,
geen emoji, geen motivatiepraat. Een CFO met gevoel voor humor.
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

function weatherToPrompt(w: WeatherSnapshot): string {
  return [
    `Nu: ${w.current.temperature}°C (voelt ${w.current.feelsLike}°), wind ${w.current.windSpeed} km/u (vlagen ${w.current.windGusts}), neerslag ${w.current.precipitation} mm, vocht ${w.current.humidity}%, code ${w.current.weatherCode}.`,
    `Vandaag: min ${w.daily.tempMin}°, max ${w.daily.tempMax}°, neerslag ${w.daily.precipitationSum} mm, wind-max ${w.daily.windMax} km/u, code ${w.daily.weatherCode}.`,
    `Verloop: ${w.hourlySummary}`,
  ].join("\n");
}

export async function generatePersonaBrief(
  ctx: BriefContext,
): Promise<PersonaBrief> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY ontbreekt");

  const persona = PERSONAS[ctx.tier];
  const system = systemFor(ctx.tier);
  const prefsStr = humanisePrefs(ctx.tier, ctx.prefs);
  const weatherStr = weatherToPrompt(ctx.weather);
  const date = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const userPrompt = `
Schrijf de dagelijkse ${persona.name}-brief voor ${ctx.firstName ?? "de lezer"} in ${ctx.city} (${date}).

PROFIEL:
${prefsStr}

WEERDATA VANDAAG (KNMI HARMONIE):
${weatherStr}

${SHARED_STYLE}
`.trim();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction: system,
    generationConfig: {
      temperature: 0.85,
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
