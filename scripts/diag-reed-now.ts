import { reedExpertReading } from "../src/lib/reed-expert-reading";
import type { HourlyForecast } from "../src/lib/types";

// De Bilt
const lat = 52.1009, lon = 5.1779;
const tz = "Europe/Amsterdam";

function shear(d: any, i: number): number | undefined {
  const s10 = d.wind_speed_10m?.[i], s80 = d.wind_speed_80m?.[i];
  if (s10 == null || s80 == null) return undefined;
  return Math.abs(s80 - s10);
}

async function main() {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    hourly: ["cape", "dew_point_2m", "convective_inhibition", "lifted_index", "wind_speed_10m", "wind_speed_80m"].join(","),
    timezone: tz, forecast_days: "2",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const json: any = await res.json();
  const h = json.hourly;
  const today = h.time[0].slice(0, 10);

  const hours: HourlyForecast[] = h.time.map((time: string, i: number) => ({
    time, temperature: 0, weatherCode: 0, precipitation: 0,
    windSpeed: Math.round(h.wind_speed_10m?.[i] ?? 0),
    cape: Math.round(h.cape?.[i] ?? 0),
    cin: h.convective_inhibition?.[i] == null ? undefined : Math.round(h.convective_inhibition[i]),
    dewPoint: h.dew_point_2m?.[i] ?? undefined,
    liftedIndex: h.lifted_index?.[i] ?? undefined,
    windShear: shear(h, i),
  })) as unknown as HourlyForecast[];

  const dayHours = hours.filter((x) => x.time.slice(0, 10) === today);
  const nowHour = new Date().getHours();
  const nowRow = dayHours.find((x) => new Date(x.time).getHours() === nowHour) ?? dayHours[0];

  console.log("=== NU (De Bilt,", today, nowHour + "u) ===");
  console.log("CAPE:", nowRow.cape, "| CIN:", nowRow.cin, "| LI:", nowRow.liftedIndex, "| shear:", nowRow.windShear, "| dauwpunt:", nowRow.dewPoint);

  console.log("\n=== CAPE per uur (vandaag) ===");
  console.log(dayHours.map((x) => `${new Date(x.time).getHours()}u:${x.cape}`).join(" "));
  console.log("=== CIN per uur (vandaag) ===");
  console.log(dayHours.map((x) => `${new Date(x.time).getHours()}u:${x.cin}`).join(" "));
  console.log("=== LI per uur (vandaag) ===");
  console.log(dayHours.map((x) => `${new Date(x.time).getHours()}u:${x.liftedIndex}`).join(" "));

  const reading = reedExpertReading(dayHours, "vandaag");
  console.log("\n=== REED READING ===");
  console.log("verdict:", reading.verdict);
  console.log("headline:", reading.headline);
  console.log("moments:", JSON.stringify(reading.moments, null, 2));
  console.log("CAPE-laag phrase:", reading.layers.find((l) => l.key === "cape")?.phrase, "| severity:", reading.layers.find((l) => l.key === "cape")?.severity);
}

main();
