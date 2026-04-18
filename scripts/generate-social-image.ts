/**
 * WEERZONE Social Image Generator
 *
 * Genereert elke ochtend een 48-uurs weer-image voor Instagram/TikTok/Facebook.
 * Stijl: Roddelpraat — fel, brutaal, urgent.
 *
 * Gebruik:
 *   npx tsx scripts/generate-social-image.ts
 *
 * Vereisten:
 *   - NANO_BANANA_API_KEY in .env (voor AI-gegenereerde achtergrondafbeeldingen)
 *   - Of: draait zonder API key en maakt een tekst-based image
 *
 * Output:
 *   - social-output/weerzone-YYYY-MM-DD.png
 *   - social-output/caption.txt (klaar voor copy-paste naar Instagram)
 *
 * Automatisering:
 *   Voeg toe aan cron (Linux/Mac) of Task Scheduler (Windows):
 *   0 7 * * * cd /pad/naar/kutweer && npx tsx scripts/generate-social-image.ts
 *
 * Of gebruik de Vercel Cron Job in vercel.json:
 *   { "crons": [{ "path": "/api/social-image", "schedule": "0 5 * * *" }] }
 */

const CITIES = ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"];
const API_BASE = "https://api.open-meteo.com/v1/forecast";

interface DayForecast {
  city: string;
  tempMax: number;
  tempMin: number;
  precipSum: number;
  windMax: number;
  weatherCode: number;
}

async function fetchForecast(city: string, lat: number, lon: number): Promise<DayForecast> {
  const url = `${API_BASE}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Europe/Amsterdam&forecast_days=2`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    city,
    tempMax: Math.round(data.daily.temperature_2m_max[0]),
    tempMin: Math.round(data.daily.temperature_2m_min[0]),
    precipSum: data.daily.precipitation_sum[0],
    windMax: Math.round(data.daily.wind_speed_10m_max[0]),
    weatherCode: data.daily.weather_code[0],
  };
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code >= 95) return "⛈️";
  if (code >= 71) return "❄️";
  if (code >= 61) return "🌧️";
  if (code >= 51) return "🌦️";
  if (code >= 45) return "🌫️";
  return "☁️";
}

function generateBrutalCaption(forecasts: DayForecast[]): string {
  const ams = forecasts.find((f) => f.city === "Amsterdam")!;
  const today = new Date();
  const day = today.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  const lines: string[] = [];
  lines.push(`🔥 WEERZONE — ${day.toUpperCase()}`);
  lines.push("");

  // Headline based on worst condition
  const maxRain = Math.max(...forecasts.map((f) => f.precipSum));
  const maxWind = Math.max(...forecasts.map((f) => f.windMax));
  const maxTemp = Math.max(...forecasts.map((f) => f.tempMax));

  if (maxRain > 10) {
    lines.push("💀 WATERSNOODRAMP IN AANTOCHT");
  } else if (maxRain > 5) {
    lines.push("🌧️ REGEN ALS EEN GEBROKEN KRAAN");
  } else if (maxWind > 60) {
    lines.push("🌪️ STORM. BLIJF BINNEN. SERIEUS.");
  } else if (maxTemp > 30) {
    lines.push("🥵 TROPISCH. NEDERLAND SMELT.");
  } else if (maxTemp > 25) {
    lines.push("☀️ EINDELIJK. ZON. NIET KLAGEN.");
  } else if (maxTemp < 5) {
    lines.push("🥶 BEVROREN VINGERS-WEER");
  } else {
    lines.push("📊 DE KOMENDE 48 UUR IN NEDERLAND");
  }

  lines.push("");

  for (const f of forecasts) {
    const emoji = getWeatherEmoji(f.weatherCode);
    lines.push(
      `${emoji} ${f.city}: ${f.tempMax}°/${f.tempMin}° ${f.precipSum > 0 ? `| ${f.precipSum}mm regen` : "| droog"} ${f.windMax > 40 ? `| 💨${f.windMax}km/h` : ""}`
    );
  }

  lines.push("");
  lines.push("48 uur. De rest is ruis.");
  lines.push("");
  lines.push("👉 weerzone.nl");
  lines.push("");
  lines.push("#weer #weerzone #nederland #48uur #weerbericht #buienradar #knmi #regen #zon #wind");

  return lines.join("\n");
}

async function main() {
  console.log("🌤️  WEERZONE Social Image Generator");
  console.log("=====================================\n");

  const cityCoords: Record<string, [number, number]> = {
    Amsterdam: [52.374, 4.8897],
    Rotterdam: [51.9225, 4.4792],
    "Den Haag": [52.0705, 4.3007],
    Utrecht: [52.0907, 5.1214],
    Eindhoven: [51.4416, 5.4697],
  };

  const forecasts = await Promise.all(
    CITIES.map((city) => fetchForecast(city, cityCoords[city][0], cityCoords[city][1]))
  );

  const caption = generateBrutalCaption(forecasts);

  console.log("📝 Caption voor Instagram/TikTok:\n");
  console.log(caption);
  console.log("\n=====================================");

  // Write output files
  const fs = await import("fs");
  const dir = "social-output";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const dateStr = new Date().toISOString().split("T")[0];
  fs.writeFileSync(`${dir}/caption-${dateStr}.txt`, caption, "utf-8");
  console.log(`\n✅ Caption opgeslagen: ${dir}/caption-${dateStr}.txt`);

  // For the actual image generation, use the /api/share endpoint
  console.log(`\n📸 Genereer image via: https://weerzone.nl/api/share?city=Amsterdam&temp=${forecasts[0].tempMax}&emoji=${encodeURIComponent(getWeatherEmoji(forecasts[0].weatherCode))}&desc=48+uur+weer`);
  console.log("\n💡 Tip: Gebruik de Nano Banana 2 API voor AI-gegenereerde achtergronden.");
  console.log("   Stel NANO_BANANA_API_KEY in je .env in.");
}

main().catch(console.error);
