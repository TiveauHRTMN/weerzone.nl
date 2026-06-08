/**
 * Rooktest: buildReedView geeft het Tesla-signaal door (niet hardcoded null).
 * Run: npx tsx scripts/check-reed-view-tesla.ts
 */
import assert from "node:assert/strict";
import { buildReedView } from "@/lib/reed-view";
import type { WeatherData } from "@/lib/types";
import type { TeslaSignal } from "@/lib/mariana/tesla/types";

const today = new Date().toISOString().slice(0, 10);
const weather: WeatherData = {
  current: { temperature: 18, feelsLike: 18, humidity: 65, windSpeed: 15, windDirection: "ZW", windGusts: 20, precipitation: 0, weatherCode: 3, isDay: true, cloudCover: 60 },
  minutely: [],
  hourly: Array.from({ length: 24 }, (_, h) => ({ time: `${today}T${String(h).padStart(2, "0")}:00`, temperature: 18, apparentTemperature: 18, weatherCode: 3, precipitation: 0, windSpeed: 15, cape: 0, confidence: "medium" as const })),
  daily: [{ date: today, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 5 }],
  sunrise: `${today}T05:30`, sunset: `${today}T21:45`, uvIndex: 4,
  models: { agreement: 80, label: "Rustig", sources: ["test"] },
};
const tesla = { tesla_signal: 2, reed_action: "OBSERVE", mariana_summary: "Test" } as unknown as TeslaSignal;

const view = buildReedView({ weather, locationName: "Testdorp", tesla });
assert(view.tesla !== null, "tesla moet doorgegeven worden, niet hardcoded null");
assert.equal(view.tesla?.tesla_signal, 2, "tesla_signal moet overeenkomen met input");

console.log("OK: reed-view geeft tesla door");
