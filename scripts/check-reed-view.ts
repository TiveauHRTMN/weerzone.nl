/**
 * Rooktest voor de pure Reed view-adapter (geen netwerk).
 * Run: npx tsx scripts/check-reed-view.ts
 */
import assert from "node:assert/strict";
import { buildReedView } from "@/lib/reed-view";
import type { WeatherData } from "@/lib/types";
import type { KNMIWarning } from "@/lib/knmi-warnings";

const today = "2026-06-02";
const tomorrow = "2026-06-03";
const afterMidnight = "2026-06-03";
const afterMidnightTomorrow = "2026-06-04";

function mkHour(date: string, h: number, code: number, cape: number, precip: number) {
  return {
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    temperature: 20,
    apparentTemperature: 20,
    weatherCode: code,
    precipitation: precip,
    windSpeed: 15,
    cape,
    confidence: "high" as const,
  };
}

function weatherWith(opts: { thunder?: boolean }): WeatherData {
  const hours = [
    ...Array.from({ length: 24 }, (_, h) => {
      const storm = opts.thunder && h >= 14 && h <= 18;
      return mkHour(today, h, storm ? 95 : 3, storm ? 1800 : 100, storm ? 8 : 0);
    }),
    ...Array.from({ length: 24 }, (_, h) => mkHour(tomorrow, h, 3, 120, 0)),
  ];
  return {
    current: { temperature: 20, feelsLike: 20, humidity: 60, windSpeed: 18, windDirection: "ZW", windGusts: opts.thunder ? 70 : 20, precipitation: 0, weatherCode: 3, isDay: true, cloudCover: 70 },
    minutely: [],
    hourly: hours,
    daily: [
      { date: today, tempMax: 22, tempMin: 13, weatherCode: opts.thunder ? 95 : 3, precipitationSum: opts.thunder ? 14 : 0, windSpeedMax: opts.thunder ? 65 : 18, sunHours: 4 },
      { date: tomorrow, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 5 },
    ],
    sunrise: `${today}T05:23`,
    sunset: `${today}T21:43`,
    uvIndex: 4,
    models: { agreement: 80, label: "x", sources: ["KNMI"] },
  };
}

const now = new Date(`${today}T12:00:00+02:00`);

// 1. Rustige dag, geen waarschuwingen -> state calm, geen active, vandaag geen risico.
const calm = buildReedView({ weather: weatherWith({}), locationName: "De Bilt", now });
assert.equal(calm.state, "calm", "rustige dag -> calm");
assert.equal(calm.active, null, "rustig -> geen active warning");
assert.equal(calm.days.vd.hasRisk, false, "rustig -> vandaag geen risico");
assert.ok(calm.days.vd.calmReason && calm.days.vd.calmReason.length > 10, "rustig -> calmReason gevuld");

// 2. Onweersdata opent Reed in-depth: het lokale weer is de beslislaag.
const storm = buildReedView({ weather: weatherWith({ thunder: true }), locationName: "De Bilt", now });
assert.equal(storm.state, "warning", "onweersdata -> Reed opent in-depth");
assert.ok(storm.active, "onweer -> active warning aanwezig");
assert.equal(storm.days.vd.hasRisk, true, "onweer -> vandaag risicodag");
assert.ok(storm.capeMax >= 1500, `capeMax hoog verwacht: ${storm.capeMax}`);

// 3. Officiële waarschuwing krijgt voorrang in de active-tekst.
const knmi: KNMIWarning[] = [
  { province: "Utrecht", provinceSlug: "utrecht", type: "Onweersbuien", severity: "ORANGE", description: "x", validFrom: `${today}T13:00:00Z`, validUntil: `${today}T20:00:00Z`, issuedAt: null, key: "k1" },
];
const official = buildReedView({ weather: weatherWith({ thunder: true }), locationName: "Utrecht", provinceLabel: "Utrecht", knmi, now });
assert.equal(official.state, "warning", "officiële waarschuwing opent Reed");
assert.ok(official.active, "officiële waarschuwing -> active warning");
assert.equal(official.knmi.severityLabel, "Code oranje", "knmi severityLabel gezet");
assert.equal(official.knmi.items.length, 1, "1 knmi-item");

// 4. Tesla is geen frontend-begrip meer: view.tesla is altijd null.
assert.equal(calm.tesla, null, "geen zichtbare tesla -> null");
assert.equal(storm.tesla, null, "ook bij warning geen zichtbare tesla");

// 5. Na middernacht schuift Reed naar de juiste Amsterdam-dagen.
const midnightWeather = weatherWith({});
midnightWeather.hourly = [
  ...Array.from({ length: 24 }, (_, h) => mkHour(afterMidnight, h, 3, 100, 0)),
  ...Array.from({ length: 24 }, (_, h) => mkHour(afterMidnightTomorrow, h, 3, 100, 0)),
];
midnightWeather.daily = [
  { date: afterMidnight, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 18, sunHours: 5 },
  { date: afterMidnightTomorrow, tempMax: 21, tempMin: 13, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 6 },
];
const shifted = buildReedView({ weather: midnightWeather, locationName: "De Bilt", now: new Date("2026-06-03T00:05:00+02:00") });
assert.equal(shifted.days.vd.weekday, "Woensdag", "na 00:00 is vandaag woensdag");
assert.equal(shifted.days.vd.dateLabel, "3 juni", "na 00:00 is datum 3 juni");
assert.equal(shifted.days.mo.weekday, "Donderdag", "morgen is donderdag");
assert.equal(shifted.days.mo.dateLabel, "4 juni", "morgen is 4 juni");

console.log("OK - reed-view adapter gedraagt zich correct");
