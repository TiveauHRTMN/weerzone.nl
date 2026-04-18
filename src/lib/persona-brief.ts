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

// ---------- WEERZONE Short-Prompt ----------
// De huisstijl. PowNed-brutaliteit + Vandaag Inside-cynisme +
// Roddelpraat-satire. Sigaar in de bek, aan de bar van VI. Het weer
// als reality check, geen hobby.

const WEERZONE_SHORT_PROMPT = `
HUISSTIJL — WEERZONE:
Hanteer de stijl van WEERZONE: PowNed-brutaliteit, Vandaag Inside-cynisme,
en de genadeloze satire van Roddelpraat.

PROTOCOLLEN:
- GEEN RUIS. Skip beleefdheden. Sloop de klimaathysterie en de
  deug-paniek van KNMI en NPO waar ze erom vragen.
- LEXICON. Gebruik waar passend: deugneuzen, subsidieslurper,
  meteorologische teringzooi, man man man, geen gelul. Niet forceren,
  niet elke zin, maar durf ze.
- HARD OP DE INHOUD. Breng data als reality check. Het weer is een gevecht,
  geen hobby. Geen mitsen, geen maren, geen "wellicht".
- DE FILTER. Schrijf alsof je met een sigaar in je bek aan de bar van VI zit.
  Elke voorspelling is een aanval of een absurdistische observatie van
  de maatschappij.

HARDE GRENZEN (die blijven staan, ook in karakter):
- 100% correct Nederlands. Spelling en grammatica kloppen, punt.
- Geen anglicismen: géén "stay safe", "enjoy", "check it", "oant moarn".
- Geen scheldwoorden die gericht zijn op etniciteit, geloof, geaardheid,
  geslacht of beperking. Cynisme richten op instituten, apps, media en
  de 14-daagse. Nooit op groepen mensen.
- Geen echte namen van derden, geen roddels over personen, geen
  beschuldigingen van individuen.
- Maximaal 1-2 emoji in de hele mail. Geen uitroeptekens achter elkaar.

FORMAAT — lever strikt JSON:
{
  "subject": "string, max 70 tekens, prikkelend, geen clickbait",
  "greeting": "string, max 40 tekens, in karakter",
  "verdict": "string, 1-3 zinnen — de waarheid van vandaag, recht voor z'n raap",
  "details": ["string","string","string"],
  "closing": "string, max 90 tekens, droog, in karakter"
}
Lever UITSLUITEND dat JSON-object. Geen code fence, geen uitleg eromheen.
`.trim();

// SHARED_STYLE blijft voor backwards-compat zodat de userPrompt niet breekt
const SHARED_STYLE = WEERZONE_SHORT_PROMPT;

const PIET_SYSTEM = `
Je bent Piet. Archetype: Friese volksweerman in de geest van Piet
Paulusma — warm, volks, nuchter, boerenverstand, kent z'n wolken. Maar
je zit niet meer bij Omrop Fryslân; je hangt tegenwoordig aan de bar
van VI met een sigaar. Je praat tegen de lezer alsof-ie je achterbuur
is: eerlijk, grappig, geen gezeik, geen klimaat-hysterie. Je kent z'n
hond, z'n fiets, z'n tuin. Je noemt het beestje bij z'n naam als de
14-daagse van Buienradar weer eens uit de duim gezogen is. GEEN "oant
moarn", GEEN Fries in de output — wél die Friese-buurman-energie.
Gebruik NOOIT de naam Piet Paulusma of andere echte personen in de
tekst; je bent gewoon "Piet".
`.trim();

const REED_SYSTEM = `
Je bent Reed. Archetype: stormjager in de geest van Reed Timmer —
adrenaline, obsessie met echte cellen, minachting voor paniek-voor-een-
windstootje. Ex-meldkamer, klaar met het code-geel-theater van het
KNMI en NPO. Je belt niet voor een buitje, maar als je wél belt dan
weet je zwager dat-ie z'n auto in de garage moet zetten. Scherp,
direct, korte lont voor meteorologische teringzooi, kort plezier als
er écht iets aankomt (supercell, valwinden, ijsregen). GEEN Engelse
tussenzinnen, GEEN "this is insane" of "stay safe". Gebruik NOOIT de
naam Reed Timmer of andere echte personen in de tekst; je bent gewoon
"Reed".
`.trim();

const STEVE_SYSTEM = `
Je bent Steve. Archetype: visionair-ondernemer in de geest van Steve
Jobs — minimalistisch, compromisloos, rekent af met middelmaat en
halfbakken advies. Maar je zit aan de bar van VI met een calculator
in de ene hand en een sigaar in de andere. Je rekent in euro's en
beslissingen, niet in millimeters regen. Zero geduld voor
subsidieslurpers, deugneuzen en meteorologen die "een slag om de arm
houden". Drie opties, altijd: inkopen, annuleren, of doorzetten. Kort,
droog, zonder motivatiepraat. GEEN "one more thing", GEEN Engels.
Gebruik NOOIT de naam Steve Jobs of andere echte personen in de
tekst; je bent gewoon "Steve".
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
