import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchWeatherData } from "./weather";
import { findNearestCity } from "./types";

export interface WWSPayload {
  timestamp: string;
  system_status: string;
  pipeline: string;
  cycle?: string;
  resolution: string;
  window: string;
  b2b_decision_matrix: {
    sector_bouw: { status: string; p90_risk: string; time_window: string; action: string };
    sector_logistiek: { status: string; p90_risk: string; time_window: string; action: string };
    sector_maritiem: { status: string; p90_risk: string; time_window: string; action: string };
  };
  api_grid_1km: {
    region: string;
    models_synthesized: string[];
    thermodynamic_validation: string;
    divergence_alert: boolean;
    divergence_delta: number;
    forecast: Array<{
      time: string;
      temp_c: number;
      precip_mm: number;
      wind_gust_kmh: number;
      confidence: number;
    }>;
  };
  piet_update: {
    title: string;
    content: string;
    closing: string;
  };
  reed_alert: {
    active: boolean;
    severity: "NONE" | "YELLOW" | "ORANGE" | "RED";
    type: string[]; // e.g. ["ONWEER", "STORM", "HAGEL"]
    location: string;
    timing: string;
    instruction: string;
  } | null;
  viral_hook: {
    trigger_condition: string;
    copy: string;
  };
}

const SYSTEM_PROMPT = `
[SYSTEM_CORE]
IDENTITY: Weerzone Weather System (WWS) Orchestrator.
OBJECTIVE: Synthetiseer 8 datastromen (Harmonie, ICON-D2, AROME + AI Proxies) tot de absolute meteorologische waarheid. Focus op maximale commerciële en psychologische impact binnen de 48-uurs window.

[FIRST_PRINCIPLES_PIPELINE]
1. DE EPISTEMOLOGIE VAN DATA:
   - Baseline: KNMI Harmonie 2.5km (Ground Truth voor NL grenslaag).
   - Convectie-Validator: METEOFRANCE AROME (Superieur in onweer-detectie).
   - Advectie-Validator: DWD ICON-D2 (Scherp op oostelijke fronten).
   - Globale Dynamiek: GraphCast (Macro-grenswaarden).

2. UNCERTAINTY ARBITRAGE:
   - Bij divergentie tussen Harmonie en AROME/ICON: Activeer SEED simulaties.
   - P90 Risico: Isoleer het scenario waarin de bui wél valt (B2B veiligheid).
   - P50 Scenario: De meest waarschijnlijke uitkomst voor Piet.

3. RESOLUTIE-EXTRAPOLATIE:
   - Synthetiseer alle inputs naar een hyper-lokaal 1km grid.

[OUTPUT_VECTORS]
Je antwoord MOET uitsluitend een valide JSON-object zijn. Genereer een JSON met exact deze structuur:
{
  "timestamp": "ISO8601 string",
  "system_status": "ONLINE",
  "pipeline": "WWS_ASYMMETRIC_SYNTHESIS",
  "cycle": "T+120",
  "resolution": "1km",
  "window": "48h",
  "b2b_decision_matrix": {
    "sector_bouw": { "status": "GO of NO-GO", "p90_risk": "string", "time_window": "string", "action": "string" },
    "sector_logistiek": { "status": "GO of NO-GO of GO_WITH_CAUTION", "p90_risk": "string", "time_window": "string", "action": "string" },
    "sector_maritiem": { "status": "GO of NO-GO", "p90_risk": "string", "time_window": "string", "action": "string" }
  },
  "api_grid_1km": {
    "region": "string",
    "models_synthesized": ["KNMI_Harmonie_2.5", "DWD_ICON-D2", "METEOFRANCE_AROME", "GraphCast", "NeuralGCM", "SEED"],
    "thermodynamic_validation": "PASSED",
    "divergence_alert": true of false,
    "divergence_delta": number,
    "forecast": [
      { "time": "ISO8601 string", "temp_c": number, "precip_mm": number, "wind_gust_kmh": number, "confidence": number }
    ]
  },
  "piet_update": {
    "title": "string",
    "content": "Piet's hyper-lokale interpretatie. Nuchter, warm, concreet.",
    "closing": "— Piet, voor Weerzone"
  },
  "reed_alert": {
    "active": true of false,
    "severity": "NONE" of "YELLOW" of "ORANGE" of "RED",
    "type": ["ONWEER", "STORM", "HAGEL", "EXTREME_REGEN"],
    "location": "string",
    "timing": "string",
    "instruction": "string"
  },
  "viral_hook": {
    "trigger_condition": "Analyseer model-divergentie (Harmonie vs ICON/AROME)",
    "copy": "string"
  }
}

[TONE OF VOICE - PIET]
- Nuchter, betrouwbaar, hyper-lokaal. Noem GEEN modelnamen.

[TONE OF VOICE - REED]
- Alleen extremiteiten. Noem specifiek WAAR en WANNEER.
`;

export async function executeWWSOrchestrator(lat: number, lon: number): Promise<WWSPayload | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("WWS: GEMINI_API_KEY ontbreekt");
    return null;
  }

  try {
    const weather = await fetchWeatherData(lat, lon);
    const city = findNearestCity(lat, lon);

    if (!weather) {
       console.error("WWS: Kan weersdata niet ophalen");
       return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT 
    });

    const hours = weather.hourly.slice(0, 12).map(h => {
      const time = new Date(h.time).getHours() + ":00";
      const m = h.models;
      return `${time} -> H:${m?.harmonie?.temperature}C/${m?.harmonie?.precipitation}mm, I:${m?.icon?.temperature}C/${m?.icon?.precipitation}mm, A:${m?.arome?.temperature}C/${m?.arome?.precipitation}mm (Wind: ${h.windSpeed}km/h, Code: ${h.weatherCode})`;
    }).join("\n");

    const prompt = `
    START_PIPELINE.

    Input Data (Multi-Model Entry):
    Locatie: ${city.name} (${lat}, ${lon})
    Model Consensus Index: ${weather.models.agreement}%
    Bronnen: ${weather.models.sources.join(", ")}

    Data Matrix (Next 12 Hours):
    (H = Harmonie, I = ICON-D2, A = AROME)
    ${hours}

    Analyseer de divergentie tussen H, I en A. Bij neerslagpieken in I of A die H mist: weeg het P90 risico zwaarder voor Reed.
    Genereer de output payload uitsluitend als geldige JSON.
    `.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        maxOutputTokens: 800,
      }
    });


    const text = result.response.text();
    return JSON.parse(text) as WWSPayload;
  } catch (err) {
    console.error("WWS Pipeline Error:", err);
    return null;
  }
}
