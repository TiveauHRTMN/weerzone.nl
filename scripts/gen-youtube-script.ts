import { config } from "dotenv";
config({ path: ".env.local" });
import { fetchWeatherData, getWeatherDescription, getWindBeaufort } from "../src/lib/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const LOCATIONS = [
  { name: "De Bilt (Centrum)", lat: 52.1, lon: 5.18 },
  { name: "Vlissingen (Kust)", lat: 51.44, lon: 3.57 },
  { name: "Maastricht (Zuiden)", lat: 50.85, lon: 5.69 },
  { name: "Groningen (Noorden)", lat: 53.22, lon: 6.56 },
];

async function run() {
  console.log("🚀 Weerdata verzamelen voor YouTube Short...");
  
  const weatherContext: any = {};

  for (const loc of LOCATIONS) {
    console.log(`- Data ophalen voor ${loc.name}...`);
    // false = niet-bot (zodat we forceHighRes kunnen gebruiken), true = forceHighRes
    const data = await fetchWeatherData(loc.lat, loc.lon, false, true);
    
    if (!data) {
      console.error(`❌ Kon geen data ophalen voor ${loc.name}`);
      process.exit(1);
    }

    const current = data.current;
    const today = data.daily[0];
    const tomorrow = data.daily[1];

    weatherContext[loc.name] = {
      nu: {
        temp: current.temperature,
        beschrijving: getWeatherDescription(current.weatherCode),
        wind: getWindBeaufort(current.windSpeed).label
      },
      vandaag: {
        maxTemp: today?.tempMax,
        minTemp: today?.tempMin,
        regen: today?.precipitationSum
      },
      morgen: {
        maxTemp: tomorrow?.tempMax,
        minTemp: tomorrow?.tempMin,
        regen: tomorrow?.precipitationSum
      }
    };
  }

  console.log("✅ Data verzameld. Gemini AI inschakelen voor het script...");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY mist in .env.local");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: `
Je bent de "Visual Data Director" van Weerzone.nl.
Je genereert een high-impact YouTube Storyboard dat de autoriteit en precisie van Weerzone uitstraalt.

DE WEERZONE IDENTITEIT:
- "De Absolute Waarheid": Wij gissen niet, we rekenen. De data is de baas.
- "Op de Vierkante Kilometer": Focus op hyper-lokale precisie (1km grid).
- Tone: Zakelijk, zelfverzekerd, nuchter en soms 'brutaal' in zijn directheid.

VISUELE STIJL:
- High-Tech Data: Satelliet-loops, oplichtende grid-kaarten, cinematische weersverschijnselen.
- UI Overlays: Gebruik de 'glassmorphism' look van de website (oranje/blauw accenten, blur) als overlays.
- Geen Cartoons: Gebruik fotorealistische, meteorologische beelden en strakke data-viz.

JSON STRUCTUUR:
{
  "metadata": {
    "focus_point": "Welk meteorologisch fenomeen drijft de video?",
    "authority_level": "P90 (Hoog risico) / P50 (Meest waarschijnlijk)"
  },
  "scenes": [
    {
      "duration": number,
      "visual_data": "Gedetailleerde beschrijving van de data-visualisatie (bijv. inzoomen op 1km grid, satellietbeeld, radar-loop).",
      "ui_overlay": "Welke Weerzone component zien we? (bijv. HomeCard, Misère-meter, Neerslag-grafiek).",
      "narration": "Piet's tekst: Kort, krachtig, gebaseerd op de cijfers. Geen jargon, maar direct."
    }
  ],
  "seo_strategy": {
    "title": "SEO Titel (Focus op locatie + precisie)",
    "description": "Data-gedreven beschrijving",
    "hashtags": ["#weerzone", "#weerbericht", "#nauwkeurig", "#data"]
  }
}

DATA REGELS:
- Verzin NOOIT getallen. Gebruik STRICT de JSON data.
- Benoem de bronnen indirect (bijv. "Onze gesynthetiseerde modellen tonen...").
    `.trim()
  });

  const prompt = `
Hier is de high-res weermatrix voor de Director:
${JSON.stringify(weatherContext, null, 2)}

Genereer een data-gedreven, visueel indrukwekkend storyboard. Focus op de 'brutale' precisie.
  `.trim();

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
      }
    });

    const scriptJson = JSON.parse(result.response.text());

    console.log("\n📡 WEERZONE DATA-STORYBOARD GEGENEREERD 📡");
    console.log(`Focus: ${scriptJson.metadata.focus_point}`);
    console.log(`Betrouwbaarheid: ${scriptJson.metadata.authority_level}`);
    console.log("=========================================\n");

    scriptJson.scenes.forEach((s: any, i: number) => {
      console.log(`[SCENE ${i+1}] ${s.duration}s`);
      console.log(`VISUAL: ${s.visual_data}`);
      console.log(`UI: ${s.ui_overlay}`);
      console.log(`AUDIO: "${s.narration}"\n`);
    });

    const outDir = path.join(process.cwd(), "youtube-storyboards");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const dateStr = new Date().toISOString().split("T")[0];
    const filePath = path.join(outDir, `weerzone-storyboard-${dateStr}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(scriptJson, null, 2), "utf-8");
    console.log(`\n💾 Data-storyboard opgeslagen in: ${filePath}`);

  } catch (error) {
    console.error("❌ Gemini AI Error:", error);
  }
}

run().catch(console.error);

  } catch (error) {
    console.error("❌ Gemini AI Error:", error);
  }
}

run().catch(console.error);
