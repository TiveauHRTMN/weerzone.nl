import { getThunderstormChance, getRainChance, groupRiskPeriods } from "../src/lib/risk-analysis";
import type { HourlyForecast } from "../src/lib/types";
import type { KNMIWarning } from "../src/lib/knmi-warnings";

const mockHours: HourlyForecast[] = [
  {
    time: "2026-05-23T12:00:00",
    temperature: 20,
    apparentTemperature: 20,
    weatherCode: 3,
    precipitation: 0,
    windSpeed: 10,
    cape: 0,
    dewPoint: 8,
    cin: 0,
    liftedIndex: 4,
    windShear: 5,
    confidence: "high"
  },
  // Scenario 1: Onweer onderdrukt door CIN en droog profiel (zonder waarschuwing)
  {
    time: "2026-05-23T14:00:00",
    temperature: 24,
    apparentTemperature: 25,
    weatherCode: 3,
    precipitation: 0,
    windSpeed: 12,
    cape: 1200,
    dewPoint: 16,
    cin: 50, // Lichte deksel
    liftedIndex: -5,
    windShear: 10,
    confidence: "high"
  },
  // Scenario 2: CIN breekt door (onweer geactiveerd door trigger en lage CIN)
  {
    time: "2026-05-23T16:00:00",
    temperature: 26,
    apparentTemperature: 28,
    weatherCode: 95, // WMO code onweer
    precipitation: 2.5,
    windSpeed: 15,
    cape: 1400,
    dewPoint: 17,
    cin: 10, // Lage deksel
    liftedIndex: -6,
    windShear: 8, // Pulse storm
    confidence: "high"
  },
  // Scenario 3: Zware windschering (georganiseerd onweer)
  {
    time: "2026-05-23T18:00:00",
    temperature: 23,
    apparentTemperature: 24,
    weatherCode: 95,
    precipitation: 4.0,
    windSpeed: 20,
    cape: 900,
    dewPoint: 15,
    cin: 0,
    liftedIndex: -4,
    windShear: 40, // Supercell / squall line potentie
    confidence: "high"
  },
  // Scenario 4: Naloop regen (geen onweer)
  {
    time: "2026-05-23T20:00:00",
    temperature: 18,
    apparentTemperature: 18,
    weatherCode: 61,
    precipitation: 1.2,
    windSpeed: 15,
    cape: 10,
    dewPoint: 11,
    cin: 0,
    liftedIndex: 2,
    windShear: 20,
    confidence: "high"
  }
];

const mockWarnings: KNMIWarning[] = [
  {
    province: "Noord-Holland",
    provinceSlug: "noord-holland",
    type: "Onweersbuien",
    severity: "YELLOW",
    description: "Code geel voor onweersbuien.",
    validFrom: "2026-05-23T13:00:00",
    validUntil: "2026-05-23T17:00:00",
    issuedAt: "2026-05-23T10:00:00",
    key: "noord-holland|onweersbuien|yellow|2026-05-23T13:00:00"
  }
];

console.log("=== TEST 1: ZONDER ACTIEVE KNMI-WAARSCHUWING ===");
mockHours.forEach(h => {
  const tChance = getThunderstormChance(h);
  const rChance = getRainChance(h);
  console.log(`[Tijd: ${h.time.split("T")[1]}] CAPE: ${h.cape}, CIN: ${h.cin}, Precip: ${h.precipitation}`);
  console.log(` -> Kans op Onweer: ${tChance}%`);
  console.log(` -> Kans op Regen: ${rChance}%`);
  console.log("-----------------------------------------");
});

console.log("\n=== TEST 2: MET ACTIEVE KNMI-WAARSCHUWING (ONWEER 13:00 - 17:00) ===");
mockHours.forEach(h => {
  const tChance = getThunderstormChance(h, mockWarnings);
  const rChance = getRainChance(h, mockWarnings);
  console.log(`[Tijd: ${h.time.split("T")[1]}] CAPE: ${h.cape}, CIN: ${h.cin}, Precip: ${h.precipitation}`);
  console.log(` -> Kans op Onweer: ${tChance}%`);
  console.log(` -> Kans op Regen: ${rChance}%`);
  console.log("-----------------------------------------");
});

console.log("\n=== UNIT TEST RISICOPERIODES MET ACTIEVE WAARSCHUWING ===");
const periods = groupRiskPeriods(mockHours, mockWarnings);
console.log(JSON.stringify(periods, null, 2));
