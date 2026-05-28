"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  RefreshCw,
  Wind,
  Droplet,
  Sun,
  Sunrise,
  Sunset,
  Cloud,
  Zap,
  Snowflake,
  ThermometerSun,
} from "lucide-react";
import { loadWeather, loadWWS, patchCacheDeep } from "@/lib/weatherCache";
import {
  DUTCH_CITIES,
  reverseGeocode,
  type City,
  type WeatherData,
  type HourlyForecast,
  type DailyForecast,
  type WWSPayload,
} from "@/lib/types";
import {
  getWeatherEmoji,
  getWeatherDescription,
  getWindBeaufort,
} from "@/lib/weather";
import { getMainCommentary } from "@/lib/commentary";
import { getPietDeepAnalysis } from "@/app/actions";
import { useSession } from "@/lib/session-context";
import { persistCity } from "@/lib/persist-city";
import {
  getFietsScore, getBbqScore, getStrandScore, getHooikoortsScore,
  getTerrasScore, getWandelScore, getHardloopScore, getOutfitAdvice, getUvLabel,
} from "@/lib/commentary";

import RainMap from "@/components/RainMap";

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

function formatHour(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:00`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function isDaylightHour(iso: string, sunrise?: string, sunset?: string): boolean {
  if (!sunrise || !sunset) {
    const h = new Date(iso).getHours();
    return h >= 7 && h < 21;
  }
  const t = new Date(iso).getTime();
  return t >= new Date(sunrise).getTime() && t <= new Date(sunset).getTime();
}

function renderInlineBold(text: string): React.ReactNode[] {
  // Renders **bold** segments without a markdown library.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="text-slate-900 font-black">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function dateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Vandaag";
  if (diffDays === 1) return "Morgen";
  if (diffDays === 2) return "Overmorgen";
  return target.toLocaleDateString("nl-NL", { weekday: "long" });
}

interface RiskFlag {
  key: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  tone: "danger" | "warn" | "cool" | "hot";
}

function computeRisks(weather: WeatherData): RiskFlag[] {
  const out: RiskFlag[] = [];
  const next48 = weather.hourly.slice(0, 48);

  const onweerHour = next48.find(
    (h) => h.cape > 1000 || (h.weatherCode >= 95 && h.weatherCode <= 99)
  );
  if (onweerHour) {
    out.push({
      key: "onweer",
      label: "Onweer in zicht",
      detail: `Rond ${formatHour(onweerHour.time)} kans op buien met onweer.`,
      icon: <Zap className="w-4 h-4" />,
      tone: "danger",
    });
  }

  const stormHour = next48.find((h) => (h.windSpeed ?? 0) >= 50);
  if (stormHour) {
    const bft = getWindBeaufort(stormHour.windSpeed);
    out.push({
      key: "wind",
      label: `${bft.label} (${bft.scale} bft)`,
      detail: `Vanaf ${formatHour(stormHour.time)} ${stormHour.windSpeed} km/h. Zet je fiets goed vast.`,
      icon: <Wind className="w-4 h-4" />,
      tone: "warn",
    });
  }

  const minTemp = Math.min(
    weather.daily[0]?.tempMin ?? 99,
    weather.daily[1]?.tempMin ?? 99
  );
  if (minTemp < 0) {
    out.push({
      key: "vorst",
      label: "Nachtvorst",
      detail: `Tot ${minTemp}° vannacht. Auto krabben en planten naar binnen.`,
      icon: <Snowflake className="w-4 h-4" />,
      tone: "cool",
    });
  }

  const maxTemp = Math.max(
    weather.daily[0]?.tempMax ?? 0,
    weather.daily[1]?.tempMax ?? 0
  );
  if (maxTemp >= 28) {
    out.push({
      key: "hitte",
      label: "Warme dag",
      detail: `Tot ${maxTemp}°. Drink water, smeer in, blijf uit de volle zon.`,
      icon: <ThermometerSun className="w-4 h-4" />,
      tone: "hot",
    });
  }

  return out;
}

function riskTone(tone: RiskFlag["tone"]): { bg: string; border: string; fg: string } {
  switch (tone) {
    case "danger":
      return { bg: "rgba(244,63,94,0.18)", border: "rgba(244,63,94,0.45)", fg: "#fecdd3" };
    case "warn":
      return { bg: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.45)", fg: "#fed7aa" };
    case "cool":
      return { bg: "rgba(125,211,252,0.18)", border: "rgba(125,211,252,0.45)", fg: "#bae6fd" };
    case "hot":
      return { bg: "rgba(255,210,26,0.18)", border: "rgba(255,210,26,0.45)", fg: "#fde68a" };
  }
}

function NextRain({ weather }: { weather: WeatherData }): { headline: string; sub?: string } {
  if (weather.minutely.length > 0) {
    const wet = weather.minutely.find((m) => m.precipitation > 0.05);
    if (wet) {
      const mins = Math.max(1, Math.round((new Date(wet.time).getTime() - Date.now()) / 60000));
      return { headline: `Eerste druppels over zo'n ${mins} min`, sub: `${wet.precipitation.toFixed(1)} mm verwacht` };
    }
  }
  const wetHour = weather.hourly.slice(0, 48).find((h) => h.precipitation > 0.1);
  if (!wetHour) return { headline: "Komende 48 uur droog", sub: "Geen druppel in zicht." };
  const hours = Math.round((new Date(wetHour.time).getTime() - Date.now()) / 3600000);
  if (hours <= 1) return { headline: "Komend uur regen", sub: `${wetHour.precipitation.toFixed(1)} mm rond ${formatHour(wetHour.time)}` };
  return { headline: `Eerste regen rond ${formatHour(wetHour.time)}`, sub: `${dateLabel(new Date(wetHour.time))} · ${wetHour.precipitation.toFixed(1)} mm` };
}

