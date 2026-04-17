"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, RefreshCw } from "lucide-react";
import { getWeather } from "@/app/actions";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData } from "@/lib/types";
import { getWeatherEmoji, getWeatherDescription } from "@/lib/weather";
import { getMainCommentary } from "@/lib/commentary";

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.name && typeof p.lat === "number" && typeof p.lon === "number") {
        return { name: p.name, lat: p.lat, lon: p.lon };
      }
    }
  } catch {}
  return null;
}

export default function PietExtended() {
  const [city, setCity] = useState<City>(
    () => getSavedCity() || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0]
  );
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWeather(city.lat, city.lon)
      .then((w) => {
        if (!cancelled) {
          setWeather(w);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [city]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisional: City = { name: "Jouw locatie", lat, lon };
        setCity(provisional);
        localStorage.setItem("wz_city", JSON.stringify(provisional));
        setLocating(false);
        reverseGeocode(lat, lon).then((c) => {
          setCity(c);
          localStorage.setItem("wz_city", JSON.stringify(c));
        }).catch(() => {});
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 15 * 60 * 1000 }
    );
  };

  if (loading || !weather) {
    return (
      <div className="card p-6 text-center">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-orange" />
        <p className="text-sm text-text-secondary">Piet verzint iets slims…</p>
      </div>
    );
  }

  const today = weather.daily[0];
  const tomorrow = weather.daily[1];
  const narrative = weather.aiVerdict || getMainCommentary(weather);

  // 48-uurs highlights per 6-uurs blok
  const blocks = [
    { label: "Nu", start: 0, end: 1 },
    { label: "Vanmiddag", start: 1, end: 6 },
    { label: "Vanavond", start: 6, end: 12 },
    { label: "Vannacht", start: 12, end: 18 },
    { label: "Morgenochtend", start: 18, end: 30 },
    { label: "Morgenmiddag/avond", start: 30, end: 42 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white text-sm font-bold hover:bg-white/20 transition-all disabled:opacity-60"
        >
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locatie bepalen…" : city.name}
        </button>
        <span className="text-xs text-white/60">← wissel stad via GPS</span>
      </div>

      {/* Hoofdverhaal Piet */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent-orange">
              Piet — {new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-text-secondary">Voor {city.name} — 48 uur vooruit</p>
          </div>
        </div>
        <p className="text-lg font-semibold text-text-primary leading-relaxed break-words">{narrative}</p>
      </div>

      {/* Huidig moment + vandaag + morgen cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2">Nu</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}</span>
            <div>
              <p className="text-3xl font-black">{weather.current.temperature}°</p>
              <p className="text-xs text-text-secondary">voelt als {weather.current.feelsLike}°</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2">{getWeatherDescription(weather.current.weatherCode)}</p>
        </div>
        <div className="card p-4 border-l-4 border-accent-orange">
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent-orange mb-2">Vandaag</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{today.tempMax}°</span>
            <span className="text-sm text-text-secondary">/ {today.tempMin}°</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {today.precipitationSum > 0 ? `${today.precipitationSum}mm regen` : "Droog"} · wind {today.windSpeedMax} km/h
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2">Morgen</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{tomorrow.tempMax}°</span>
            <span className="text-sm text-text-secondary">/ {tomorrow.tempMin}°</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {tomorrow.precipitationSum > 0 ? `${tomorrow.precipitationSum}mm regen` : "Droog"} · wind {tomorrow.windSpeedMax} km/h
          </p>
        </div>
      </div>

      {/* 48-uurs blokken */}
      <div className="card p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3">48-uurs verloop — per 6 uur</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {blocks.map((b) => {
            const slice = weather.hourly.slice(b.start, b.end);
            if (slice.length === 0) return null;
            const avgTemp = Math.round(slice.reduce((a, h) => a + h.temperature, 0) / slice.length);
            const rainSum = slice.reduce((a, h) => a + h.precipitation, 0);
            const maxWind = Math.max(...slice.map((h) => h.windSpeed || 0));
            const midCode = slice[Math.floor(slice.length / 2)].weatherCode;
            return (
              <div key={b.label} className="p-3 rounded-xl bg-white/40 border border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{b.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">{getWeatherEmoji(midCode, true)}</span>
                  <span className="text-xl font-bold">{avgTemp}°</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  {rainSum > 0.1 ? `${rainSum.toFixed(1)}mm` : "droog"} · {maxWind} km/h
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-sm text-white/80 hover:text-white underline">
          → Terug naar het volledige dashboard
        </Link>
      </div>
    </div>
  );
}
