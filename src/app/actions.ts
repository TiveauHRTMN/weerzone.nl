"use server";

import { fetchWeatherData, getWeatherDescription } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const weather = await fetchWeatherData(lat, lon);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3-flash-preview",
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });

        const tomorrow = weather.daily[1];
        const prompt = `
Je bent de weerverteller van WeerZone. Schrijf een uitgebreid, nuchter Nederlands weerbericht.

LENGTE-EIS (HARDE REGEL):
- Exact 4 of 5 volle zinnen.
- Tussen de 55 en 90 woorden.
- Eén of twee zinnen is een foute output en wordt afgewezen.

STRUCTUUR (in deze volgorde):
1. Situatie nu (temp, lucht, gevoelstemp)
2. Verloop vandaag/avond (regen, wind, wat mensen buiten merken)
3. Morgen (wat te verwachten)
4. Korte, nuchtere afsluiter

VOORBEELD (qua lengte/toon — NIET kopiëren):
"Het is 12° in de stad met een bewolkte lucht die maar weinig licht doorlaat. De wind trekt vanmiddag aan en dan voelt het eerder als een schrale 9° op de fiets. Later op de dag kan er nog een buitje vallen, dus neem voor de zekerheid een jasje mee. Morgen draait het door met 14° en wisselend bewolkt, regen blijft grotendeels weg. Kortom: typisch Nederlands aprilweer, niks schokkends."

STIJL:
- Geen AI-jargon: geen 'analyse', 'data', 'verdict', 'verwachting', 'significant', 'conform'.
- Spreektaal, recht door zee, zoals een nuchtere kenner op een terras.

FEITEN NU:
Lucht: ${getWeatherDescription(weather.current.weatherCode)}
Temp: ${weather.current.temperature}° (voelt als ${weather.current.feelsLike}°)
Wind: ${weather.current.windSpeed} km/h
Regen nu: ${weather.current.precipitation} mm

VERLOOP VANDAAG/AVOND:
Regen komende 12u: ${weather.hourly.slice(0, 12).reduce((acc, h) => acc + h.precipitation, 0).toFixed(1)} mm

MORGEN (${tomorrow.date}):
Max: ${tomorrow.tempMax}°, Min: ${tomorrow.tempMin}°
Lucht: ${getWeatherDescription(tomorrow.weatherCode)}
Regen: ${tomorrow.precipitationSum} mm

Geef nu het volledige weerbericht (4-5 zinnen, 55-90 woorden).
        `.trim();

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.8, topP: 0.95 },
        });

        const text = result.response.text().trim().replace(/^"|"$/g, '');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        // Reject te korte output — dan opnieuw proberen
        if (text && wordCount >= 40) {
          weather.aiVerdict = text;
          break; // Succes!
        }
        console.warn(`AI output te kort (${wordCount} woorden), retry...`);
        attempts++;
        if (attempts === 3) {
          weather.aiVerdict = text && wordCount > 10 ? text : getMainCommentary(weather);
        }
      } catch (e) {
        attempts++;
        console.error(`AI Verdict attempt ${attempts} failed:`, e);
          if (attempts === 3) {
            weather.aiVerdict = getMainCommentary(weather);
          }
        await new Promise(r => setTimeout(r, 500)); // Wacht even voor de volgende poging
      }
    }
  }

  return weather;
}

export async function findBusinessLeads(query: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set in environment variables");
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.types",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "nl",
        maxResultCount: 20, // Maximaal 20 per keer voor overzicht
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Places API error:", errorData);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transformeren naar een cleaner formaat
    return (data.places || []).map((place: any) => ({
      name: place.displayName?.text || "Onbekend",
      address: place.formattedAddress,
      website: place.websiteUri,
      phone: place.nationalPhoneNumber,
      types: place.types,
    }));
  } catch (error) {
    console.error("Lead finding error:", error);
    return [];
  }
}
