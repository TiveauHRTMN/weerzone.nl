"use client";

import { useEffect } from "react";
import type { City, WeatherData } from "@/lib/types";
import type { Locale } from "@/config/locales";
import { getKarlWeatherVerdict, getLucWeatherVerdict, getJuanWeatherVerdict } from "@/app/actions";

type PersonaNarrativeLoaderProps = {
  city: City;
  weather: WeatherData;
  locale: Locale;
  initialNarrative?: string | null;
  onNarrative: (value: string | null) => void;
};

export default function PersonaNarrativeLoader({
  city,
  weather,
  locale,
  initialNarrative,
  onNarrative,
}: PersonaNarrativeLoaderProps) {
  useEffect(() => {
    let cancelled = false;

    if (initialNarrative) {
      onNarrative(initialNarrative);
      return () => {
        cancelled = true;
      };
    }

    const contextCity = city as City & { character?: string; province?: string };
    const verdictPromise = locale === "de"
      ? getKarlWeatherVerdict(weather, city.name, "Deutschland")
      : locale === "fr"
        ? getLucWeatherVerdict(weather, city.name, contextCity.province || "France", contextCity.character)
        : getJuanWeatherVerdict(weather, city.name, contextCity.province || "Espana", contextCity.character);

    verdictPromise
      .then((text) => {
        if (!cancelled) onNarrative(text);
      })
      .catch(() => {
        if (!cancelled) onNarrative(null);
      });

    return () => {
      cancelled = true;
    };
  }, [city, initialNarrative, locale, onNarrative, weather]);

  return null;
}
