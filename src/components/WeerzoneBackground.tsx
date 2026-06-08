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

/** Zelfde WMO→kleur-thema als WeatherBackground (hier puur, server-side). */
function weatherTheme(code: number, isDay: boolean): { bg1: string; bg2: string } {
  if (code === 200) return { bg1: "#9c8c7c", bg2: "#bba898" };
  if (code === 201) return { bg1: "#d99c4a", bg2: "#f0c890" };
  if (!isDay) {
    if (code === 0) return { bg1: "#0b1026", bg2: "#162050" };
    if (code === 1) return { bg1: "#0d1530", bg2: "#1a2658" };
    if (code >= 95) return { bg1: "#10141e", bg2: "#1e2438" };
    return { bg1: "#0f1828", bg2: "#1e3048" };
  }
  if (code === 0) return { bg1: "#3a9ae8", bg2: "#7ec4f6" };
  if (code === 1) return { bg1: "#4ca0e0", bg2: "#86c2ec" };
  if (code === 2) return { bg1: "#5aa8e0", bg2: "#94c8ec" };
  if (code === 3) return { bg1: "#7898ae", bg2: "#a0b8c8" };
  if (code <= 48) return { bg1: "#8898a5", bg2: "#b0bec5" };
  if (code <= 57) return { bg1: "#607888", bg2: "#8098a8" };
  if (code <= 67) return { bg1: "#4a6474", bg2: "#6a8898" };
  if (code <= 77) return { bg1: "#a8b8c8", bg2: "#ccd8e2" };
  if (code <= 82) return { bg1: "#455868", bg2: "#607888" };
  if (code <= 86) return { bg1: "#98aab8", bg2: "#bcc8d4" };
  if (code >= 95) return { bg1: "#2a3444", bg2: "#3e4e60" };
  return { bg1: "#5a98c8", bg2: "#88b8dc" };
}

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
