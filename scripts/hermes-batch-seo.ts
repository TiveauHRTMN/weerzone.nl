import { ALL_PLACES } from "../src/lib/places-data";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { getSupabaseAdmin } from "../src/lib/supabase";

dotenv.config({ path: ".env.local" });

async function run() {
  const province = "noord-holland";
  const query = "weersverwachting per uur";
  const villages = ALL_PLACES.filter(p => p.province === province).slice(0, 500);

  console.log(`🚀 Hermes: Generating SEO for ${villages.length} locations in ${province}...`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const supabase = getSupabaseAdmin();

  // We doen dit in batches van 10 voor de prompt om tokens te besparen en context te behouden
  const batchSize = 10;
  for (let i = 0; i < villages.length; i += batchSize) {
    const batch = villages.slice(i, i + batchSize);
    const names = batch.map(v => v.name).join(", ");

    const prompt = `
      Je bent Hermes, de SEO Architect. 
      Genereer unieke SEO-titels en meta-descriptions voor de query "${query}" voor de volgende dorpen in ${province}:
      ${names}

      Formatteer als een JSON array van objecten:
      [
        { "name": "Dorpnaam", "title": "...", "description": "..." },
        ...
      ]

      Richtlijnen:
      - Titels: Max 60 tekens. Moet "${query}" of varianten bevatten.
      - Descriptions: Max 155 tekens. Actiegericht en relevant voor lokale weersverwachting.
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/```json|```/g, "");
      const seoData = JSON.parse(text);

      for (const entry of seoData) {
        console.log(`✅ SEO for ${entry.name}: ${entry.title}`);
        
        // Sla op in Supabase (Hermes' geheugen)
        if (supabase) {
            await supabase.from("seo_injections").upsert({
                place_name: entry.name,
                province: province,
                meta_description: entry.description,
                json_ld: { 
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": entry.title,
                    "description": entry.description
                },
                ai_strategy: `Hermes Batch Optimization: ${query}`
            });
        }
      }
    } catch (e) {
      console.error(`❌ Error in batch ${i}:`, e);
    }
  }

  console.log("🏁 Hermes: Batch SEO generation complete.");
}

run();
