
import { NextResponse } from "next/server";
import { matchProducts } from "@/lib/amazon-matcher";
import { WeatherData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const mockWeather: WeatherData = {
    current: {
      temperature: 12,
      feelsLike: 10,
      humidity: 85,
      windSpeed: 25,
      windDirection: "ZW",
      windGusts: 40,
      precipitation: 5.5,
      weatherCode: 61,
      isDay: true,
      cloudCover: 100,
    },
    minutely: [],
    hourly: [],
    daily: [
      { date: "2026-04-21", tempMax: 15, tempMin: 8, weatherCode: 61, precipitationSum: 12, windSpeedMax: 45, sunHours: 2 }
    ],
    sunrise: "",
    sunset: "",
    uvIndex: 1,
    models: { agreement: 90, label: "High", sources: ["KNMI"] }
  };

  const tests = [
    { name: "Regen + Piet", results: matchProducts(mockWeather, 3, new Date(), "piet") },
    { name: "Regen + Reed", results: matchProducts(mockWeather, 3, new Date(), "reed") },
    { 
        name: "Hitte + Steve", 
        results: matchProducts({
            ...mockWeather,
            current: { ...mockWeather.current, temperature: 28, weatherCode: 0, precipitation: 0 },
            daily: [{ ...mockWeather.daily[0], tempMax: 30, precipitationSum: 0 }]
        } as any, 3, new Date(), "steve") 
    },
  ];

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    tests: tests.map(t => ({
      name: t.name,
      products: t.results.products.map(p => ({
        id: p.id,
        title: p.title,
        tags: p.tags,
        personas: p.personas
      }))
    }))
  });
}
