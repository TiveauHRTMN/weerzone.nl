/**
 * Universele Weerzone-achtergrond voor pagina's zonder eigen weerdata
 * (/mijn-weerzone, /steve, /over, /contact, ...). Nu weer-gestuurd: leest de
 * opgeslagen locatie en toont de gradient die hoort bij het ACTUELE weer daar
 * (conditie + dag/nacht), zelfde kleurthema als WeatherBackground. Lichtgewicht
 * (alleen de gradient, geen animatie) zodat info-/accountpagina's snel blijven.
 *
 * Async server component — geen "use client". Gebruikt cookies (saved location)
 * dus consumerende pagina's renderen per-request.
 */

import { getSavedLocationServer } from "@/lib/location-cookies";
import { fetchWeatherData } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";
import { weatherTheme } from "@/lib/weather-theme";

export default async function WeerzoneBackground() {
  const loc = await getSavedLocationServer().catch(() => null);
  const active = loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];
  const weather = await fetchWeatherData(active.lat, active.lon).catch(() => null);
  const code = weather?.current.weatherCode ?? 2;
  const isDay = weather?.current.isDay ?? true;
  const t = weatherTheme(code, isDay);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: `linear-gradient(170deg, ${t.bg1} 0%, ${t.bg2} 100%)` }}
      aria-hidden
    />
  );
}
