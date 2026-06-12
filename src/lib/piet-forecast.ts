import { unstable_cache } from "next/cache";
import { hermesChat } from "@/lib/hermes";
import { fetchKNMIShortForecast } from "@/lib/knmi-edr";
import type { WeatherData } from "@/lib/types";
import { buildMarianaContext, isMarianaRunStale } from "@/lib/mariana/piet-context";

const WC_LABEL: Record<number, string> = {
  0: "helder", 1: "zonnig", 2: "half bewolkt", 3: "bewolkt",
  45: "mistig", 48: "mistig met rijp",
  51: "lichte motregen", 53: "motregen", 55: "dichte motregen",
  61: "lichte regen", 63: "regen", 65: "zware regen",
  71: "lichte sneeuw", 73: "sneeuw", 75: "zware sneeuw",
  80: "regenbuien", 81: "stevige buien", 82: "zware stortbuien",
  95: "onweer", 96: "onweer met hagel", 99: "zwaar onweer met hagel",
};

function wcLabel(code: number): string {
  return WC_LABEL[code] ?? "wisselend";
}

function dayName(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long" });
}

function weatherToContext(weather: WeatherData, city: string, dayOffset: 0 | 1): string {
  const selected = weather.daily[dayOffset];
  const selectedName = selected ? dayName(selected.date) : dayOffset === 0 ? "vandaag" : "morgen";
  const hourly = weather.hourly
    .filter((hour) => !selected || hour.time.slice(0, 10) === selected.date)
    .filter((_, index) => index % 3 === 0)
    .map((hour) => {
      const time = new Date(hour.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      return `${time}: ${Math.round(hour.temperature)} graden, ${wcLabel(hour.weatherCode)}, ${hour.precipitation} mm regen, wind ${Math.round(hour.windSpeed)} km/u`;
    })
    .join("\n");

  const lines = [
    `Locatie: ${city}. Gekozen dag: ${selectedName}.`,
    `Nu: ${Math.round(weather.current.temperature)} graden, voelt als ${Math.round(weather.current.feelsLike)} graden, ${wcLabel(weather.current.weatherCode)}, wind ${Math.round(weather.current.windSpeed)} km/u, windvlagen ${Math.round(weather.current.windGusts)} km/u.`,
  ];

  weather.daily.slice(0, 2).forEach((day, index) => {
    lines.push(`${index === 0 ? "Vandaag" : "Morgen"}: ${dayName(day.date)}, ${Math.round(day.tempMin)} tot ${Math.round(day.tempMax)} graden, ${wcLabel(day.weatherCode)}, ${day.precipitationSum} mm regen, wind maximaal ${Math.round(day.windSpeedMax)} km/u.`);
  });
  lines.push(`Uurverloop ${selectedName}:\n${hourly}`);
  return lines.join("\n\n");
}

const PIET_SYSTEM = `
Je bent Piet: een nuchtere Nederlandse buurman die het weer goed bijhoudt. Schrijf kort, natuurlijk en praktisch.

REGELS:
- Schrijf 1 of 2 korte alinea's zonder kopjes of opsommingen.
- Beschrijf alleen de gekozen dag en gebruik de concrete dagnaam waar dat helpt.
- Vertaal weerdata naar wat iemand buiten merkt en wanneer dat ertoe doet.
- Gebruik geen meteorologisch jargon, anglicismen, bronvermeldingen, interne modelnamen of emoji.
- Noem geen KNMI, Mariana, DeepSeek of kunstmatige intelligentie.
- Maximaal 120 woorden. Lever alleen de tekst.
`.trim();

async function marianaLocalContext(lat: number, lon: number): Promise<string | null> {
  try {
    const { nearestRegionData } = await import("@/lib/mariana/regions/storage");
    const data = await nearestRegionData(lat, lon).catch(() => null);
    if (!data || isMarianaRunStale(data.runAt)) return null;
    return buildMarianaContext(data.signal, data.feed);
  } catch {
    return null;
  }
}

async function generateDayStory(
  weather: WeatherData,
  city: string,
  point: { lat: number; lon: number },
  dayOffset: 0 | 1,
): Promise<string | null> {
  const [knmiText, marianaContext] = await Promise.all([
    fetchKNMIShortForecast().catch(() => null),
    marianaLocalContext(point.lat, point.lon),
  ]);
  const selectedDay = dayOffset === 0 ? "vandaag" : "morgen";
  const userPrompt = [
    `Schrijf uitsluitend het weerverhaal voor ${selectedDay}.`,
    knmiText ? `Landelijke verwachting als feitelijke basis:\n${knmiText}` : null,
    `Lokale data voor ${city}:\n${weatherToContext(weather, city, dayOffset)}`,
    marianaContext ? `Aanvullende lokale duiding, zonder interne termen over te nemen:\n${marianaContext}` : null,
  ].filter(Boolean).join("\n\n");

  try {
    const text = await hermesChat(
      [{ role: "system", content: PIET_SYSTEM }, { role: "user", content: userPrompt }],
      { model: "personaPro", temperature: 0.58, maxTokens: 240, nlGuard: true },
    );
    return text.trim() || null;
  } catch {
    return null;
  }
}

export function fetchPietDayStory(
  lat: number,
  lon: number,
  city: string,
  weather: WeatherData,
  dayOffset: 0 | 1,
): Promise<string | null> {
  const latKey = String(Math.round(lat * 10));
  const lonKey = String(Math.round(lon * 10));
  const dateKey = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  return unstable_cache(
    () => generateDayStory(weather, city, { lat, lon }, dayOffset),
    ["piet-dagverhaal", latKey, lonKey, dateKey, String(dayOffset)],
    { revalidate: 1800, tags: ["piet-weerbericht"] },
  )();
}

export function fetchPietWeerbericht(
  lat: number,
  lon: number,
  city: string,
  weather: WeatherData,
): Promise<string | null> {
  return fetchPietDayStory(lat, lon, city, weather, 0);
}
