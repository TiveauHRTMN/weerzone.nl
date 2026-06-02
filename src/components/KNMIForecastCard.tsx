"use client";

import { useEffect, useState } from "react";
import type { WeatherData } from "@/lib/types";

interface Props {
  lat: number;
  lon: number;
  city: string;
  initialWeather?: WeatherData;
  variant?: "compact" | "full";
}

const WC_LABEL: Record<number, string> = {
  0: "zonnig",
  1: "vrij zonnig",
  2: "half bewolkt",
  3: "bewolkt",
  45: "mistig",
  48: "mistig met rijp",
  51: "lichte motregen",
  53: "motregen",
  55: "stevige motregen",
  61: "lichte regen",
  63: "regen",
  65: "stevige regen",
  71: "lichte sneeuw",
  73: "sneeuw",
  75: "stevige sneeuw",
  80: "buien",
  81: "stevige buien",
  82: "zware buien",
  95: "onweer",
  96: "onweer met hagel",
  99: "zwaar onweer met hagel",
};

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

function dayName(offset = 0) {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
  date.setDate(date.getDate() + offset);
  return DAYS[date.getDay()];
}

function dayPart() {
  const hour = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })).getHours();
  if (hour < 6) return "nacht";
  if (hour < 12) return "ochtend";
  if (hour < 18) return "middag";
  return "avond";
}

function label(code?: number) {
  return WC_LABEL[Number(code)] ?? "wisselvallig";
}

function quickForecast(weather: WeatherData | undefined, city: string) {
  if (!weather) return null;
  const current = weather.current;
  const today = weather.daily?.[0];
  const tomorrow = weather.daily?.[1];
  const todayName = dayName(0);
  const tomorrowName = dayName(1);
  const part = dayPart();
  const temp = Math.round(current.temperature);
  const wind = Math.round(current.windSpeed);
  const gusts = Math.round(current.windGusts || current.windSpeed);
  const rain = Number(current.precipitation || 0);
  const todayRain = Number(today?.precipitationSum || rain || 0);
  const weatherText = label(current.weatherCode);
  const windText = wind >= 35 ? "met een stevige wind" : wind >= 20 ? "met een matige wind" : "met weinig wind";
  const rainText = todayRain >= 5
    ? "Reken op natte momenten; dit is geen dag om ver van een jas weg te lopen."
    : todayRain >= 1
      ? "Er kan af en toe een bui vallen, maar tussendoor zitten ook drogere stukken."
      : "Het blijft op veel momenten droog, met hooguit wat lokaal gespetter.";

  const tomorrowText = tomorrow
    ? ` ${tomorrowName.charAt(0).toUpperCase() + tomorrowName.slice(1)} blijft het rond ${Math.round(tomorrow.tempMax)} graden met ${label(tomorrow.weatherCode)}.`
    : "";

  return `${todayName.charAt(0).toUpperCase() + todayName.slice(1)}${part} is het in ${city} ${weatherText} en ongeveer ${temp} graden, ${windText}. ${rainText} De windvlagen lopen op tot rond ${gusts} km/u, dus het voelt soms frisser dan de thermometer doet vermoeden.${tomorrowText}`;
}

function compactForecast(text: string): string {
  const firstParagraph = text.split(/\n+/).map(p => p.trim()).find(Boolean) ?? text.trim();
  if (firstParagraph.length <= 360) return firstParagraph;
  const clipped = firstParagraph.slice(0, 360);
  const sentenceEnd = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("! "), clipped.lastIndexOf("? "));
  return `${(sentenceEnd > 180 ? clipped.slice(0, sentenceEnd + 1) : clipped).trim()}...`;
}

export default function KNMIForecastCard({ lat, lon, city, initialWeather, variant = "full" }: Props) {
  const initialForecast = quickForecast(initialWeather, city);
  const [forecast, setForecast] = useState<string | null>(initialForecast);
  const [loading, setLoading] = useState(!initialForecast);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);

    fetch(`/api/piet-weerbericht?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`, {
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (typeof d === "string" && d.trim()) {
          setForecast(d);
          setEnhanced(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lat, lon, city]);

  if (loading) {
    return (
      <div className="card p-5 sm:p-6 animate-pulse">
        <div className="h-3 w-32 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="h-3 w-4/6 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const paragraphs = variant === "compact"
    ? [compactForecast(forecast)]
    : forecast.split(/\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
          Piet Weerbericht
        </span>
      </div>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
        ))}
      </div>
      <p className="text-[9px] text-slate-400 mt-4">
        Gebaseerd op KNMI, Mariana en lokale data · {enhanced ? (variant === "compact" ? "beknopte versie" : "uitgebreide versie") : "snelle versie"} · elke 30 minuten bijgewerkt
      </p>
    </div>
  );
}
