"use client";

import type { WeatherData } from "@/lib/types";

interface Props {
  weather: WeatherData;
}

function buildTip(weather: WeatherData): string | null {
  const current = weather.current;
  const nextSixHours = weather.hourly.slice(0, 6);
  const rainSoon = nextSixHours.reduce((total, hour) => total + hour.precipitation, 0);
  const strongestWind = Math.max(current.windSpeed, ...nextSixHours.map((hour) => hour.windSpeed));

  if (current.precipitation > 0.3 || rainSoon > 1) {
    return "Piet: neem het droge moment serieus. Check het komende uur voordat je vertrekt.";
  }
  if (strongestWind > 45) {
    return "Piet: reken op stevige wind. Plan fietsen of buitenwerk liever met wat marge.";
  }
  if (current.temperature >= 25) {
    return "Piet: het warmste deel zit later op de dag. Vroeg op pad is slimmer.";
  }
  if (current.temperature <= 2) {
    return "Piet: kans op kou aan de grond. Vertrek iets rustiger en check gladheid lokaal.";
  }
  return null;
}

export default function PietInlineTip({ weather }: Props) {
  const tip = buildTip(weather);
  if (!tip) return null;

  return (
    <p className="relative z-10 mb-3 text-[13px] font-semibold leading-snug text-text-secondary">
      {tip}
    </p>
  );
}
