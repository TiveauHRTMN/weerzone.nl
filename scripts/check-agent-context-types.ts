/**
 * Rooktest: makeAgentContext (pure assembler) bouwt een geldig wereldmodel.
 * Run: npx tsx scripts/check-agent-context-types.ts
 */
import assert from "node:assert/strict";
import { makeAgentContext, type AgentContext } from "@/lib/agents/context";
import type { WeatherData } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);
const weather: WeatherData = {
  current: { temperature: 18, feelsLike: 18, humidity: 65, windSpeed: 15, windDirection: "ZW", windGusts: 20, precipitation: 0, weatherCode: 3, isDay: true, cloudCover: 60 },
  minutely: [],
  hourly: Array.from({ length: 24 }, (_, h) => ({ time: `${today}T${String(h).padStart(2, "0")}:00`, temperature: 18, apparentTemperature: 18, weatherCode: 3, precipitation: 0, windSpeed: 15, cape: 0, confidence: "medium" as const })),
  daily: [{ date: today, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 5 }],
  sunrise: `${today}T05:30`, sunset: `${today}T21:45`, uvIndex: 4,
  models: { agreement: 80, label: "Rustig", sources: ["test"] },
};

const ctx: AgentContext = makeAgentContext({
  location: { name: "Testdorp", lat: 52.1, lon: 5.18, provinceLabel: "Utrecht" },
  now: new Date(`${today}T09:00:00`),
  weather,
  mariana: null, tesla: null, knmi: [], estofex: null,
});
assert.equal(ctx.day.date, today, "day-context datum moet vandaag zijn");
assert.equal(ctx.weather.daily[0].date, today, "weer gekoppeld");
assert.equal(ctx.location.provinceLabel, "Utrecht", "locatie doorgegeven");

console.log("OK: agent context assembleert");
