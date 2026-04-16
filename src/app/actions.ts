"use server";

import { fetchWeatherData } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const weather = await fetchWeatherData(lat, lon);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `
        Analyseer deze weerdata en geef een kort, krachtig verdict (max 15 woorden).
        Stijl: Cynisch, direct, Nederlands en een tikkeltje droog (zoals de app).
        Niet het weer voorlezen, maar de CONSEQUENTIE benadrukken.
        
        DATA: 
        Temp: ${weather.current.temperature}°
        Wind: ${weather.current.windSpeed} km/h
        Regen nu: ${weather.current.precipitation} mm
        Regen komende 48u: ${weather.hourly.reduce((acc, h) => acc + h.precipitation, 0).toFixed(1)} mm
        Code: ${weather.current.weatherCode}
      `.trim();

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 30, temperature: 0.8 },
      });

      weather.aiVerdict = result.response.text().trim();
    } catch (e) {
      console.error("AI Verdict error:", e);
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