interface DaypartSummary {
  key: string;
  label: string;
  window: string;
  emoji: string;
  description: string;
  tempLine: string;
  rainLine: string;
  windLine: string;
  hint: string;
  empty?: boolean;
}

function summarizeDaypart(label: string, window: string, hours: HourlyForecast[], weather: WeatherData, daytime: boolean): DaypartSummary {
  const key = label.toLowerCase();
  if (hours.length === 0) return { key, label, window, emoji: "·", description: "Buiten het 48-uurs venster.", tempLine: "", rainLine: "", windLine: "", hint: "", empty: true };

  const tempMin = Math.min(...hours.map((h) => h.temperature));
  const tempMax = Math.max(...hours.map((h) => h.temperature));
  const feelsMin = Math.min(...hours.map((h) => h.apparentTemperature));
  const feelsMax = Math.max(...hours.map((h) => h.apparentTemperature));
  const rainSum = hours.reduce((a, h) => a + (h.precipitation ?? 0), 0);
  const wetHours = hours.filter((h) => (h.precipitation ?? 0) > 0.1);
  const maxWind = Math.max(...hours.map((h) => h.windSpeed ?? 0));
  const bft = getWindBeaufort(maxWind);
  const stormy = hours.find((h) => (h.windSpeed ?? 0) >= 50);
  const onweer = hours.find((h) => h.cape > 1000 || (h.weatherCode >= 95 && h.weatherCode <= 99));

  const heaviest = hours.reduce((a, h) => ((h.precipitation ?? 0) > (a.precipitation ?? 0) ? h : a), hours[0]);
  const codeHour = (heaviest.precipitation ?? 0) > 0.2 ? heaviest : hours[Math.floor(hours.length / 2)];
  const emoji = getWeatherEmoji(codeHour.weatherCode, daytime);
  const description = getWeatherDescription(codeHour.weatherCode);

  const tempLine = tempMin === tempMax ? `${tempMin}°` : `${tempMin}° tot ${tempMax}°`;
  const feelsTxt = feelsMin !== tempMin || feelsMax !== tempMax ? (feelsMin === feelsMax ? `, voelt als ${feelsMin}°` : `, voelt als ${feelsMin}°–${feelsMax}°`) : "";

  let rainLine: string;
  if (onweer) rainLine = `Onweerskans rond ${formatHour(onweer.time)}.`;
  else if (rainSum < 0.1) rainLine = "Droog.";
  else if (wetHours.length === 1) rainLine = `Korte bui rond ${formatHour(wetHours[0].time)} (${rainSum.toFixed(1)} mm).`;
  else if (rainSum < 2) rainLine = `Af en toe wat motregen, samen ${rainSum.toFixed(1)} mm.`;
  else if (rainSum < 8) rainLine = `Geregeld regen, ${rainSum.toFixed(1)} mm in totaal.`;
  else rainLine = `Veel regen: ${rainSum.toFixed(1)} mm. Kletsnat.`;

  let windLine: string;
  if (stormy) windLine = `Krachtige wind tot ${maxWind} km/h (${bft.scale} bft).`;
  else if (maxWind >= 30) windLine = `Stevige wind, tot ${maxWind} km/h (${bft.scale} bft).`;
  else if (maxWind >= 15) windLine = `Matige wind (${bft.scale} bft).`;
  else windLine = "Weinig wind.";

  let hint = "";
  if (onweer) hint = "Plan binnenactiviteit rond dat hour.";
  else if (rainSum > 2) hint = "Jas mee. Fiets met spatborden de moeite waard.";
  else if (stormy) hint = "Tuinmeubels vastzetten, fiets goed op slot.";
  else if (key.includes("nacht") && tempMin < 0) hint = "Auto krabben. Planten naar binnen.";
  else if (daytime && tempMax >= 25 && weather.uvIndex >= 5) hint = "Smeer in, drink genoeg, schaduw is je vriend.";
  else if (daytime && tempMax >= 18 && rainSum < 0.5) hint = "Mooi moment om naar buiten te gaan.";
  else if (key === "ochtend" && tempMin <= 5 && rainSum < 0.5) hint = "Frisse start — extra laag eronder.";
  else if (key === "avond" && rainSum < 0.5 && maxWind < 25) hint = "Prima avond voor een wandeling na het eten.";

  return { key, label, window, emoji, description: `${description}${feelsTxt}`, tempLine, rainLine, windLine, hint };
}

