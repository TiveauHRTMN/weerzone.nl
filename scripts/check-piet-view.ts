/**
 * Rooktest voor de pure Piet view-adapter (geen netwerk).
 * Run: npx tsx scripts/check-piet-view.ts
 */
import { buildPietView } from "@/lib/piet-view";
import type { WeatherData } from "@/lib/types";

function mkHour(time: string, temperature: number, weatherCode: number, precipitation = 0, cape = 0) {
  return {
    time,
    temperature,
    apparentTemperature: temperature - 1,
    weatherCode,
    precipitation,
    windSpeed: 12,
    cape,
    confidence: "high" as const,
  };
}

const today = "2026-06-02";
const tomorrow = "2026-06-03";

const hourly = [
  ...Array.from({ length: 24 }, (_, h) =>
    mkHour(`${today}T${String(h).padStart(2, "0")}:00`, 14 + Math.round(8 * Math.sin((h / 24) * Math.PI)), h >= 6 && h <= 9 ? 0 : 1),
  ),
  ...Array.from({ length: 24 }, (_, h) =>
    mkHour(`${tomorrow}T${String(h).padStart(2, "0")}:00`, 12 + Math.round(6 * Math.sin((h / 24) * Math.PI)), h >= 13 && h <= 18 ? 95 : 3, h >= 13 && h <= 18 ? 2.5 : 0, h >= 13 && h <= 18 ? 1500 : 0),
  ),
];

const weather: WeatherData = {
  current: {
    temperature: 21,
    feelsLike: 20,
    humidity: 55,
    windSpeed: 15,
    windDirection: "ZW",
    windGusts: 28,
    precipitation: 0,
    weatherCode: 1,
    isDay: true,
    cloudCover: 10,
  },
  minutely: [],
  hourly,
  daily: [
    { date: today, tempMax: 23, tempMin: 13, weatherCode: 1, precipitationSum: 0, windSpeedMax: 18, sunHours: 9.2 },
    { date: tomorrow, tempMax: 18, tempMin: 11, weatherCode: 95, precipitationSum: 8, windSpeedMax: 32, sunHours: 3.1 },
  ],
  sunrise: `${today}T05:27`,
  sunset: `${today}T21:43`,
  uvIndex: 7,
  models: { agreement: 90, label: "Hoge modelconsensus", sources: ["KNMI"] },
};

const air = {
  hourly: [],
  peakGrass: 35,
  peakBirch: 220,
  peakAlder: 5,
  peakMugwort: 0,
};

const view = buildPietView(weather, "Utrecht", air, new Date(`${today}T11:42:00`));

const checks: [string, boolean][] = [
  ["now.temp = 21", view.now.temp === 21],
  ["now.updatedAt = 11:42", view.now.updatedAt === "11:42"],
  ["vd.max = 23", view.days.vd.max === 23],
  ["vd.zon = 9", view.days.vd.zon === 9],
  ["vd hourly heeft cellen", view.days.vd.hourly.length > 0],
  ["vd hourly heeft een peak", view.days.vd.hourly.some((c) => c.peak)],
  ["mo verwijst naar Reed (onweer)", view.days.mo.referToReed === true],
  ["mo regen-proxy > 0", view.days.mo.regen > 0],
  ["uv aanwezig (7)", view.uv?.value === 7],
  ["pollen aanwezig (berk hoog)", !!view.pollen && view.pollen.rows.some((r) => r.name === "Berk")],
  ["scores: 4 stuks", view.scores.length === 4],
  ["sun.dayLength gevuld", view.sun?.dayLength !== "—"],
  ["headline gevuld", view.headline.length > 10],
];

let ok = true;
for (const [name, pass] of checks) {
  if (!pass) ok = false;
  console.log(`${pass ? "✓" : "✗"} ${name}`);
}
if (!ok) {
  console.error("\nFAALT — view:", JSON.stringify(view, null, 2));
  process.exit(1);
}
console.log("\nOK - piet-view adapter gedraagt zich correct");
