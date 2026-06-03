import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import ReedWarningsPage from "@/components/ReedWarningsPage";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES, type WeatherData } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { nearestProvinceSlug, PROVINCE_SLUG_TO_KNMI } from "@/lib/knmi-warnings";
import { buildReedView } from "@/lib/reed-view";
import { hreflangCluster } from "@/lib/hreflang";
import "./reed-skin.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

function buildCalmFallbackWeather(now = new Date()): WeatherData {
  const isoDay = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const today = isoDay(0);
  const tomorrow = isoDay(1);
  const hourly = [today, tomorrow].flatMap((date) =>
    Array.from({ length: 24 }, (_, h) => ({
      time: `${date}T${String(h).padStart(2, "0")}:00`,
      temperature: 18,
      apparentTemperature: 18,
      weatherCode: 3,
      precipitation: 0,
      windSpeed: 15,
      cape: 0,
      confidence: "medium" as const,
    })),
  );

  return {
    current: {
      temperature: 18,
      feelsLike: 18,
      humidity: 65,
      windSpeed: 15,
      windDirection: "ZW",
      windGusts: 20,
      precipitation: 0,
      weatherCode: 3,
      isDay: true,
      cloudCover: 60,
    },
    minutely: [],
    hourly,
    daily: [
      { date: today, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 5 },
      { date: tomorrow, tempMax: 20, tempMin: 12, weatherCode: 3, precipitationSum: 0, windSpeedMax: 20, sunHours: 5 },
    ],
    sunrise: `${today}T05:30`,
    sunset: `${today}T21:45`,
    uvIndex: 4,
    models: { agreement: 80, label: "Rustig", sources: ["fallback"] },
  };
}

export const metadata: Metadata = {
  title: "Reed's Extremen - onweer en stormrisico",
  description:
    "Reed let op onweer, storm en zware regen voor jouw plek. Alleen als er echt iets op komst is.",
  alternates: {
    canonical: "https://weerzone.nl/reed",
    languages: hreflangCluster({
      nl: "/reed",
    }),
  },
  openGraph: {
    title: "Reed's Extremen | WEERZONE",
    description:
      "Onweer, storm en zware regen voor jouw plek, zonder ruis.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/reed",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reed's Extremen",
    description:
      "Onweer, storm en zware regen voor jouw plek, zonder ruis.",
  },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc =
    loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];
  const provinceSlug = await nearestProvinceSlug(activeLoc.lat, activeLoc.lon);

  // Background is dynamisch op basis van het lokale weer (zelfde bron als /weer).
  const liveWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon, false, true).catch(
    () => null,
  );
  const weather = liveWeather ?? buildCalmFallbackWeather();

  const view = buildReedView({
    weather,
    locationName: activeLoc.name,
    provinceLabel: provinceSlug ? PROVINCE_SLUG_TO_KNMI[provinceSlug] : null,
    knmi: [],
  });

  return (
    <ReedWarningsPage
      view={view}
      fontClassName={manrope.className}
      weatherCode={weather.current.weatherCode}
      isDay={weather.current.isDay}
      lat={activeLoc.lat}
      lon={activeLoc.lon}
    />
  );
}