function DayBlock({ title, daily, hourly, sunrise, sunset, uvIndex }: { title: string; daily: DailyForecast; hourly: HourlyForecast[]; sunrise?: string; sunset?: string; uvIndex?: number }) {
  const rainTotal = hourly.reduce((s, h) => s + h.precipitation, 0);
  const maxWind = Math.max(...hourly.map(h => h.windSpeed ?? 0), 0);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <span className="text-2xl">{getWeatherEmoji(daily.weatherCode, true)}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-black text-slate-900">{daily.tempMax}°</span>
        <span className="text-lg font-bold text-slate-400">/ {daily.tempMin}°</span>
      </div>
      <p className="text-[12px] text-slate-600 mb-3">{getWeatherDescription(daily.weatherCode)}</p>
      <div className="space-y-2 text-[12px]">
        <div className="flex justify-between"><span className="text-slate-400">Neerslag</span><span className="font-bold text-slate-800">{rainTotal > 0 ? `${rainTotal.toFixed(1)} mm` : "Droog"}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Max wind</span><span className="font-bold text-slate-800">{maxWind} km/h</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Zon-uren</span><span className="font-bold text-slate-800">{daily.sunHours.toFixed(1)}u</span></div>
        {uvIndex != null && <div className="flex justify-between"><span className="text-slate-400">UV-index</span><span className="font-bold text-slate-800">{uvIndex.toFixed(0)}</span></div>}
        {sunrise && <div className="flex justify-between"><span className="text-slate-400">Zon op/onder</span><span className="font-bold text-slate-800">{formatTime(sunrise)} / {sunset ? formatTime(sunset) : "—"}</span></div>}
      </div>
    </div>
  );
}

interface PietProps { initialWWS?: WWSPayload | null; initialWeather?: WeatherData | null; initialCity?: City; hideLocate?: boolean; }

