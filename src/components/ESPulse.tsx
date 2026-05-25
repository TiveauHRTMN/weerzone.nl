"use client";

import { useEffect, useState } from "react";
import { getESStationsWeather } from "@/app/actions";
import PulseTicker, { type PulseStation } from "@/components/PulseTicker";

function weatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 57) return "🌧️";
  if (code <= 65) return "🌧️";
  if (code <= 67) return "🧊";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export default function ESPulse() {
  const [stations, setStations] = useState<PulseStation[]>([]);

  useEffect(() => {
    const load = () => {
      getESStationsWeather().then((data) => {
        setStations([...data].sort((a, b) => a.name.localeCompare(b.name, "es")));
      });
    };
    load();
    const interval = setInterval(load, 10 * 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PulseTicker
      items={stations}
      label="En directo"
      emoji={weatherEmoji}
      shellStyle={{ borderColor: "var(--wz-border)", background: "var(--ink-050)" }}
      labelStyle={{ background: "linear-gradient(to right, var(--ink-050) 80%, transparent)", pointerEvents: "none" }}
      rightFadeStyle={{ background: "linear-gradient(to left, var(--ink-050), transparent)" }}
      hotThreshold={26}
    />
  );
}
