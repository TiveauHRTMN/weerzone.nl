"use server";

import { fetchWeatherData } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  return await fetchWeatherData(lat, lon);
}
