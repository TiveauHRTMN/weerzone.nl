"use client";

import { useEffect, useState } from "react";
import { MapPin, Send, RefreshCw, ChevronDown } from "lucide-react";
import Logo, { LogoIcon, LogoFull } from "./Logo";
import { getWeather } from "@/app/actions";
import { DUTCH_CITIES, findNearestCity, type City, type WeatherData } from "@/lib/types";
import {
  getMainCommentary,
  getKutweerScore,
  getFietsScore,
  getOutfitAdvice,
  getWindComment,
  getRandomQuote,
  getUvLabel,
} from "@/lib/commentary";
import { getWeatherEmoji, getWeatherDescription, getWindBeaufort } from "@/lib/weather";
import { motion, AnimatePresence } from "framer-motion";
import WeatherBackground from "./WeatherBackground";
import AffiliateCard from "./AffiliateCard";

interface DashboardProps {
  initialCity?: City;
}

export default function WeatherDashboard({ initialCity }: DashboardProps = {}) {
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "Alkmaar") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);

  const answerQuestion = (q: string) => {
    if (!weather) return;
    const lower = q.toLowerCase();
    const rain = weather.current.precipitation > 0;
    const rainSoon = weather.hourly.slice(0, 6).some(h => h.precipitation > 0.5);
    const temp = weather.current.temperature;
    const wind = weather.current.windSpeed;

    if (lower.includes("jas") || lower.includes("jacket")) {
      setChatAnswer(temp < 12 || rain ? "Ja. Jas aan. Niet onderhandelen. 🧥" : "Nee joh, lekker zonder. Geniet ervan zolang het kan. 😎");
    } else if (lower.includes("hardlop") || lower.includes("rennen") || lower.includes("joggen")) {
      const ok = !rain && wind < 35 && temp > 2 && temp < 32;
      setChatAnswer(ok ? `${temp}° en ${rain ? 'nat' : 'droog'}. Prima hardloopweer. Geen excuus. 🏃‍♂️` : `Nee. ${rain ? 'Regen' : wind > 35 ? 'Veel te veel wind' : temp <= 2 ? 'IJskoud' : 'Te warm'}. Bank is ook cardio. 🛋️`);
    } else if (lower.includes("morgen") || lower.includes("beter")) {
      const tomorrow = weather.daily[1];
      const today = weather.daily[0];
      const betterTemp = tomorrow.tempMax > today.tempMax;
      const lessRain = tomorrow.precipitationSum < today.precipitationSum;
      setChatAnswer(betterTemp && lessRain ? `Ja. Morgen ${tomorrow.tempMax}° en ${tomorrow.precipitationSum === 0 ? 'droog' : 'minder nattigheid'}. Houden zo. 📈` : betterTemp ? `Warmer (${tomorrow.tempMax}°), maar ${tomorrow.precipitationSum > 0 ? 'natter' : 'verder hetzelfde'}. 🤷` : `Nee. Morgen ${tomorrow.tempMax}°. Vandaag is je beste kans. 📉`);
    } else if (lower.includes("fiets") || lower.includes("fietsen")) {
      const { score, label } = getFietsScore(weather);
      setChatAnswer(`Fietsscore: ${score}/10. ${label} 🚴`);
    } else if (lower.includes("regen") || lower.includes("nat") || lower.includes("droog")) {
      setChatAnswer(rain ? `Ja, het regent. ${weather.current.precipitation}mm. Paraplu of accepteer je lot. ☔` : rainSoon ? "Nu nog droog, maar niet lang meer. Paraplu mee, vertrouw ons. 🌦️" : "Droog. De komende uren geen druppel. Dat beloven we. ☀️");
    } else if (lower.includes("zon") || lower.includes("zonnig")) {
      const sunset = new Date(weather.sunset);
      setChatAnswer(`Zon onder om ${sunset.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. UV: ${weather.uvIndex.toFixed(1)}. ${weather.uvIndex > 5 ? 'Smeren. Nu. Je bent geen leguaan. 🧴' : '☀️'}`);
    } else if (lower.includes("wind") || lower.includes("waai")) {
      setChatAnswer(getWindComment(weather.current.windSpeed, weather.current.windGusts));
    } else if (lower.includes("station") || lower.includes("waar") || lower.includes("locatie") || lower.includes("dichtbij")) {
      setChatAnswer(`📍 Je ziet nu het weer bij ${city.name} (${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°O). Klik op 📍 voor je exacte locatie — we snappen naar het dichtstbijzijnde meetpunt.`);
    } else if (lower.includes("hoe werkt") || lower.includes("nauwkeurig") || lower.includes("betrouwbaar") || lower.includes("model")) {
      setChatAnswer(`We combineren KNMI HARMONIE + DWD ICON — twee van de beste weermodellen voor Nederland. Modelovereenkomst nu: ${weather.models.agreement}%. ${weather.models.agreement >= 70 ? 'Behoorlijk zeker dus.' : 'Er is wat onzekerheid, we tonen het eerlijk.'}`);
    } else {
      setChatAnswer(`${temp}° in ${city.name}, ${rain ? 'regen' : 'droog'}, wind ${wind} km/h. ${getMainCommentary(weather)}`);
    }
  };

  const handleShare = async () => {
    if (!weather) return;
    const text = `${getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)} ${weather.current.temperature}° in ${city.name} — ${getMainCommentary(weather)}\n\nweerzone.nl — 48 uur. De rest is gelul.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Weer in ${city.name}`, text, url: "https://weerzone.nl" });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("Weer gekopieerd naar klembord! 📋");
    }
  };

  const fetchWeather = async (targetCity: City) => {
    setLoading(true);
    try {
      const data = await getWeather(targetCity.lat, targetCity.lon);
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuote(getRandomQuote());
    fetchWeather(city);
  }, [city]);

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const nearest = findNearestCity(position.coords.latitude, position.coords.longitude);
            const data = await getWeather(position.coords.latitude, position.coords.longitude);
            setWeather(data);
            setCity(nearest);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          setLoading(false);
        }
      );
    }
  };

  if (loading || !weather) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <div className="flex flex-col gap-2">
          <LogoFull
            height={96}
            className="animate-pulse drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)]"
          />
          <p className="text-white/65 text-sm tracking-wide font-medium pl-0.5">Het weer binnen 48 uur</p>
        </div>
      </div>
    );
  }

  const { score: kutScore, label: kutLabel, emoji: kutEmoji } = getKutweerScore(weather);
  const { score: fietsScore, label: fietsLabel } = getFietsScore(weather);
  const { emoji: outfitEmoji, advice: outfitAdvice } = getOutfitAdvice(weather);
  const uvInfo = getUvLabel(weather.uvIndex);

  return (
    <>
    <WeatherBackground weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
    <div className="relative z-10 max-w-2xl mx-auto p-4 pb-20 sm:p-6 space-y-6" style={{ isolation: "isolate" }}>
      {/* Header */}
      <header className="flex items-center justify-between animate-fade-in">
        <div className="flex flex-col gap-1">
          <LogoFull height={52} />
          <p className="text-[12px] text-white/65 tracking-wide font-medium pl-0.5">Het weer binnen 48 uur</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLocationClick}
            className="w-10 h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <MapPin className="text-accent-red w-4 h-4" />
          </button>
          
          <div className="relative group">
            <select
              value={city.name}
              onChange={(e) => {
                const selected = DUTCH_CITIES.find(c => c.name === e.target.value);
                if (selected) setCity(selected);
              }}
              className="appearance-none bg-white/10 border border-white/30 rounded-full pl-4 pr-10 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus:border-accent-orange backdrop-blur-sm"
            >
              <optgroup label="Steden" className="bg-bg-secondary text-text-primary">
                {DUTCH_CITIES.slice(0, 10).map(c => (
                  <option key={c.name} value={c.name} className="bg-bg-secondary text-text-primary">
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="KNMI Weerstations" className="bg-bg-secondary text-text-primary">
                {DUTCH_CITIES.slice(10).map(c => (
                  <option key={c.name} value={c.name} className="bg-bg-secondary text-text-primary">
                    📡 {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/70" />
          </div>
        </div>
      </header>

      {/* Weer Vraag */}
      <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange to-accent-amber flex items-center justify-center text-sm pointer-events-none">🤖</div>
          <input
            type="text"
            placeholder="Stel een vraag over het weer..."
            className="w-full py-3 pl-14 pr-12 rounded-full border border-black/10 bg-white/70 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10 focus:bg-white/90 transition-all"
            value={chatInput}
            onChange={(e) => { setChatInput(e.target.value); setChatAnswer(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && chatInput.trim()) { answerQuestion(chatInput); setChatInput(''); } }}
          />
          <button
            onClick={() => { if (chatInput.trim()) { answerQuestion(chatInput); setChatInput(''); } }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent-orange text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {chatAnswer && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex items-start gap-2.5 px-3 py-2.5 bg-accent-orange/10 rounded-xl border border-accent-orange/20"
            >
              <span className="text-base shrink-0 mt-0.5">💬</span>
              <p className="text-sm font-medium text-text-primary leading-relaxed">{chatAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex overflow-x-auto gap-2 mt-3 pb-1 no-scrollbar">
          {[
            { q: "Jas mee?", icon: "🧥" },
            { q: "Kan ik hardlopen?", icon: "🏃‍♂️" },
            { q: "Wordt het morgen beter?", icon: "🗓️" },
            { q: "Gaat het regenen?", icon: "🌧️" },
            { q: "Kan ik fietsen?", icon: "🚴" },
            { q: "Hoe hard waait het?", icon: "💨" },
          ].map(({ q, icon }) => (
            <button key={q} onClick={() => answerQuestion(q)} className="chip flex-shrink-0">
              {icon} {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weather Card */}
      <div className="card overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="gradient-line absolute top-0 left-0 right-0" />
        
        <div className="p-6">
          <div className="text-sm font-medium text-text-secondary flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-accent-red" />
            {city.name} — {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          
          <div className="flex justify-between items-start mt-4">
            <div className="flex items-start">
              <span className="text-7xl font-bold tracking-tighter leading-none">{weather.current.temperature}</span>
              <span className="text-4xl font-semibold mt-1">°C</span>
            </div>
            
            <div className="text-7xl leading-none">
              {getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}
            </div>
          </div>
          
          <div className="mt-8 bg-accent-orange/15 border-l-4 border-accent-orange p-4 rounded-r-lg">
            <p className="font-semibold text-lg text-text-primary">
              {getMainCommentary(weather)}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="badge bg-black/5 border border-black/10 font-normal px-3 py-1.5">
              Voelt als <strong className="ml-1 text-text-primary">{weather.current.feelsLike}°</strong>
            </span>
            <span className="badge bg-black/5 border border-black/10 font-normal px-3 py-1.5">
              {getWeatherDescription(weather.current.weatherCode)}
            </span>
            <span className="badge bg-black/5 border border-black/10 font-normal px-3 py-1.5">
              Luchtvochtigheid <strong className="ml-1 text-text-primary">{weather.current.humidity}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Quote section */}
      <div className="card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-orange to-transparent opacity-50" />
        <div className="text-4xl mb-4">☀️</div>
        <AnimatePresence mode="wait">
          <motion.p 
            key={quote} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-medium text-text-primary max-w-md"
          >
            {quote}
          </motion.p>
        </AnimatePresence>
        
        <button 
          onClick={() => setQuote(getRandomQuote())}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nog een
        </button>
      </div>

      {/* Grid for minor stats */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        {/* Voelt Als */}
        <div className="card p-4">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-amber text-base">🌡️</span> Gevoelstemperatuur
          </div>
          <div className="text-3xl font-bold flex items-start">
            {weather.current.feelsLike}<span className="text-lg mt-1">°</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.feelsLike < weather.current.temperature ? "Voelt kouder dan het is" : 
             weather.current.feelsLike > weather.current.temperature ? "Voelt warmer dan het is" : 
             "Precies wat het is"}
          </div>
        </div>
        
        {/* Luchtvochtigheid */}
        <div className="card p-4">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base">💧</span> Luchtvochtigheid
          </div>
          <div className="text-3xl font-bold flex items-start">
            {weather.current.humidity}<span className="text-lg mt-1">%</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.humidity > 80 ? "Klam en benauwd" : 
             weather.current.humidity < 40 ? "Lekker droog" : 
             "Normaal Nederlands zweetweer"}
          </div>
        </div>
        
        {/* Wind */}
        <div className="card p-4">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base">🌬️</span> Wind — Bft {getWindBeaufort(weather.current.windSpeed).scale}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{weather.current.windSpeed}</span>
            <span className="text-sm font-bold text-text-primary">km/h</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            {weather.current.windDirection} • Stoten {weather.current.windGusts} km/h
          </div>
          <div className="text-xs font-medium text-text-secondary mt-2 italic">
            {getWindComment(weather.current.windSpeed, weather.current.windGusts)}
          </div>
        </div>
        
        {/* Neerslag */}
        <div className="card p-4">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-accent-cyan text-base">🌧️</span> Neerslag
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{weather.current.precipitation}</span>
            <span className="text-sm font-bold text-text-primary">mm</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            {weather.current.precipitation > 0 ? "Gewoon nat 💧" : "Droog 👍"}
          </div>
        </div>
      </div>

      {/* Model Confidence */}
      <div className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-lg">
                {weather.models.agreement >= 70 ? "🎯" : weather.models.agreement >= 40 ? "🤔" : "⚠️"}
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">{weather.models.label}</div>
                <div className="text-xs text-text-muted">{weather.models.sources.join(" + ")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="score-bar w-16">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${weather.models.agreement}%`,
                    background: weather.models.agreement >= 70 ? 'var(--accent-green)' : weather.models.agreement >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'
                  }}
                />
              </div>
              <span className="text-xs font-bold text-text-secondary">{weather.models.agreement}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Komende Uren</h3>
          <span className="text-xs text-white/60">Swipe →</span>
        </div>
        <div className="horizontal-scroll">
          {weather.hourly.slice(0, 12).map((hour, idx) => {
            const h = new Date(hour.time).getHours();
            const isNow = idx === 0;
            const confidenceColor = hour.confidence === "high" ? "bg-accent-green" : hour.confidence === "medium" ? "bg-accent-amber" : "bg-accent-red";
            return (
              <div
                key={hour.time}
                className={`card p-4 flex flex-col items-center justify-between min-w-[70px] ${isNow ? 'border-accent-orange' : ''}`}
              >
                <div className={`text-xs font-semibold ${isNow ? 'text-accent-orange' : 'text-text-secondary'}`}>
                  {isNow ? 'Nu' : `${h.toString().padStart(2, '0')}:00`}
                </div>
                <div className="text-2xl my-2">
                  {getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}
                </div>
                <div className="text-sm font-bold">{hour.temperature}°</div>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${confidenceColor}`} title={`Vertrouwen: ${hour.confidence}`} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 px-1">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-green" /><span className="text-[10px] text-white/50">Zeker</span></div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-amber" /><span className="text-[10px] text-white/50">Redelijk</span></div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-red" /><span className="text-[10px] text-white/50">Onzeker</span></div>
        </div>
      </div>

      {/* Vandaag & Morgen */}
      <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Vandaag & Morgen</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="card p-4 border border-accent-orange flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-accent-orange">Vandaag</span>
              <span className="text-xl">{getWeatherEmoji(weather.daily[0].weatherCode)}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-3xl font-bold">{weather.daily[0].tempMax}°</span>
              <span className="text-sm text-text-muted">{weather.daily[0].tempMin}°</span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              {weather.daily[0].precipitationSum > 0 ? `${weather.daily[0].precipitationSum}mm regen verwacht` : 'Geen regen verwacht'}
              <br />
              💨 Max {weather.daily[0].windSpeedMax} km/h
            </div>
          </div>
          
          <div className="card p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-text-primary">Morgen</span>
              <span className="text-xl">{getWeatherEmoji(weather.daily[1].weatherCode)}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-3xl font-bold">{weather.daily[1].tempMax}°</span>
              <span className="text-sm text-text-muted">{weather.daily[1].tempMin}°</span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              {weather.daily[1].precipitationSum > 0 ? `${weather.daily[1].precipitationSum}mm regen verwacht` : 'Geen regen verwacht'}
              <br />
              💨 Max {weather.daily[1].windSpeedMax} km/h
            </div>
          </div>
        </div>
      </div>

      {/* WeerZone-Score */}
      <div className="animate-fade-in" style={{ animationDelay: "0.7s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">WeerZone-Score</h3>
          <span className="text-xs text-white/60">Hoe erg is het écht?</span>
        </div>
        <div className="card p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-green via-accent-amber to-accent-red" />
          
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-accent-green leading-none">{kutScore}</span>
              <span className="text-xl font-bold text-text-muted">/ 10</span>
            </div>
            <div className="text-6xl leading-none">{kutEmoji}</div>
          </div>
          
          <div className="score-bar mt-6">
            <div 
              className="score-bar-fill"
              style={{ 
                width: `${kutScore * 10}%`,
                background: kutScore > 7 ? 'var(--accent-red)' : kutScore > 4 ? 'var(--accent-amber)' : 'var(--accent-green)'
              }}
            />
          </div>
          
          <p className="mt-4 font-semibold text-text-primary">{kutLabel}</p>
        </div>
      </div>

      {/* Fiets-Weer */}
      <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Fiets-Weer</h3>
          <span className="text-xs text-white/60">Durf je?</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center text-2xl">
              🚴
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-text-primary">{fietsScore}</span>
                <span className="text-sm font-semibold text-text-muted">/10</span>
              </div>
              <div className="score-bar">
                <div 
                  className="score-bar-fill"
                  style={{ 
                    width: `${fietsScore * 10}%`,
                    background: fietsScore > 7 ? 'var(--accent-green)' : fietsScore > 4 ? 'var(--accent-amber)' : 'var(--accent-red)'
                  }}
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium">{fietsLabel}</p>
        </div>
      </div>

      {/* Affiliate Spot 1 */}
      <div className="animate-fade-in" style={{ animationDelay: "0.85s" }}>
        <AffiliateCard variant="top" weather={weather} />
      </div>

      {/* Wat trek je aan? */}
      <div className="animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Wat trek je aan?</h3>
          <span className="text-xs text-white/60">Geen smoesjes meer</span>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="text-3xl">{outfitEmoji}</div>
          <div className="font-semibold text-sm">{outfitAdvice}</div>
        </div>
      </div>

      {/* Zon */}
      <div className="animate-fade-in" style={{ animationDelay: "1.0s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Zon</h3>
        </div>
        <div className="card p-6">
          <div className="flex justify-between items-end mb-6">
            <div className="text-center">
              <div className="text-xl mb-1 mt-2">🌅</div>
              <div className="text-[10px] font-bold text-text-secondary uppercase">Opkomst</div>
              <div className="text-lg font-bold">
                {new Date(weather.sunrise).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl mb-1 mt-2">🌇</div>
              <div className="text-[10px] font-bold text-text-secondary uppercase">Ondergang</div>
              <div className="text-lg font-bold">
                {new Date(weather.sunset).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          <div className="sun-arc relative">
            {(() => {
              const now = Date.now();
              const rise = new Date(weather.sunrise).getTime();
              const set = new Date(weather.sunset).getTime();
              const progress = Math.max(0, Math.min(1, (now - rise) / (set - rise)));
              const isDayTime = now >= rise && now <= set;
              // Arc: left=0%, right=100%, bottom at edges, top at center
              const leftPct = progress * 100;
              // Sine curve for the arc height (0 at edges, max at center)
              const arcHeight = Math.sin(progress * Math.PI) * 100;
              return isDayTime ? (
                <div
                  className="absolute w-3.5 h-3.5 bg-accent-amber rounded-full shadow-[0_0_12px_3px_rgba(240,160,64,0.5)] transition-all duration-1000"
                  style={{
                    left: `${leftPct}%`,
                    bottom: `${arcHeight}%`,
                    transform: "translate(-50%, 50%)",
                  }}
                />
              ) : (
                <div
                  className="absolute bottom-0 w-3 h-3 bg-gray-400 rounded-full opacity-50"
                  style={{ left: now < rise ? "0%" : "100%", transform: "translate(-50%, 50%)" }}
                />
              );
            })()}
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-sm font-medium text-text-secondary">UV-index vandaag</span>
            <span className="badge" style={{ backgroundColor: `${uvInfo.color}30`, color: uvInfo.color, border: `1px solid ${uvInfo.color}50` }}>
              {weather.uvIndex.toFixed(1)} — {uvInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Eerlijk vs Onzin */}
      <div className="animate-fade-in" style={{ animationDelay: "1.1s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">Eerlijk VS Onzin</h3>
        </div>
        <div className="card p-4 overflow-hidden relative">
          <div className="grid grid-cols-2 gap-4">
            {/* WeerZone side */}
            <div className="p-4 border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.05)] rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-accent-green font-bold text-xs uppercase flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  WeerZone
                </h4>
                <div className="text-sm font-semibold text-text-primary mb-1">48 uur, twee modellen</div>
                <div className="text-xs text-text-muted">KNMI HARMONIE + DWD ICON. Supercomputers, niet onderbuikgevoel.</div>
              </div>
              <div className="mt-4 px-3 py-1.5 bg-[rgba(52,211,153,0.1)] text-accent-green text-xs font-bold text-center rounded-lg">
                Bewezen nauwkeurig.
              </div>
            </div>

            {/* Onzin side */}
            <div className="p-4 border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] rounded-xl opacity-80 flex flex-col justify-between">
              <div>
                <h4 className="text-accent-red font-bold text-xs uppercase flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Die andere apps
                </h4>
                <div className="text-sm font-semibold text-text-primary mb-1">"14-daagse voorspelling"</div>
                <div className="text-xs text-text-muted opacity-50 filter blur-[0.5px]">
                  Vr. ☁️ 11°/21°<br />
                  Za. 🌥️ 8°/16°<br />
                  Zo. 🌧️ 9°/14°
                </div>
              </div>
              <div className="mt-4 px-3 py-1.5 bg-[rgba(239,68,68,0.1)] text-accent-red text-[10px] font-bold text-center rounded-lg leading-tight">
                Compleet verzonnen.<br/>Net zo betrouwbaar als je horoscoop.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Spot 2 */}
      <div className="animate-fade-in" style={{ animationDelay: "1.15s" }}>
        <AffiliateCard variant="bottom" weather={weather} />
      </div>

      {/* Footer / Share */}
      <footer className="pt-8 pb-4 text-center animate-fade-in" style={{ animationDelay: "1.2s" }}>
        <button onClick={handleShare} className="btn-cta mx-auto">
          <Send className="w-4 h-4 ml-[-4px]" /> Deel het weer
        </button>

        <p className="text-[10px] text-white/50 mt-8 uppercase font-semibold tracking-wider">
          WeerZone — 48 uur. De rest is gelul.
        </p>
        <p className="text-[10px] text-white/50 mt-1">
          Data via <a href="https://open-meteo.com" className="text-accent-orange hover:underline">Open-Meteo</a> · KNMI HARMONIE · DWD ICON.
          Twee supercomputers, nul gelul.
        </p>
      </footer>
    </div>
    </>
  );
}
