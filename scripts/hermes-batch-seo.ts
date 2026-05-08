import { ALL_PLACES } from "../src/lib/places-data";
import { hermesChat } from "../src/lib/hermes";
import * as dotenv from "dotenv";
import { getSupabaseAdmin } from "../src/lib/supabase";

dotenv.config({ path: ".env.local" });

function extractArray(text: string): any[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed;
  // model wrappte de array in een object
  const val = parsed.results ?? parsed.seo ?? parsed.data ?? parsed.locations ?? Object.values(parsed)[0];
  if (Array.isArray(val)) return val;
  throw new Error(`Geen array gevonden in response: ${cleaned.slice(0, 100)}`);
}

const PROVINCES = [
  "drenthe", "flevoland", "friesland", "gelderland", "groningen",
  "limburg", "noord-brabant", "noord-holland", "overijssel",
  "utrecht", "zeeland", "zuid-holland",
];

async function run() {
  const query = "weersverwachting per uur";
  const supabase = getSupabaseAdmin();
  const batchSize = 10;

  const total = ALL_PLACES.length;
  console.log(`🚀 DeepSeek V4 Pro: ${total} locaties in heel Nederland (${PROVINCES.length} provincies)...`);

  for (const province of PROVINCES) {
    const villages = ALL_PLACES.filter(p => p.province === province);
    console.log(`\n📍 ${province}: ${villages.length} locaties`);

  for (let i = 0; i < villages.length; i += batchSize) {
    const batch = villages.slice(i, i + batchSize);
    const names = batch.map(v => v.name).join(", ");

    try {
      const text = await hermesChat([
        {
          role: "system",
          content: `Je bent een Nederlandse SEO-specialist. Geef ALLEEN een JSON array terug, geen uitleg, geen markdown blokken.`,
        },
        {
          role: "user",
          content: `Genereer SEO-titels en meta-descriptions voor "${query}" voor deze dorpen in ${province}: ${names}

Geef ALLEEN terug:
[{ "name": "naam", "title": "...", "description": "..." }]

INSTRUCTIES VOOR TITEL/DESC:
- title: Max 60 tekens. Moet "${query}" of varianten bevatten. Gebruik psychologische triggers (Urgentie, FOMO, Risico).
- description: Max 155 tekens. Speel in op emotie (FOMO bij zon, verliesaversie bij storm/regen). Creëer een 'Information Gap': noem de weersomslag, maar dwing een klik af voor de exacte timing/impact. Geef NOOIT het volledige antwoord.`
        },
      ], { model: "seo", temperature: 0.3, maxTokens: 4096 });

      const seoData = extractArray(text);
      console.log(`✅ Batch ${i}: ${seoData.length} locaties verwerkt`);

      for (const entry of seoData) {
        if (supabase) {
          await supabase.from("seo_injections").upsert({
            place_name: entry.name,
            province,
            meta_description: entry.description,
            json_ld: {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": entry.title,
              "description": entry.description,
            },
            ai_strategy: `DeepSeek V4 Pro Batch SEO: ${query}`,
          });
        }
      }
    } catch (e) {
      console.error(`❌ Batch ${i}:`, (e as Error).message);
    }

    // kleine pauze om rate limiting te voorkomen
    await new Promise(r => setTimeout(r, 500));
  }
  } // einde provincie-loop

  console.log("\n🏁 Heel Nederland klaar.");
}

run();