export default function PietExtended({ initialWWS, initialWeather, initialCity, hideLocate = false }: PietProps) {
  const { primaryLocation, loading: sessionLoading, user, tier, isFounder } = useSession();
  const [city, setCity] = useState<City>(() => initialCity || getSavedCity() || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(initialWWS || null);
  const [pietAnalysis, setPietAnalysis] = useState<string | null>(initialWeather?.deepAnalysis || null);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialWeather);
  const [locating, setLocating] = useState(false);

  useEffect(() => { if (!sessionLoading && primaryLocation) setCity(primaryLocation); }, [sessionLoading, primaryLocation]);

  useEffect(() => {
    let cancelled = false;
    if (!weather) setLoading(true);

    // 1. Load fast weather data immediately to unblock UI
    loadWeather(
      city.lat,
      city.lon,
      () => {},
      (fresh) => { if (!cancelled) { setWeather(fresh); setLoading(false); } },
      (neural) => { if (!cancelled) setWeather((prev) => (prev ? { ...prev, neuralData: neural } : prev)); },
      true
    ).then((w) => {
      if (cancelled) return;
      setWeather(w);
      setLoading(false);

      if (w.deepAnalysis && !pietAnalysis) {
        setPietAnalysis(w.deepAnalysis);
      }

      // 2. Trigger slow AI analysis in background
      const hasPaidTier = tier === "piet" || tier === "reed" || tier === "steve" || isFounder;
      if (!hasPaidTier) return;

      fetch('/api/persona/piet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather: w, city: city.name, userName: user?.user_metadata?.full_name || 'gebruiker' })
      })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.narrative) {
          setAiNarrative(data.narrative);
          patchCacheDeep(city.lat, city.lon, data.narrative);
        } else if (!cancelled) {
          getPietDeepAnalysis(w).then((analysis) => { 
            setPietAnalysis(analysis); 
            patchCacheDeep(city.lat, city.lon, analysis); 
          });
        }
      })
      .catch((err) => {
        console.error("Vertex AI Error:", err);
        if (!cancelled) {
          getPietDeepAnalysis(w).then((analysis) => { 
            setPietAnalysis(analysis); 
            patchCacheDeep(city.lat, city.lon, analysis); 
          });
        }
      });

    }).catch(() => !cancelled && setLoading(false));

    // 3. Load WWS completely decoupled
    loadWWS(city.lat, city.lon).then((wwsPayload) => {
      if (!cancelled) {
        setWWS(wwsPayload);
        if (wwsPayload?.piet_update?.content && !aiNarrative) { 
          setPietAnalysis(wwsPayload.piet_update.content); 
        }
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [city, tier, isFounder, user?.user_metadata?.full_name]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const provisional: City = { name: "Locatie bepalen...", lat, lon };
      setCity(provisional);
      reverseGeocode(lat, lon).then((c) => { persistCity(c); window.location.reload(); }).catch(() => setLocating(false));
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const risks = useMemo(() => (weather ? computeRisks(weather) : []), [weather]);
  const nextRain = useMemo(() => (weather ? NextRain({ weather }) : null), [weather]);

  if (loading || !weather) return <div className="card p-6 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-text-secondary" /><p className="text-sm text-text-secondary">We laden jouw locatie...</p></div>;

  const narrative = aiNarrative || wws?.piet_update?.content || pietAnalysis || getMainCommentary(weather);
  const narrativeTitle = wws?.piet_update?.title || `Weerbericht voor ${city.name}`;
  const narrativeClosing = wws?.piet_update?.closing || "Weerzone";

  const _pad = (n: number) => String(n).padStart(2, "0");
  const _now = new Date();
  const todayStr = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
  const _tom = new Date(_now); _tom.setDate(_tom.getDate() + 1);
  const tomorrowStr = `${_tom.getFullYear()}-${_pad(_tom.getMonth() + 1)}-${_pad(_tom.getDate())}`;
  const inHourRange = (h: HourlyForecast, dateStr: string, from: number, to: number) => { if (h.time.slice(0, 10) !== dateStr) return false; const hr = parseInt(h.time.slice(11, 13), 10); return hr >= from && hr < to; };
  const futureOnly = (h: HourlyForecast) => new Date(h.time).getTime() >= Date.now() - 30 * 60 * 1000;

  const dayparts: DaypartSummary[] = [
    summarizeDaypart("Ochtend", "6:00 - 12:00", weather.hourly.filter((h) => inHourRange(h, todayStr, 6, 12) && futureOnly(h)), weather, true),
    summarizeDaypart("Middag", "12:00 - 18:00", weather.hourly.filter((h) => inHourRange(h, todayStr, 12, 18) && futureOnly(h)), weather, true),
    summarizeDaypart("Avond", "18:00 - 0:00", weather.hourly.filter((h) => inHourRange(h, todayStr, 18, 24) && futureOnly(h)), weather, false),
    summarizeDaypart("Nacht", "0:00 - 6:00", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 0, 6)), weather, false),
    summarizeDaypart("Morgen ochtend", "6:00 - 12:00", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 6, 12)), weather, true),
    summarizeDaypart("Morgen middag", "12:00 - 18:00", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 12, 18)), weather, true),
    summarizeDaypart("Morgen avond", "18:00 - 0:00", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 18, 24)), weather, false),
  ].filter(d => !d.empty);

  const outfit = getOutfitAdvice(weather);
  const uvInfo = getUvLabel(weather.uvIndex);
  const fiets = getFietsScore(weather);
  const scores = [
    { emoji: "☕", label: "Terras", score: getTerrasScore(weather), tip: weather.current.temperature > 15 && weather.current.precipitation === 0 ? "Lekker weer om buiten te zitten" : "Beter binnen blijven" },
    { emoji: "🚲", label: "Fietsen", score: fiets.score, tip: fiets.label },
    { emoji: "🥩", label: "BBQ", score: getBbqScore(weather), tip: getBbqScore(weather) >= 7 ? "Ideaal barbecueweer" : "Niet ideaal voor de BBQ" },
    { emoji: "🏖️", label: "Strand", score: getStrandScore(weather), tip: getStrandScore(weather) >= 7 ? "Stranddag!" : "Nog even wachten" },
    { emoji: "🤧", label: "Hooikoorts", score: getHooikoortsScore(weather), tip: getHooikoortsScore(weather) >= 6 ? "Veel pollen verwacht — antihistamine meenemen" : "Weinig pollendruk" },
    { emoji: "🏃", label: "Hardlopen", score: getHardloopScore(weather), tip: getHardloopScore(weather) >= 7 ? "Prima hardloopweer" : "Pas je tempo aan" },
    { emoji: "🥾", label: "Wandelen", score: getWandelScore(weather), tip: getWandelScore(weather) >= 7 ? "Heerlijk wandelweer" : "Trek stevig schoeisel aan" },
  ];

  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. LOCATIE */}
      {!hideLocate && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={locate} disabled={locating} className="btn btn-ghost bg-white/10 backdrop-blur-md border-white/20 text-text-primary font-bold">
            <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
            {locating ? "Locatie bepalen…" : city.name}
          </button>
          {primaryLocation?.name === city.name && <span className="badge sun">Thuis</span>}
        </div>
      )}

      {/* 2. WEERVERHAAL */}
      <div className="card p-7 sm:p-9 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">💬</div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-blue-600">{narrativeTitle}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} · vandaag → morgen</p>
          </div>
        </div>
        {narrative ? (
          <div className="text-base sm:text-lg font-medium text-slate-800 leading-[1.7] space-y-4">
            {narrative.split(/\n\n+/).map((para, i) => <p key={i}>{renderInlineBold(para)}</p>)}
            <p className="pt-4 text-slate-400 italic text-sm">{narrativeClosing}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 rounded-full w-full" /><div className="h-4 bg-slate-200 rounded-full w-5/6" /><div className="h-4 bg-slate-200 rounded-full w-full" />
            <p className="text-xs text-slate-400 pt-2">We schrijven jouw weerbericht...</p>
          </div>
        )}
      </div>

      {/* 3. STATUS NU — compact */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nu in {city.name}</span>
          <span className="text-[10px] font-bold text-slate-400">{nextRain?.headline}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{weather.current.temperature}°</span>
            <span className="text-4xl drop-shadow-lg">{getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div><span className="text-slate-400 text-[10px] font-black uppercase">Voelt als</span><div className="font-bold text-slate-800">{weather.current.feelsLike}°</div></div>
            <div><span className="text-slate-400 text-[10px] font-black uppercase">Wind</span><div className="font-bold text-slate-800">{weather.current.windSpeed} km/h · {getWindBeaufort(weather.current.windSpeed).scale} bft</div></div>
            <div><span className="text-slate-400 text-[10px] font-black uppercase">Luchtvochtigheid</span><div className="font-bold text-slate-800">{weather.current.humidity}%</div></div>
            <div><span className="text-slate-400 text-[10px] font-black uppercase">Bewolking</span><div className="font-bold text-slate-800">{weather.current.cloudCover}%</div></div>
          </div>
        </div>
      </div>

      {/* 4. OUTFIT & UV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{outfit.emoji}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kledingadvies</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{outfit.advice}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zon & UV-index</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-sm text-slate-800"><Sunrise className="w-3.5 h-3.5 inline text-amber-400 mr-1" /><strong>{weather.sunrise ? formatTime(weather.sunrise) : "—"}</strong></div>
                <div className="text-sm text-slate-800"><Sunset className="w-3.5 h-3.5 inline text-orange-400 mr-1" /><strong>{weather.sunset ? formatTime(weather.sunset) : "—"}</strong></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: uvInfo.color }}>{weather.uvIndex.toFixed(0)}</div>
              <div className="text-[9px] font-bold text-slate-400 max-w-[120px]">{uvInfo.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. VANDAAG & MORGEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ d: today, label: "Vandaag", sr: weather.sunrise, ss: weather.sunset, uv: weather.uvIndex },
          { d: tomorrow, label: "Morgen" }].map(({ d, label, sr, ss, uv }) => d && (
          <DayBlock key={label} title={label} daily={d} sunrise={sr} sunset={ss} uvIndex={uv}
            hourly={weather.hourly.filter(h => h.time.startsWith(d.date || ""))} />
        ))}
      </div>

      {/* 5B. LIVE REGENRADAR */}
      <RainMap lat={city.lat} lon={city.lon} />

      {/* 6. LEEFSTIJL SCORES */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Leefstijl & Activiteiten</span>
          <p className="text-sm font-black text-slate-800 mt-0.5">Wat kun je vandaag doen?</p>
        </div>
        <div className="divide-y divide-slate-50">
          {scores.map(s => {
            const pct = s.score * 10;
            const color = s.score >= 7 ? "#16a34a" : s.score >= 4 ? "#f59e0b" : "#ef4444";
            return (
              <div key={s.label} className="px-5 py-3.5 flex items-center gap-4">
                <span className="text-2xl w-8 text-center">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-800">{s.label}</span>
                    <span className="text-sm font-black" style={{ color }}>{s.score}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{s.tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. DAGDELEN */}
      <div className="card overflow-hidden">
        <div className="flex items-end justify-between px-5 pt-5 pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">De dagdelen</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vandaag → morgen</span>
        </div>
        <div className="divide-y divide-slate-50">
          {dayparts.map((d, idx) => (
            <motion.div key={d.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="px-5 py-4 flex gap-4 items-start">
              <div className="flex-none w-12 text-center"><div className="text-2xl leading-none">{d.emoji}</div><div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{d.window}</div></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 mb-0.5"><h4 className="text-sm font-black text-slate-800">{d.label}</h4><span className="text-sm font-bold text-slate-600 flex-none">{d.tempLine}</span></div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{d.description}. {d.rainLine} {d.windLine}</p>
                {d.hint && <p className="text-[11px] text-blue-600 font-bold mt-1">→ {d.hint}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-center">
        <Link href="/" className="btn btn-ghost text-sm font-bold opacity-60 hover:opacity-100">← Dashboard</Link>
      </div>
    </div>
  );
}

