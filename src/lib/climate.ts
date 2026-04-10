// Klimaatgemiddelden Nederland (KNMI, station De Bilt, 1991-2020)
// Bron: https://www.knmi.nl/nederland-nu/klimatologie/maandoverzichten

interface MonthlyClimate {
  avgTemp: number;      // gemiddelde temperatuur °C
  avgTempMax: number;   // gemiddelde max °C
  avgTempMin: number;   // gemiddelde min °C
  avgPrecipitation: number; // gemiddelde neerslag mm/maand
  avgRainDays: number;  // gemiddelde regendagen
  avgSunHours: number;  // gemiddelde zonuren
  avgWindSpeed: number; // gemiddelde windsnelheid km/h
}

// Index 0 = januari, 11 = december
const MONTHLY_NORMALS: MonthlyClimate[] = [
  { avgTemp: 3.4,  avgTempMax: 5.9,  avgTempMin: 0.8,  avgPrecipitation: 73, avgRainDays: 18, avgSunHours: 62,  avgWindSpeed: 22 },  // jan
  { avgTemp: 3.7,  avgTempMax: 6.8,  avgTempMin: 0.5,  avgPrecipitation: 59, avgRainDays: 15, avgSunHours: 88,  avgWindSpeed: 21 },  // feb
  { avgTemp: 6.4,  avgTempMax: 10.3, avgTempMin: 2.5,  avgPrecipitation: 58, avgRainDays: 15, avgSunHours: 133, avgWindSpeed: 20 },  // mrt
  { avgTemp: 9.7,  avgTempMax: 14.4, avgTempMin: 4.9,  avgPrecipitation: 43, avgRainDays: 12, avgSunHours: 186, avgWindSpeed: 18 },  // apr
  { avgTemp: 13.4, avgTempMax: 18.1, avgTempMin: 8.6,  avgPrecipitation: 60, avgRainDays: 13, avgSunHours: 211, avgWindSpeed: 16 },  // mei
  { avgTemp: 16.1, avgTempMax: 20.7, avgTempMin: 11.4, avgPrecipitation: 66, avgRainDays: 13, avgSunHours: 204, avgWindSpeed: 15 },  // jun
  { avgTemp: 18.4, avgTempMax: 23.0, avgTempMin: 13.7, avgPrecipitation: 81, avgRainDays: 13, avgSunHours: 216, avgWindSpeed: 15 },  // jul
  { avgTemp: 18.0, avgTempMax: 22.7, avgTempMin: 13.2, avgPrecipitation: 78, avgRainDays: 13, avgSunHours: 195, avgWindSpeed: 14 },  // aug
  { avgTemp: 14.8, avgTempMax: 19.1, avgTempMin: 10.5, avgPrecipitation: 78, avgRainDays: 14, avgSunHours: 148, avgWindSpeed: 16 },  // sep
  { avgTemp: 10.8, avgTempMax: 14.3, avgTempMin: 7.3,  avgPrecipitation: 82, avgRainDays: 16, avgSunHours: 107, avgWindSpeed: 19 },  // okt
  { avgTemp: 7.0,  avgTempMax: 9.9,  avgTempMin: 4.1,  avgPrecipitation: 79, avgRainDays: 18, avgSunHours: 63,  avgWindSpeed: 20 },  // nov
  { avgTemp: 3.9,  avgTempMax: 6.4,  avgTempMin: 1.4,  avgPrecipitation: 80, avgRainDays: 18, avgSunHours: 52,  avgWindSpeed: 21 },  // dec
];

export function getClimateNormal(month: number): MonthlyClimate {
  return MONTHLY_NORMALS[Math.max(0, Math.min(11, month))];
}

export function getTemperatureComparison(currentTemp: number, month: number): {
  diff: number;
  label: string;
  emoji: string;
} {
  const normal = MONTHLY_NORMALS[Math.max(0, Math.min(11, month))];
  const diff = Math.round((currentTemp - normal.avgTemp) * 10) / 10;
  const absDiff = Math.abs(diff);

  if (absDiff < 1) {
    return { diff, label: "Normaal voor deze tijd van het jaar", emoji: "📊" };
  } else if (diff > 0) {
    if (absDiff >= 8) return { diff, label: `${absDiff}° warmer dan normaal. Extreem.`, emoji: "🔥" };
    if (absDiff >= 5) return { diff, label: `${absDiff}° warmer dan normaal. Opvallend zacht.`, emoji: "🌡️" };
    if (absDiff >= 3) return { diff, label: `${absDiff}° warmer dan gemiddeld in ${getMonthName(month)}`, emoji: "📈" };
    return { diff, label: `${absDiff}° boven het gemiddelde van ${getMonthName(month)}`, emoji: "📈" };
  } else {
    if (absDiff >= 8) return { diff, label: `${absDiff}° kouder dan normaal. Historisch koud.`, emoji: "🥶" };
    if (absDiff >= 5) return { diff, label: `${absDiff}° kouder dan normaal. Opvallend fris.`, emoji: "❄️" };
    if (absDiff >= 3) return { diff, label: `${absDiff}° onder het gemiddelde van ${getMonthName(month)}`, emoji: "📉" };
    return { diff, label: `${absDiff}° onder het gemiddelde van ${getMonthName(month)}`, emoji: "📉" };
  }
}

export function getPrecipitationComparison(dailyPrecipMm: number, month: number): string {
  const normal = MONTHLY_NORMALS[Math.max(0, Math.min(11, month))];
  const dailyAvg = normal.avgPrecipitation / 30;
  if (dailyPrecipMm < 0.1) return "Droog — minder dan normaal voor deze maand";
  if (dailyPrecipMm > dailyAvg * 3) return "Ruim boven de dagelijkse norm qua neerslag";
  if (dailyPrecipMm > dailyAvg * 1.5) return "Meer regen dan gemiddeld";
  return "Normale hoeveelheid neerslag";
}

function getMonthName(month: number): string {
  const names = ["januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"];
  return names[Math.max(0, Math.min(11, month))];
}
