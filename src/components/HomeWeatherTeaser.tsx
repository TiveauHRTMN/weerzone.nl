import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData, getWeatherDescription, getWeatherEmoji } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";

function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Compacte, server-gerenderde weerteaser voor de homepage. Toont het actuele weer
 * voor de opgeslagen locatie (of De Bilt) zodat een bezoeker meteen weer ziet en
 * doorklikt naar Vandaag. Faalt de fetch, dan rendert dit niets — de hero blijft heel.
 */
export default async function HomeWeatherTeaser() {
  const saved = await getSavedLocationServer().catch(() => null);
  const location = saved || DUTCH_CITIES.find((city) => city.name === "De Bilt") || DUTCH_CITIES[0];

  const weather = await withDeadline(
    fetchWeatherData(location.lat, location.lon, false, false),
    1500,
    null as WeatherData | null,
  );
  const today = weather?.daily?.[0];
  if (!weather || !today) return null;

  const temp = Math.round(weather.current.temperature);
  const condition = getWeatherDescription(today.weatherCode);
  const emoji = getWeatherEmoji(today.weatherCode, true);
  const dry = today.precipitationSum < 0.2;
  const line = `${condition}${dry ? ", droog" : ""} · ${Math.round(today.tempMin)}° tot ${Math.round(today.tempMax)}°`;

  return (
    <Link
      href="/vandaag"
      aria-label={`Het weer in ${location.name}: ${temp} graden, ${condition}. Bekijk vandaag.`}
      className="group flex w-full max-w-md items-center gap-4 rounded-2xl border border-white/20 bg-slate-950/30 px-5 py-4 text-left backdrop-blur-md transition hover:bg-slate-950/45"
    >
      <span className="text-4xl leading-none" aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-black leading-none text-white">
          {temp}° in {location.name}
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-white/75">{line}</span>
      </span>
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-black text-white/85 transition group-hover:text-white">
        Vandaag <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
