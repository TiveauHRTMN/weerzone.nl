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
  Eye,
  Zap,
  Snowflake,
  ThermometerSun,
  Terminal,
} from "lucide-react";
import { loadWeather, loadWWS, patchCacheDeep } from "@/lib/weatherCache";
import {
  DUTCH_CITIES,
  reverseGeocode,
  type City,
  type WeatherData,
  type HourlyForecast,
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
import ModelPluim from "@/components/ModelPluim";

// "Witte wolk" card-stijl — zichtbaar helder op blauwe /piet achtergrond
const cloudCard: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--card-border)",
  borderRadius: "var(--card-radius)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
  color: "var(--text-primary)",
};

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
        <strong key={i} className="text-text-primary font-black">
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

function DayBlock({ title, daily, sunrise, sunset, uvIndex, hourly }: { title: string; daily: WeatherData["daily"][number] | undefined; sunrise?: string; sunset?: string; uvIndex?: number; hourly: HourlyForecast[]; }) {
  if (!daily) return null;
  const totalRain = hourly.reduce((a, h) => a + (h.precipitation ?? 0), 0);
  const maxWind = Math.max(0, ...hourly.map((h) => h.windSpeed ?? 0));
  const bft = getWindBeaufort(maxWind);

  return (
    <div className="!p-6" style={cloudCard}>
      <div className="flex items-center justify-between mb-4">
        <span className="homecard-kicker !mb-0">{title}</span>
        <span className="text-3xl drop-shadow-xl">{getWeatherEmoji(daily.weatherCode, true)}</span>
      </div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-5xl font-black text-text-primary tracking-tighter">{daily.tempMax}°</span>
        <span className="text-xl font-bold text-text-muted">{daily.tempMin}°</span>
      </div>
      <p className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-5">{getWeatherDescription(daily.weatherCode)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <div className="flex items-center gap-2">
          <Droplet className="w-3.5 h-3.5 text-accent-cyan flex-none" />
          <span className="text-text-secondary"><strong className="text-text-primary">{totalRain > 0.05 ? `${totalRain.toFixed(1)} mm` : "Droog"}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-text-secondary flex-none" />
          <span className="text-text-secondary"><strong className="text-text-primary">{maxWind} km/h</strong> <span className="text-text-muted">· {bft.scale} bft</span></span>
        </div>
        {typeof daily.sunHours === "number" && daily.sunHours > 0 && (
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-wz-sun flex-none" />
            <span className="text-text-secondary"><strong className="text-text-primary">{daily.sunHours.toFixed(1)} u</strong> <span className="text-text-muted">zon</span></span>
          </div>
        )}
        {typeof uvIndex === "number" && uvIndex > 0 && (
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-wz-sun flex-none" />
            <span className="text-text-secondary"><strong className="text-text-primary">UV {uvIndex.toFixed(0)}</strong></span>
          </div>
        )}
        {sunrise && (
          <div className="flex items-center gap-2">
            <Sunrise className="w-3.5 h-3.5 text-wz-sun flex-none" />
            <span className="text-text-secondary">{formatTime(sunrise)}</span>
          </div>
        )}
        {sunset && (
          <div className="flex items-center gap-2">
            <Sunset className="w-3.5 h-3.5 text-orange-300 flex-none" />
            <span className="text-text-secondary">{formatTime(sunset)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface PietProps { initialWWS?: WWSPayload | null; initialWeather?: WeatherData | null; initialCity?: City; }

export default function PietExtended({ initialWWS, initialWeather, initialCity }: PietProps) {
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
    Promise.all([
      loadWeather(city.lat, city.lon, () => {}, (fresh) => { if (!cancelled) setWeather(fresh); }, (neural) => { if (!cancelled) setWeather((prev) => (prev ? { ...prev, neuralData: neural } : prev)); }),
      loadWWS(city.lat, city.lon)
    ]).then(([w, wwsPayload]) => {
      if (!cancelled) {
        setWeather(w);
        setWWS(wwsPayload);
        setLoading(false);
        if (wwsPayload?.piet_update?.content) { setPietAnalysis(wwsPayload.piet_update.content); return; }
        if (w.deepAnalysis) { setPietAnalysis(w.deepAnalysis); return; }

        // SECURITY & COST CONTROL: Voer Vertex AI uitsluitend uit voor betalende abonnees of de Founder
        const hasPaidTier = tier === "piet" || tier === "reed" || tier === "steve" || isFounder;
        if (!hasPaidTier) {
           return; // Niet-betalende gebruikers zien wazige content, we besparen Vertex AI kosten.
        }

        // Haal live data op van Gemini 1.5 Pro via onze Vertex AI route
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
              // Fallback als Gemini faalt
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
      }
    }).catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [city, user?.user_metadata?.full_name]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const provisional: City = { name: "Locatie bepalen...", lat, lon };
      setCity(provisional);
      reverseGeocode(lat, lon).then((c) => { setCity(c); localStorage.setItem("wz_city", JSON.stringify(c)); setLocating(false); }).catch(() => setLocating(false));
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const risks = useMemo(() => (weather ? computeRisks(weather) : []), [weather]);
  const nextRain = useMemo(() => (weather ? NextRain({ weather }) : null), [weather]);

  if (loading || !weather) return <div className="!p-6 text-center" style={cloudCard}><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-text-secondary" /><p className="text-sm text-text-secondary">Piet laadt jouw locatie…</p></div>;

  const narrative = aiNarrative || wws?.piet_update?.content || pietAnalysis || getMainCommentary(weather);
  const narrativeTitle = wws?.piet_update?.title || "Het volledige weerverhaal";
  const narrativeClosing = wws?.piet_update?.closing || "— Piet, voor Weerzone";

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const inHourRange = (h: HourlyForecast, dateStr: string, from: number, to: number) => { if (h.time.slice(0, 10) !== dateStr) return false; const hr = new Date(h.time).getHours(); return hr >= from && hr < to; };
  const futureOnly = (h: HourlyForecast) => new Date(h.time).getTime() >= Date.now() - 30 * 60 * 1000;

  const dayparts: DaypartSummary[] = [
    summarizeDaypart("Ochtend", "06–12 u", weather.hourly.filter((h) => inHourRange(h, todayStr, 6, 12) && futureOnly(h)), weather, true),
    summarizeDaypart("Middag", "12–18 u", weather.hourly.filter((h) => inHourRange(h, todayStr, 12, 18) && futureOnly(h)), weather, true),
    summarizeDaypart("Avond", "18–00 u", weather.hourly.filter((h) => inHourRange(h, todayStr, 18, 24) && futureOnly(h)), weather, false),
    summarizeDaypart("Nacht", "00–06 u", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 0, 6)), weather, false),
    summarizeDaypart("Morgen", "hele dag", weather.hourly.filter((h) => inHourRange(h, tomorrowStr, 6, 24)), weather, true),
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. LOCATIE-SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={locate} disabled={locating} className="btn btn-ghost bg-white/10 backdrop-blur-md border-white/20 text-text-primary font-bold">
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locatie bepalen…" : city.name}
        </button>
        {primaryLocation?.name === city.name && <span className="badge sun">Thuis</span>}
      </div>

      {/* 2. PIET'S VERHAAL — DE HOOFDROL */}
      <div className="rounded-[20px] border-l-4 border-l-accent-cyan !p-7 sm:!p-9" style={{ ...cloudCard, borderLeftWidth: 4, borderLeftColor: "#38bdf8" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">💬</div>
          <div>
            <h2 className="homecard-kicker !text-accent-cyan !mb-0">{narrativeTitle}</h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} · vandaag → morgen</p>
          </div>
        </div>
        {narrative ? (
          <div className="text-base sm:text-lg font-medium text-text-primary leading-[1.7] space-y-4">
            {narrative.split(/\n\n+/).map((para, i) => <p key={i}>{renderInlineBold(para)}</p>)}
            <p className="pt-4 text-text-muted italic text-sm">{narrativeClosing}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/20 rounded-full w-full" /><div className="h-4 bg-white/20 rounded-full w-5/6" /><div className="h-4 bg-white/20 rounded-full w-full" />
            <p className="text-xs text-text-muted pt-2">Piet schrijft jouw dossier…</p>
          </div>
        )}
      </div>

      {/* 3. WWS TECH GRID — HARD DATA EVIDENCE */}
      {wws && (
        <div className="homecard !p-0 overflow-hidden bg-slate-900 border-slate-800">
           <div className="bg-slate-800/50 px-6 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Meteorologisch Dossier (1KM GRID)</span>
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase">{wws.api_grid_1km.region}</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {wws.api_grid_1km.forecast.slice(0, 3).map((f, i) => (
                 <div key={i} className="p-5">
                    <p className="text-[10px] font-black text-text-muted uppercase mb-2">{formatTime(f.time)}</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-text-primary">{f.temp_c}°</span>
                       <span className="text-xs text-text-muted">{f.precip_mm}mm</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                       <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${f.confidence}%` }} />
                       </div>
                       <span className="text-[9px] font-black text-emerald-400/80 ml-3">{f.confidence}%</span>
                    </div>
                 </div>
              ))}
           </div>
           <div className="px-6 py-2 bg-black/20 text-[9px] font-bold text-text-muted uppercase tracking-tighter">Synthese: {wws.api_grid_1km.models_synthesized.join(" · ")}</div>
        </div>
      )}

      {/* 4. NU-HERO */}
      <div className="!p-7 sm:!p-9" style={cloudCard}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="homecard-kicker">Status nu in {city.name}</span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-7xl sm:text-8xl font-black text-text-primary tracking-tighter leading-none">{weather.current.temperature}°</span>
              <span className="text-6xl sm:text-7xl drop-shadow-xl">{getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-text-secondary mt-2">{getWeatherDescription(weather.current.weatherCode)}{weather.current.feelsLike !== weather.current.temperature && <span className="text-text-muted font-medium"> · voelt als {weather.current.feelsLike}°</span>}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-3 mt-6 pt-6 border-t border-white/10">
          <div><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted mb-1"><Wind className="w-3 h-3" /> Wind</div><div className="text-text-primary font-bold">{weather.current.windSpeed} km/h <span className="text-text-muted text-xs font-medium">· {weather.current.windDirection}</span></div><div className="text-[11px] text-text-muted">{getWindBeaufort(weather.current.windSpeed).scale} bft</div></div>
          <div><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted mb-1"><Droplet className="w-3 h-3" /> Neerslag</div><div className="text-text-primary font-bold">{weather.current.precipitation > 0 ? `${weather.current.precipitation.toFixed(1)} mm` : "Droog"}</div><div className="text-[11px] text-text-muted">{nextRain?.headline ?? ""}</div></div>
          <div><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted mb-1"><Cloud className="w-3 h-3" /> Lucht</div><div className="text-text-primary font-bold">{weather.current.cloudCover}%</div><div className="text-[11px] text-text-muted">vochtigheid {weather.current.humidity}%</div></div>
          <div><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted mb-1"><Sun className="w-3 h-3" /> Zon</div><div className="text-text-primary font-bold">{weather.sunrise ? formatTime(weather.sunrise) : "—"}<span className="text-text-muted text-xs"> / {weather.sunset ? formatTime(weather.sunset) : "—"}</span></div><div className="text-[11px] text-text-muted">{weather.uvIndex > 0 ? `UV ${weather.uvIndex.toFixed(0)}` : ""}</div></div>
        </div>
      </div>

      {/* 5. RISICO-STRIP */}
      {risks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {risks.map((r) => {
            const t = riskTone(r.tone);
            return <div key={r.key} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: t.bg, border: `1px solid ${t.border}` }}><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: t.border, color: t.fg }}>{r.icon}</div><div className="min-w-0"><div className="text-sm font-black text-text-primary">{r.label}</div><div className="text-xs text-text-secondary leading-snug mt-0.5">{r.detail}</div></div></div>;
          })}
        </div>
      )}

      {/* 6. DAGDEEL-SAMENVATTING */}
      <div className="!p-0 overflow-hidden" style={{ ...cloudCard, padding: 0 }}>
        <div className="flex items-end justify-between px-6 pt-6 pb-4"><h3 className="homecard-kicker !mb-0">De dagdelen</h3><span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">wall-clock</span></div>
        <div className="divide-y divide-white/10">
          {dayparts.map((d, idx) => (
            <motion.div key={d.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="px-6 py-4 flex gap-4 items-start" style={d.empty ? { opacity: 0.4 } : undefined}>
              <div className="flex-none w-14 text-center"><div className="text-3xl drop-shadow-lg leading-none">{d.emoji}</div><div className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1.5">{d.window}</div></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 mb-0.5"><h4 className="text-base font-black text-text-primary tracking-tight">{d.label}</h4>{!d.empty && <span className="text-sm font-bold text-text-secondary flex-none">{d.tempLine}</span>}</div>
                {d.empty ? <p className="text-sm text-text-muted leading-relaxed">{d.description}</p> : <><p className="text-[13px] text-text-secondary leading-relaxed font-medium">{d.description}. {d.rainLine} {d.windLine}</p>{d.hint && <p className="text-[12px] text-accent-cyan/90 font-bold mt-1">→ {d.hint}</p>}</>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 7. MODEL PLUIM */}
      <div className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Model Pluim</h3>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">harmonie · icon · arome</span>
        </div>
        <ModelPluim hourly={weather.hourly} sunrise={weather.sunrise} sunset={weather.sunset} />
      </div>

      {/* 8. VOLLEDIGE 48-UURS UURVOORSPELLING */}
      <div className="space-y-4">
        <div className="flex items-end justify-between px-1"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">48-uurs uur-voor-uur</h3><span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">scroll →</span></div>
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden -mx-4 px-4 pb-4 snap-x scroll-smooth" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", scrollbarWidth: "none" }}>
          {weather.hourly.slice(0, 48).map((h, i) => {
            const d = new Date(h.time);
            const isMidnight = d.getHours() === 0;
            const isFirst = i === 0;
            const showDayLabel = isFirst || isMidnight;
            const isDay = isDaylightHour(h.time, weather.sunrise, weather.sunset);
            const wet = h.precipitation > 0.05;
            const stormy = (h.windSpeed ?? 0) >= 50;
            return (
              <div key={h.time} className="flex flex-col items-stretch w-[88px] flex-shrink-0 snap-start">
                {showDayLabel && <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 pl-1">{dateLabel(d)}</span>}
                {!showDayLabel && <span className="block h-[18px] mb-1.5" />}
                <div className="flex flex-col items-center !p-4" style={isFirst ? { ...cloudCard, borderColor: "rgba(56,189,248,0.7)", background: "rgba(56,189,248,0.25)", padding: 16 } : { ...cloudCard, background: "rgba(255,255,255,0.18)", padding: 16 }}>
                  <span className="text-[10px] font-black text-text-muted mb-2">{isFirst ? "NU" : formatHour(h.time)}</span>
                  <span className="text-3xl mb-2 drop-shadow-lg">{getWeatherEmoji(h.weatherCode, isDay)}</span>
                  <span className="text-lg font-black text-text-primary">{h.temperature}°</span>
                  <span className={`text-[10px] font-bold mt-1.5 ${wet ? "text-accent-cyan" : "text-text-muted"}`}>{wet ? `${h.precipitation.toFixed(1)}mm` : "—"}</span>
                  <span className={`text-[10px] font-bold mt-0.5 ${stormy ? "text-orange-300" : "text-text-muted"}`}>{h.windSpeed} km/h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-12 border-t border-white/10 flex justify-center">
        <Link href="/" className="btn btn-ghost text-sm font-bold opacity-60 hover:opacity-100">← Dashboard</Link>
      </div>
    </div>
  );
}
