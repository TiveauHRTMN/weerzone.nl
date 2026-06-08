/**
 * Rooktest: reedHeadsUps leidt severe heads-ups af uit de ReedView. Geen netwerk.
 * Run: npx tsx scripts/check-reed-agent.ts
 */
import assert from "node:assert/strict";
import { reedHeadsUps } from "@/lib/agents/reed-agent";
import { buildReedView } from "@/lib/reed-view";
import type { WeatherData } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);
const now = new Date(`${today}T09:00:00`);

function weatherWith(cape: number, thunder: boolean): WeatherData {
  const code = thunder ? 95 : 3;
  return {
    current: { temperature: 22, feelsLike: 22, humidity: 70, windSpeed: 15, windDirection: "ZW", windGusts: 25, precipitation: 0, weatherCode: thunder ? 95 : 3, isDay: true, cloudCover: 70 },
    minutely: [],
    hourly: Array.from({ length: 24 }, (_, h) => ({ time: `${today}T${String(h).padStart(2, "0")}:00`, temperature: 22, apparentTemperature: 22, weatherCode: h >= 14 && h <= 18 ? code : 2, precipitation: thunder && h >= 14 && h <= 18 ? 6 : 0, windSpeed: 15, cape: h >= 12 && h <= 19 ? cape : 100, confidence: "medium" as const })),
    daily: [{ date: today, tempMax: 24, tempMin: 14, weatherCode: thunder ? 95 : 2, precipitationSum: thunder ? 18 : 0, windSpeedMax: 30, sunHours: 6 }],
    sunrise: `${today}T05:30`, sunset: `${today}T21:45`, uvIndex: 5,
    models: { agreement: 70, label: "Onrustig", sources: ["test"] },
  };
}

// Onweersdag → minstens één severe heads-up met concrete actie.
const stormView = buildReedView({ weather: weatherWith(1800, true), locationName: "Testdorp", now });
const stormHeads = reedHeadsUps(stormView, now);
assert(stormHeads.length >= 1, "onweersdag moet een Reed heads-up geven");
assert.equal(stormHeads[0].agent, "reed", "heads-up hoort bij reed");
assert(stormHeads[0].action.trim().length > 0, "heads-up moet een concrete actie dragen");
assert(["important", "urgent"].includes(stormHeads[0].severity), "onweer heads-up is important/urgent");
assert.equal(stormHeads[0].category, "thunderstorm_risk", "onweer → thunderstorm_risk");

// Rustige dag → geen heads-ups (rust).
const calmView = buildReedView({ weather: weatherWith(50, false), locationName: "Testdorp", now });
assert.equal(reedHeadsUps(calmView, now).length, 0, "rustige dag moet stil zijn");

console.log("OK: reed agent heads-ups");
