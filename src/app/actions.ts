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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
