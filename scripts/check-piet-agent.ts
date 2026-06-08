/**
 * Rooktest: pietHeadsUps leidt dag-advies + beste moment af. Geen netwerk.
 * Run: npx tsx scripts/check-piet-agent.ts
 */
import assert from "node:assert/strict";
import { pietHeadsUps } from "@/lib/agents/piet-agent";
import { buildPietView } from "@/lib/piet-view";
import { getDayContext } from "@/lib/agents/day-context";
import type { WeatherData } from "@/lib/types";

// Kies een zaterdag zodat day-context.isWeekend true is.
function nextSaturday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
const day0 = nextSaturday();
const now = new Date(`${day0}T08:00:00`);

const sunny: WeatherData = {
  current: { temperature: 21, feelsLike: 21, humidity: 50, windSpeed: 10, windDirection: "ZW", windGusts: 15, precipitation: 0, weatherCode: 1, isDay: true, cloudCover: 20 },
  minutely: [],
  hourly: Array.from({ length: 24 }, (_, h) => ({ time: `${day0}T${String(h).padStart(2, "0")}:00`, temperature: 18 + (h >= 12 && h <= 16 ? 6 : 0), apparentTemperature: 20, weatherCode: 1, precipitation: 0, windSpeed: 10, cape: 0, confidence: "high" as const })),
  daily: [{ date: day0, tempMax: 24, tempMin: 13, weatherCode: 1, precipitationSum: 0, windSpeedMax: 15, sunHours: 9 }],
  sunrise: `${day0}T05:30`, sunset: `${day0}T21:45`, uvIndex: 6,
  models: { agreement: 90, label: "Zonnig", sources: ["test"] },
};

const view = buildPietView(sunny, "Testdorp", null, now);
const heads = pietHeadsUps(view, getDayContext(now), now);
assert(heads.length >= 1, "Piet moet minstens een dag-advies geven");
assert(heads.every((h) => h.agent === "piet"), "alle heads horen bij piet");
assert(heads.some((h) => h.category === "best_moment"), "zonnige dag → beste moment");
assert(heads.every((h) => h.action.trim().length > 0), "elke heads-up draagt een actie");
assert(
  heads.every((h) => !["rain_risk", "wind_risk", "thunderstorm_risk"].includes(h.category)),
  "Piet emit nooit gevaar-categorieën (dat is Reed)",
);
console.log("OK: piet agent heads-ups");
