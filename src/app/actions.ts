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

        const prompt = `
          Vertel wat het weer NU voor impact heeft (max 15 woorden).
          GEBRUIK GEEN AI-JARGON (geen woorden als 'analyse', 'data', 'verdict', 'verwachting', 'model').
          STIJL: Direct, nuchter, typisch Nederlands (geen poeha). 
          Niet het weer voorlezen, maar vertellen of je een jas aan moet of dat het gewoon ruk is.
          
          WEER-FACTS: 
          Temp: ${weather.current.temperature}°
          Wind: ${weather.current.windSpeed} km/h
          Regen nu: ${weather.current.precipitation} mm
          Regen komende 48u: ${weather.hourly.reduce((acc, h) => acc + h.precipitation, 0).toFixed(1)} mm
          Lucht: ${getWeatherDescription(weather.current.weatherCode)}
        `.trim();

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 30, temperature: 0.9, topP: 0.8 },
        });

        const text = result.response.text().trim().replace(/^"|"$/g, '');
        if (text) {
          weather.aiVerdict = text;
          break; // Succes!
        }
      } catch (e) {
        attempts++;
        console.error(`AI Verdict attempt ${attempts} failed:`, e);
        if (attempts === 3) {
          // Laatste fallback: Geen AI melding, maar een slimme data-conclusie
          if (weather.current.precipitation > 2) weather.aiVerdict = "Het is gewoon hondenweer. Blijf binnen.";
          else if (weather.current.windSpeed > 40) weather.aiVerdict = "Windkracht waar je niet vrolijk van wordt.";
          else if (weather.current.temperature > 25) weather.aiVerdict = "Warm. Te warm. Succes met zweten.";
          else weather.aiVerdict = "Prima polderweer. Niks te klagen (of juichen).";
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
