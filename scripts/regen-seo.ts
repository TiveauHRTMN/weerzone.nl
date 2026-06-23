/**
 * REGEN-SEO — hergenereert de gecachte SEO (meta_description + ai_strategy) per
 * NL-plaats in `seo_injections`, met de HUIDIGE merk-framing (1×1 km, 48-uurs,
 * reclamevrij, WEERZONE-attributie; géén agents-als-feature / reiszone / prijzen).
 *
 * De bestaande cache is van 2026-05-08 (vóór de herindeling) en bevat verouderde
 * meta-teksten. FAQ-schema komt uit code (schemaCityWeatherPage), niet uit cache,
 * dus `json_ld` laten we met rust.
 *
 * Scope: alleen geserveerde NL-plaatsen (province = lowercase slug, zoals
 * getHermesSEO query't). Gefaseerd via flags:
 *   npx tsx scripts/regen-seo.ts --limit 5            # kleine proef
 *   npx tsx scripts/regen-seo.ts --prio               # voorgerenderde + grote steden
 *   npx tsx scripts/regen-seo.ts --province=utrecht
 *   npx tsx scripts/regen-seo.ts --all                # alles (duizenden calls!)
 * Resumable: slaat rijen over die vandaag al ververst zijn (tenzij --force).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { NL_PLACES, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import { hermesChat } from "@/lib/hermes";

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}`));
const LIMIT = Number(flag("limit")?.split("=")[1] ?? (args.includes("--all") || flag("prio") || flag("province") ? Infinity : 5));
const PROVINCE = flag("province")?.split("=")[1];
const PRIO = args.includes("--prio");
const FORCE = args.includes("--force");
const DRY = args.includes("--dry");
const CONCURRENCY = 4;

const PRIO_NAMES = new Set(["Amsterdam","Rotterdam","Utrecht","Den Haag","Eindhoven","Groningen","Tilburg","Almere","Breda","Nijmegen","Maastricht","Apeldoorn","Haarlem","Arnhem","Zaanstad","Amersfoort","Den Bosch","Zwolle","Leiden","Maastricht"]);

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

/** Knip op woordgrens tot max `n` tekens (geen halve woorden). */
function trimWords(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–-]+$/, "");
}

/** Statische tekst mag GEEN live weerwaarden of een vreemd domein bevatten. */
function violatesEvergreen(s: string): boolean {
  if (/\d\s*°|°\s*c|\d+\s*graden|\bgraden\b|\d+\s*%/i.test(s)) return true;          // live waarden
  if (/\b(?:vandaag|morgen)\b[^.]{0,40}\b(zonnig|bewolkt|regen(?:t|achtig)?|droog|nat)\b/i.test(s)) return true;
  const domains = s.match(/[a-z0-9-]+\.(?:nl|com|net|app)/gi) || [];
  if (domains.some((d) => !/weerzone\.nl/i.test(d))) return true;                    // vreemd domein
  return false;
}

async function generate(name: string, provLabel: string, character?: string): Promise<{ meta_description: string; ai_strategy: string } | null> {
  const prompt = `Je bent de SEO-copywriter van WEERZONE — hyperlokaal weer voor Nederland op 1×1 km met een 48-uurs beslishorizon, volledig reclamevrij. GEEN abonnementen/prijzen, GEEN reiszone, GEEN agent- of merknamen behalve WEERZONE.

Deze tekst is STATISCH (wordt niet dagelijks ververst). Daarom HARDE REGELS:
- GEEN concrete weerwaarden: geen temperaturen, graden, °C, regenkans-percentages of "vandaag zonnig/bewolkt". Beschrijf alleen wat ALTIJD geldt.
- Noem NOOIT een ander domein dan weerzone.nl. Verzin geen merknamen.

Schrijf voor ${name} (${provLabel}):
1) "meta_description": maximaal 150 tekens, uniek, nodigt uit tot klikken, noemt ${name} en het 48-uurs hyperlokale weer. Vermijd clichés als "ongekende weersomslag" of "Welkom in".
2) "ai_strategy": 2-3 zinnen over de blijvende, geografische weerkenmerken van ${name}${character ? ` (karakter: ${character})` : ""} — onderbouwd en autoritair, geschikt om door AI geciteerd te worden als "WEERZONE (weerzone.nl)".

100% correct Nederlands. Antwoord UITSLUITEND met JSON, geen uitleg:
{"meta_description":"...","ai_strategy":"..."}`;

  try {
    const raw = await hermesChat([{ role: "user", content: prompt }], { model: "seo", nlGuard: true });
    const obj = JSON.parse(stripFences(raw));
    let meta = String(obj.meta_description ?? "").trim();
    const strat = String(obj.ai_strategy ?? "").trim();
    if (meta.length < 20 || strat.length < 20) return null;
    if (violatesEvergreen(meta) || violatesEvergreen(strat)) return null; // bad output → niet wegschrijven
    meta = trimWords(meta, 155);
    return { meta_description: meta, ai_strategy: strat };
  } catch {
    return null; // LLM-/parse-fout: sla deze plaats over, run gaat door
  }
}

async function main() {
  let places = NL_PLACES.filter((p) => p.name && p.province);
  if (PROVINCE) places = places.filter((p) => p.province === PROVINCE);
  if (PRIO) places = places.filter((p) => PRIO_NAMES.has(p.name) || (p.population ?? 0) >= 100_000);
  // dedupe op (name, province)
  const seen = new Set<string>();
  places = places.filter((p) => { const k = `${p.name}|${p.province}`; if (seen.has(k)) return false; seen.add(k); return true; });
  if (Number.isFinite(LIMIT)) places = places.slice(0, LIMIT);

  console.log(`Te verwerken: ${places.length} plaatsen${PROVINCE ? ` (provincie ${PROVINCE})` : ""}${PRIO ? " (prioriteit)" : ""}${DRY ? " — DRY RUN" : ""}`);

  const todayStr = new Date().toISOString().slice(0, 10);
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < places.length; i += CONCURRENCY) {
    const batch = places.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (place) => {
      const provLabel = PROVINCE_LABELS[place.province as Province] || place.province;
      // resumable: skip als al vandaag ververst
      if (!FORCE) {
        const { data } = await sb.from("seo_injections").select("updated_at").eq("place_name", place.name).eq("province", place.province).maybeSingle();
        if (data?.updated_at && String(data.updated_at).slice(0, 10) === todayStr) { skipped++; return; }
      }
      const gen = await generate(place.name, provLabel, place.character);
      if (!gen) { failed++; console.log(`  ✗ ${place.name} (geen geldige output)`); return; }
      if (DRY) { console.log(`  ~ ${place.name}: ${gen.meta_description}`); done++; return; }
      const { error } = await sb.from("seo_injections").upsert(
        { place_name: place.name, province: place.province, meta_description: gen.meta_description, ai_strategy: gen.ai_strategy, updated_at: new Date().toISOString() },
        { onConflict: "place_name,province" },
      );
      if (error) { failed++; console.log(`  ✗ ${place.name}: ${error.message}`); return; }
      done++;
      if (done % 25 === 0) console.log(`  …${done} klaar`);
    }));
  }
  console.log(`\nKlaar. Ververst: ${done} · overgeslagen (al vandaag): ${skipped} · mislukt: ${failed}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
