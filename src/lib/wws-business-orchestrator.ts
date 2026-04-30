import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchWeatherData } from "./weather";
import { findNearestCity } from "./types";

export interface WWSBusinessPayload {
  timestamp: string;
  asset_location: string;
  status: "GO" | "NO-GO" | "CAUTION";
  confidence_index: number; // consensus tussen modellen
  operational_risks: {
    wind_risk: { level: "LOW" | "MED" | "HIGH"; value: string; height: string };
    precip_risk: { level: "LOW" | "MED" | "HIGH"; value: string; impact: string };
    thermal_risk: { level: "LOW" | "MED" | "HIGH"; value: string; instruction: string };
  };
  b2b_commands: string[]; // Directe commando's: ["STAAK KRAAN", "STOP BETONSTORT"]
  model_divergence: string; // Analyse van afwijking tussen Harmonie/ICON/AROME
}

const BUSINESS_PROMPT = `
[SYSTEM_CORE]
IDENTITY: Steve, de WWS Business Strategist.
OBJECTIVE: Lever binaire operationele beslissingen voor specifieke GPS-locaties op basis van 8 gesyntheseerde datastromen. Focus uitsluitend op veiligheid, kostenbesparing en logistieke continuïteit.

[RISK TOLERANCE]
- Steve is CONSERVATIEF. Bij >10% kans op een kritieke grenswaarde (P90) is het verdict NO-GO.
- Steve negeert 'mooi weer' en focust uitsluitend op parameters die operaties verstoren.

[INPUT PARAMETERS]
Analyseer de data van Harmonie, ICON-D2 en AROME. 
Let op divergentie: Als AROME een piek ziet die Harmonie mist, weeg dit als een hoog risico.

[OUTPUT VECTORS]
Genereer uitsluitend JSON:
{
  "timestamp": "ISO8601",
  "asset_location": "Plaatsnaam/GPS",
  "status": "GO | NO-GO | CAUTION",
  "confidence_index": number (0-100),
  "operational_risks": {
    "wind_risk": { "level": "LOW|MED|HIGH", "value": "max gust in km/h", "height": "10m en 50m extrapolatie" },
    "precip_risk": { "level": "LOW|MED|HIGH", "value": "mm/u", "impact": "bijv. gladheid of zicht" },
    "thermal_risk": { "level": "LOW|MED|HIGH", "value": "graden", "instruction": "bijv. beton-uitharding risico" }
  },
  "b2b_commands": ["Lijst van binaire acties"],
  "model_divergence": "Korte technische analyse van model-verschillen"
}
`;

export async function executeBusinessOrchestrator(lat: number, lon: number): Promise<WWSBusinessPayload | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const weather = await fetchWeatherData(lat, lon);
    const city = findNearestCity(lat, lon);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: BUSINESS_PROMPT
    });

    const hours = weather.hourly.slice(0, 12).map(h => {
      const m = h.models;
      return `${new Date(h.time).getHours()}:00 -> H:${m?.harmonie?.precipitation}mm, I:${m?.icon?.precipitation}mm, A:${m?.arome?.precipitation}mm | Wind H:${m?.harmonie?.windSpeed}km/h, I:${m?.icon?.windSpeed}km/h`;
    }).join("\n");

    const prompt = `
LOCATIE: ${city.name} (${lat}, ${lon})
DATA MATRIX (Next 12 Hours):
${hours}

Bepaal de operationele status voor deze GPS-plek. Wees streng op neerslag divergentie en windstoten.
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.response.text()) as WWSBusinessPayload;
  } catch (err) {
    console.error("Steve Pipeline Error:", err);
    return null;
  }
}
