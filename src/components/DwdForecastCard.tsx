"use client";

import { useEffect, useState } from "react";
import type { WeatherData } from "@/lib/types";

interface Props {
  lat: number;
  lon: number;
  city: string;
  initialWeather?: WeatherData;
  locale?: "de" | "fr";
}

const WC_LABEL_DE: Record<number, string> = {
  0: "sonnig",
  1: "überwiegend sonnig",
  2: "leicht bewölkt",
  3: "bewölkt",
  45: "neblig",
  48: "neblig mit Reif",
  51: "leichter Nieselregen",
  53: "Nieselregen",
  55: "dichter Nieselregen",
  61: "leichter Regen",
  63: "Regen",
  65: "starker Regen",
  71: "leichter Schneefall",
  73: "Schneefall",
  75: "starker Schneefall",
  80: "Schauer",
  81: "kräftige Schauer",
  82: "heftige Schauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "schweres Gewitter mit Hagel",
};

const WC_LABEL_FR: Record<number, string> = {
  0: "ensoleillé",
  1: "principalement ensoleillé",
  2: "partiellement nuageux",
  3: "nuageux",
  45: "brouillard",
  48: "brouillard givrant",
  51: "légère bruine",
  53: "bruine",
  55: "forte bruine",
  61: "légère pluie",
  63: "pluie",
  65: "forte pluie",
  71: "légères chutes de neige",
  73: "chutes de neige",
  75: "fortes chutes de neige",
  80: "averses",
  81: "fortes averses",
  82: "violentes averses",
  95: "orage",
  96: "orage avec grêle",
  99: "orage violent avec grêle",
};

const TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function dayName(offset = 0, locale = "de") {
  const isFR = locale === "fr";
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: isFR ? "Europe/Paris" : "Europe/Berlin" }));
  date.setDate(date.getDate() + offset);
  return isFR ? JOURS[date.getDay()] : TAGE[date.getDay()];
}

function dayPart(locale = "de") {
  const isFR = locale === "fr";
  const hour = new Date(new Date().toLocaleString("en-US", { timeZone: isFR ? "Europe/Paris" : "Europe/Berlin" })).getHours();
  if (locale === "fr") {
    if (hour < 6) return " soir";
    if (hour < 12) return " matin";
    if (hour < 18) return " après-midi";
    return " soir";
  }
  if (hour < 6) return "nacht";
  if (hour < 12) return "morgen";
  if (hour < 18) return "nachmittag";
  return "abend";
}

function label(code?: number, locale = "de") {
  const labels = locale === "fr" ? WC_LABEL_FR : WC_LABEL_DE;
  return labels[Number(code)] ?? (locale === "fr" ? "variable" : "wechselhaft");
}

function quickForecast(weather: WeatherData | undefined, city: string, locale = "de") {
  if (!weather) return null;
  const isFR = locale === "fr";
  const current = weather.current;
  const today = weather.daily?.[0];
  const tomorrow = weather.daily?.[1];
  const heute = dayName(0, locale);
  const morgenName = dayName(1, locale);
  const part = dayPart(locale);
  const temp = Math.round(current.temperature);
  const wind = Math.round(current.windSpeed);
  const gusts = Math.round(current.windGusts || current.windSpeed);
  const todayRain = Number(today?.precipitationSum || current.precipitation || 0);
  const weatherText = label(current.weatherCode, locale);

  if (isFR) {
    const windText = wind >= 35 ? "avec un vent fort" : wind >= 20 ? "avec un vent modéré" : "avec peu de vent";
    const rainText = todayRain >= 5
      ? "Prévoyez des passages pluvieux ; ce n'est pas le jour pour oublier votre veste."
      : todayRain >= 1
        ? "Quelques averses sont possibles, entrecoupées de périodes sèches."
        : "Le temps restera principalement sec, avec tout au plus quelques gouttes locales.";

    const tomorrowText = tomorrow
      ? ` ${morgenName.charAt(0).toUpperCase() + morgenName.slice(1)}, il fera environ ${Math.round(tomorrow.tempMax)} degrés avec un temps ${label(tomorrow.weatherCode, locale)}.`
      : "";

    return `Ce ${heute}${part}, il fait ${weatherText} à ${city} avec environ ${temp} degrés, ${windText}. ${rainText} Les rafales peuvent atteindre ${gusts} km/h, le ressenti est donc parfois plus frais que ce qu'indique le thermomètre.${tomorrowText}`;
  }

  const windText = wind >= 35 ? "mit kräftigem Wind" : wind >= 20 ? "mit mäßigem Wind" : "mit wenig Wind";
  const rainText = todayRain >= 5
    ? "Rechne mit nassen Phasen; das ist kein Tag, um weit von einer Jacke entfernt zu sein."
    : todayRain >= 1
      ? "Ab und zu kann ein Schauer fallen, dazwischen gibt es auch trockene Abschnitte."
      : "Es bleibt überwiegend trocken, höchstens mit etwas lokalem Spritzer.";

  const tomorrowText = tomorrow
    ? ` ${morgenName} bleibt es um die ${Math.round(tomorrow.tempMax)} Grad mit ${label(tomorrow.weatherCode, locale)}.`
    : "";

  return `${heute.charAt(0).toUpperCase() + heute.slice(1)}${part} ist es in ${city} ${weatherText} und etwa ${temp} Grad, ${windText}. ${rainText} Die Windböen erreichen bis zu ${gusts} km/h, also fühlt es sich manchmal frischer an, als das Thermometer vermuten lässt.${tomorrowText}`;
}

export default function DwdForecastCard({ lat, lon, city, initialWeather, locale = "de" }: Props) {
  const isFR = locale === "fr";
  const initialForecast = quickForecast(initialWeather, city, locale);
  const [forecast, setForecast] = useState<string | null>(initialForecast);
  const [loading, setLoading] = useState(!initialForecast);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);

    const apiRoute = isFR ? "/api/luc-bulletin" : "/api/karl-wetterbericht";

    fetch(`${apiRoute}?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
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
  }, [lat, lon, city, isFR]);

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

  const paragraphs = forecast.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  const sourceLabel = isFR ? "Météo-France" : "DWD";
  const personaName = isFR ? "Luc" : "Karl";
  const bulletinLabel = isFR ? "Bulletin météo" : "Wetterbericht";

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
          {personaName} · {bulletinLabel}
        </span>
      </div>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
        ))}
      </div>
      <p className="text-[9px] text-slate-400 mt-4">
        {isFR 
          ? `Basé sur les prévisions ${sourceLabel} · ${enhanced ? "Version IA chargée" : "Version rapide"} · mis à jour toutes les 30 minutes`
          : `Basiert auf ${sourceLabel}-Wetterbericht · ${enhanced ? "KI-Version geladen" : "Schnellversion"} · alle 30 Minuten aktualisiert`
        }
      </p>
    </div>
  );
}
