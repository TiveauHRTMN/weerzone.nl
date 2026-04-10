"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Send, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle } from "lucide-react";
import { LogoFull } from "./Logo";
import LoadingScreen from "./LoadingScreen";
import { getWeather } from "@/app/actions";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData } from "@/lib/types";
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
import { getTemperatureComparison } from "@/lib/climate";
import { motion, AnimatePresence } from "framer-motion";
import WeatherBackground from "./WeatherBackground";
import WeatherParticles from "./WeatherParticles";
import WeatherAlarm from "./WeatherAlarm";
import AffiliateCard from "./AffiliateCard";
import AuthGate from "./AuthGate";

interface DashboardProps {
  initialCity?: City;
}

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Support custom GPS-based cities (have lat/lon stored)
      if (parsed.name && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
      }
      return DUTCH_CITIES.find(c => c.name === parsed.name) || null;
    }
  } catch {}
  return null;
}

export default function WeatherDashboard({ initialCity }: DashboardProps = {}) {
  const [city, setCity] = useState<City>(initialCity || DUTCH_CITIES.find(c => c.name === "Alkmaar") || DUTCH_CITIES[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [hourlyMetric, setHourlyMetric] = useState<"temp" | "rain" | "wind">("temp");

  const answerQuestion = (q: string) => {
    if (!weather) return;
    const lower = q.toLowerCase();
    const rain = weather.current.precipitation > 0;
    const rainMm = weather.current.precipitation;
    const rainSoon = weather.hourly.slice(0, 6).some(h => h.precipitation > 0.5);
    const firstRainHour = weather.hourly.slice(0, 12).find(h => h.precipitation > 0.1);
    const firstDryHour = rain ? weather.hourly.slice(0, 12).find(h => h.precipitation === 0) : null;
    const temp = weather.current.temperature;
    const feelsLike = weather.current.feelsLike;
    const wind = weather.current.windSpeed;
    const gusts = weather.current.windGusts;
    const humidity = weather.current.humidity;
    const tomorrow = weather.daily[1];
    const today = weather.daily[0];
    const sunset = new Date(weather.sunset);
    const sunrise = new Date(weather.sunrise);
    const sunsetStr = sunset.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const sunriseStr = sunrise.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const fmt = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const beaufort = getWindBeaufort(wind);

    if (lower.includes("jas") || lower.includes("jacket") || lower.includes("kou")) {
      if (temp < 5) {
        setChatAnswer(`${temp}°, voelt als ${feelsLike}°. Winterjas. Sjaal. Handschoenen. De hele rambam. Dit is geen grapje — je bevriest binnen 10 minuten als je stoer gaat doen. Wind: ${wind} km/h, dat maakt het nóg erger. 🧥❄️`);
      } else if (temp < 12 || rain) {
        setChatAnswer(`${temp}° (voelt als ${feelsLike}°)${rain ? `, en het regent ${rainMm}mm` : ''}. Ja, jas mee. ${wind > 25 ? `Met die ${wind} km/h wind wil je er eentje die dicht kan.` : ''} ${rain ? 'Waterdicht is geen luxe, het is een vereiste.' : 'Een stevig jack is genoeg.'} ${humidity > 75 ? 'Bonus: die luchtvochtigheid van ' + humidity + '% maakt alles klammer dan het klinkt.' : ''} 🧥`);
      } else if (temp < 18) {
        setChatAnswer(`${temp}°, best aangenaam eigenlijk. Een licht jasje of vest is handig voor als de zon wegvalt — na ${sunsetStr} koelt het snel af. Maar nu? Lekker. ${wind > 20 ? `Let op: ${wind} km/h wind, dus het voelt als ${feelsLike}°.` : ''} 😎`);
      } else {
        setChatAnswer(`${temp}°. Jas? Nee joh. T-shirtje, zonnebril op, de wereld is mooi. ${weather.uvIndex > 5 ? `Wél smeren: UV ${weather.uvIndex.toFixed(1)}. Je huid is geen leer.` : ''} ${temp > 25 ? 'Eigenlijk is zelfs een T-shirt al te veel, maar we houden het netjes.' : ''} ☀️`);
      }
    } else if (lower.includes("hardlop") || lower.includes("rennen") || lower.includes("joggen") || lower.includes("sporten")) {
      const ok = !rain && wind < 35 && temp > 2 && temp < 32;
      if (ok) {
        const ideal = temp >= 8 && temp <= 18 && wind < 20;
        setChatAnswer(`${temp}°, ${rain ? 'nat' : 'droog'}, wind ${wind} km/h (Bft ${beaufort.scale}). ${ideal ? 'Dit zijn perfecte hardloopomstandigheden. Serieus. Geen excuus. Je schoenen staan al bij de deur.' : `Kan prima, maar ${temp > 25 ? 'drink extra — bij deze temperatuur droog je sneller uit dan je denkt' : wind > 20 ? `die ${wind} km/h wind ga je merken in je rondetijden` : 'let op de zon'}.`} ${weather.uvIndex > 4 ? `UV ${weather.uvIndex.toFixed(1)} — pet op of zonnebrand.` : ''} Zon onder om ${sunsetStr}, plan daar omheen. 🏃‍♂️`);
      } else {
        const reason = rain ? `Het regent ${rainMm}mm en ${firstDryHour ? `het wordt pas droog rond ${fmt(new Date(firstDryHour.time))}` : 'er zit geen droog moment aan te komen'}` : wind > 35 ? `${wind} km/h wind (Bft ${beaufort.scale}) — je staat stil op de heenweg en vliegt terug` : temp <= 2 ? `${temp}° (voelt als ${feelsLike}°). Je longen bevriezen en je spieren haten je` : `${temp}°. Je lichaam is geen radiator`;
        setChatAnswer(`Niet doen. ${reason}. ${rain && !firstDryHour ? 'Binnensport, yoga, of gewoon Netflix.' : rain && firstDryHour ? `Wacht tot ${fmt(new Date(firstDryHour.time))} — dan heb je een droog venster.` : 'De bank is ook een bestemming.'} Morgen: ${tomorrow.tempMax}°${tomorrow.precipitationSum > 0 ? `, ${tomorrow.precipitationSum}mm regen` : ', droog'}. ${tomorrow.precipitationSum === 0 && tomorrow.tempMax > 5 && tomorrow.tempMax < 28 ? 'Betere kans.' : 'Ook niet geweldig eerlijk gezegd.'} 🛋️`);
      }
    } else if (lower.includes("morgen") || lower.includes("beter") || lower.includes("overmorgen")) {
      const betterTemp = tomorrow.tempMax > today.tempMax;
      const lessRain = tomorrow.precipitationSum < today.precipitationSum;
      const tomorrowWind = tomorrow.windSpeedMax;
      const diff = tomorrow.tempMax - today.tempMax;
      if (betterTemp && lessRain) {
        setChatAnswer(`Ja! Morgen wordt beter. ${tomorrow.tempMax}° (${diff > 0 ? '+' : ''}${diff}° vs vandaag), ${tomorrow.precipitationSum === 0 ? 'helemaal droog' : `minder regen (${tomorrow.precipitationSum}mm vs ${today.precipitationSum}mm)`}. Wind max ${tomorrowWind} km/h. ${diff >= 5 ? 'Dat is een serieus verschil — plan je buitenactiviteiten voor morgen.' : 'Niet spectaculair, maar de trend is goed.'} 📈`);
      } else if (betterTemp) {
        setChatAnswer(`Morgen wordt warmer (${tomorrow.tempMax}°, nu ${today.tempMax}°), maar ${tomorrow.precipitationSum > 0 ? `er valt ${tomorrow.precipitationSum}mm regen` : `qua weer verder vergelijkbaar`}. Wind tot ${tomorrowWind} km/h. ${tomorrow.precipitationSum > today.precipitationSum ? 'Eerlijk? Vandaag is droger. Ga nu.' : 'Maakt niet veel uit welke dag je kiest.'} 🤷`);
      } else if (lessRain) {
        setChatAnswer(`Morgen wordt kouder (${tomorrow.tempMax}° vs ${today.tempMax}°), maar wél droger${tomorrow.precipitationSum === 0 ? ' — geen druppel verwacht' : ` (${tomorrow.precipitationSum}mm vs ${today.precipitationSum}mm)`}. Wat je prioriteit is bepaalt je keuze. Warmte? Ga vandaag. Droog? Wacht op morgen. 📊`);
      } else {
        setChatAnswer(`Nee. Morgen wordt ${tomorrow.tempMax}° (vandaag ${today.tempMax}°) met ${tomorrow.precipitationSum}mm neerslag en wind tot ${tomorrowWind} km/h. ${tomorrow.tempMax < today.tempMax && tomorrow.precipitationSum > today.precipitationSum ? 'Kouder én natter. Vandaag is letterlijk je beste optie.' : 'Vergelijkbaar, maar de trend zit niet mee.'} Tip: als je iets buiten moet doen, doe het vandaag. 📉`);
      }
    } else if (lower.includes("fiets") || lower.includes("fietsen") || lower.includes("ebike") || lower.includes("e-bike")) {
      const { score, label } = getFietsScore(weather);
      const headwind = wind > 25;
      setChatAnswer(`Fietsscore: ${score}/10 — ${label} ${rain ? `Het regent (${rainMm}mm). Je wordt nat. Punt.` : ''} ${headwind ? `Wind: ${wind} km/h (Bft ${beaufort.scale}). Tegenwind is gratis conditietraining, zeggen ze. Wij zeggen: neem de bus.` : wind > 15 ? `Wind: ${wind} km/h, merkbaar maar te doen.` : 'Nauwelijks wind, prima fietsomstandigheden.'} ${temp < 5 ? `Bij ${temp}° worden je handen gevoelloos na 15 minuten. Handschoenen.` : temp > 28 ? `Bij ${temp}° wil je water meenemen. Niet optioneel.` : ''} ${score >= 8 ? 'Geniet ervan — dit soort fietsweer is zeldzaam in Nederland. 🚴' : score <= 3 ? 'Eerlijk advies? Neem vandaag de auto. Of werk thuis. 🚗' : '🚴'}`);
    } else if (lower.includes("regen") || lower.includes("nat") || lower.includes("droog") || lower.includes("bui")) {
      if (rain) {
        setChatAnswer(`Ja, het regent nu. ${rainMm}mm neerslag op dit moment. ${firstDryHour ? `Droog venster verwacht rond ${fmt(new Date(firstDryHour.time))} — als je iets buiten moet doen, wacht tot dan.` : 'En eerlijk? We zien de komende uren geen droog moment. Paraplu of accepteer je lot.'} Vandaag totaal: ${today.precipitationSum}mm verwacht. ${today.precipitationSum > 10 ? 'Dat is flink. Houd rekening met plassen op straat.' : today.precipitationSum > 5 ? 'Gemiddelde regendag voor Nederland.' : 'Valt mee qua hoeveelheid.'} ☔`);
      } else if (rainSoon) {
        setChatAnswer(`Nu droog, maar niet lang meer. ${firstRainHour ? `Eerste regen verwacht om ${fmt(new Date(firstRainHour.time))}.` : 'In de komende uren wordt het nat.'} Vandaag totaal: ${today.precipitationSum}mm. ${today.precipitationSum > 0 ? 'Paraplu meenemen is geen suggestie, het is een order.' : ''} Morgen: ${tomorrow.precipitationSum > 0 ? `${tomorrow.precipitationSum}mm, ook nat` : 'droog! Houd vol'}. 🌦️`);
      } else {
        setChatAnswer(`Droog. Nu, en de komende uren. Vandaag: ${today.precipitationSum > 0 ? `later valt er nog ${today.precipitationSum}mm, dus geniet van het droge venster` : 'de hele dag geen druppel verwacht'}. Morgen: ${tomorrow.precipitationSum > 0 ? `${tomorrow.precipitationSum}mm regen verwacht — vandaag is de dag om buiten te zijn` : 'ook droog. Luxe.'}. Ga naar buiten. Nu. ☀️`);
      }
    } else if (lower.includes("zon") || lower.includes("zonnig") || lower.includes("uv") || lower.includes("zonnebrand")) {
      const uvVal = weather.uvIndex;
      const cloudCover = weather.current.cloudCover;
      setChatAnswer(`Zon op om ${sunriseStr}, onder om ${sunsetStr}. UV-index: ${uvVal.toFixed(1)}. ${uvVal >= 8 ? 'EXTREEM. Smeren met SPF50, hoed op, zonnebril. Geen discussie. Je huid onthoud elke verbranding.' : uvVal >= 6 ? 'Hoog. Zonnebrand is verplicht. Elke 2 uur opnieuw aanbrengen, ook als je denkt dat het meevalt.' : uvVal >= 3 ? 'Matig. Bij langdurig buiten zijn toch smeren — je merkt het pas als het te laat is.' : 'Laag. Je overleeft het zonder zonnebrand, maar het kan altijd.'} Bewolking nu: ${cloudCover}%. ${cloudCover < 25 ? 'Strakblauwe lucht.' : cloudCover < 50 ? 'Half bewolkt, zon breekt geregeld door.' : cloudCover < 80 ? 'Overwegend bewolkt, af en toe een glimp zon.' : 'Dichtbewolkt. De zon is er, maar je ziet hem niet.'} ☀️`);
    } else if (lower.includes("wind") || lower.includes("waai") || lower.includes("storm")) {
      setChatAnswer(`Wind: ${wind} km/h (Beaufort ${beaufort.scale}: ${beaufort.label}). Windstoten tot ${gusts} km/h — dat is het getal waar je je aan vast moet houden. Richting: ${weather.current.windDirection}. ${gusts > 60 ? 'Bij deze windstoten waait alles om wat niet vastgebonden is. Tuinmeubels naar binnen, fiets op slot in de schuur, en niet onder bomen lopen.' : gusts > 40 ? 'Flink. Fietsen wordt een avontuur, paraplu is zinloos (waait binnenstebuiten), en je kapsel is sowieso naar de klote.' : wind > 20 ? 'Merkbaar, maar je overleeft het. Jas dicht, en verwacht dat alles 2 graden kouder aanvoelt.' : 'Rustig. Wind is nauwelijks een factor vandaag.'} 💨`);
    } else if (lower.includes("station") || lower.includes("waar") || lower.includes("locatie") || lower.includes("dichtbij") || lower.includes("meetpunt")) {
      setChatAnswer(`📍 Je bekijkt nu het weer bij ${city.name} (${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°O). Dit is ${city.name.includes("Airport") || city.name.includes("Meetstation") ? 'een KNMI weerstation' : 'gekoppeld aan het dichtstbijzijnde KNMI meetpunt'}. Klik op het 📍 icoontje linksboven voor je exacte locatie — we koppelen je automatisch aan het dichtstbijzijnde station. We hebben ${DUTCH_CITIES.length} meetpunten door heel Nederland. Altijd een in de buurt.`);
    } else if (lower.includes("hoe werkt") || lower.includes("nauwkeurig") || lower.includes("betrouwbaar") || lower.includes("model") || lower.includes("weerzone")) {
      setChatAnswer(`WeerZone draait op twee professionele weermodellen: KNMI HARMONIE (het Nederlandse supercomputer-model, 2.5km resolutie) en DWD ICON (het Duitse model). We tonen maximaal 48 uur — langer is wetenschappelijk gezien klinkklare onzin. Modelovereenkomst nu: ${weather.models.agreement}%. ${weather.models.agreement >= 80 ? 'Beide modellen zijn het roerend eens. Dit gaat zo gebeuren.' : weather.models.agreement >= 60 ? 'Redelijke overeenstemming. De grote lijn klopt, details kunnen afwijken.' : 'De modellen twijfelen. Wij tonen dat eerlijk — andere apps verbergen die onzekerheid.'} We updaten elk uur. Geen 14-daagse fantasie, geen sponsoring door parapluverkopers. Gewoon data. 🎯`);
    } else if (lower.includes("wat trek") || lower.includes("kleding") || lower.includes("aantrekken") || lower.includes("outfit")) {
      const { emoji, advice } = getOutfitAdvice(weather);
      setChatAnswer(`${emoji} ${advice} Details: ${temp}° (voelt als ${feelsLike}°), ${rain ? `regen (${rainMm}mm)` : 'droog'}, wind ${wind} km/h. ${temp < 5 ? 'Laagjes. Thermo ondergoed als je lang buiten bent.' : temp < 12 ? 'Trui + jas, de klassieke Nederlandse combo.' : temp < 20 ? 'Licht jasje of vest, eventueel in je tas.' : 'Zo min mogelijk. Maar zonnebrand wél.'} ${rain ? 'Waterdichte laag is verplicht, niet optioneel.' : ''}`);
    } else if (lower.includes("bbq") || lower.includes("barbecue") || lower.includes("grill")) {
      const bbqOk = !rain && wind < 30 && temp > 12;
      setChatAnswer(bbqOk ? `${temp}°, ${rain ? 'nat' : 'droog'}, wind ${wind} km/h. Ja, BBQ is een go! ${wind > 15 ? 'Let op met aansteken — die wind blaast je briketten uit.' : 'Perfect BBQ-weer.'} ${temp > 25 ? 'Biertje koud houden, het is warm.' : 'Zet die BBQ aan en geniet.'} Zon onder om ${sunsetStr}, dus begin op tijd als je bij daglicht wilt eten. 🔥🥩` : `Nee. ${rain ? `Het regent ${rainMm}mm. Tenzij je een overkapping hebt, wordt het niks.` : wind > 30 ? `${wind} km/h wind. Je BBQ waait om en je buurman belt 112.` : `${temp}°. Dan sta je te kleumen bij je grill. Oven aan, bevroren pizza erin.`} 🚫`);
    } else if (lower.includes("was") || lower.includes("droger") || lower.includes("waslijn") || lower.includes("buiten hangen")) {
      const wasOk = !rain && !rainSoon && wind > 5 && humidity < 75;
      setChatAnswer(wasOk ? `Ja! ${temp}°, ${humidity}% luchtvochtigheid, wind ${wind} km/h. ${humidity < 50 ? 'Perfecte wasdag — je kleren zijn binnen een paar uur droog.' : 'Prima, maar met deze luchtvochtigheid duurt het wat langer. Dunne was droogt snel, handdoeken hebben de middag nodig.'} ${rainSoon ? 'Let op: later kans op regen. Haal het op tijd binnen.' : `Droog tot ${sunsetStr}.`} 👕` : `Nee. ${rain ? 'Het regent — je was wordt natter dan hij was.' : rainSoon ? 'Het gaat zo regenen. Begin er niet aan.' : humidity > 75 ? `${humidity}% luchtvochtigheid. Je was droogt niet, het wordt gewoon vochtig en gaat stinken.` : 'Geen wind. Alles blijft nat hangen.'} Droger het is. 🫧`);
    } else {
      // Fallback: geef een compleet overzicht
      setChatAnswer(`${temp}° in ${city.name} (voelt als ${feelsLike}°). ${rain ? `Regen: ${rainMm}mm` : 'Droog'}. Wind: ${wind} km/h (Bft ${beaufort.scale}), stoten ${gusts} km/h. Luchtvochtigheid: ${humidity}%. UV: ${weather.uvIndex.toFixed(1)}. ${getMainCommentary(weather)} Morgen: ${tomorrow.tempMax}°/${tomorrow.tempMin}°, ${tomorrow.precipitationSum > 0 ? `${tomorrow.precipitationSum}mm regen` : 'droog'}. Vraag gerust specifieker — jas, fietsen, hardlopen, BBQ, was ophangen, je kunt het zo gek niet bedenken. 🌤️`);
    }
  };

  const handleShare = async () => {
    if (!weather) return;
    const emoji = getWeatherEmoji(weather.current.weatherCode, weather.current.isDay);
    const text = `${emoji} ${weather.current.temperature}° in ${city.name} — ${getMainCommentary(weather)}\n\nweerzone.nl — 48 uur. De rest is ruis.`;

    // Try sharing with image first (mobile), fallback to text
    const shareUrl = `/api/share?city=${encodeURIComponent(city.name)}&temp=${weather.current.temperature}&emoji=${encodeURIComponent(emoji)}&desc=${encodeURIComponent(getMainCommentary(weather))}&feels=${weather.current.feelsLike}&wind=${weather.current.windSpeed}&rain=${weather.current.precipitation}`;

    try {
      if (navigator.share) {
        // Try share with image on supporting browsers
        try {
          const res = await fetch(shareUrl);
          const blob = await res.blob();
          const file = new File([blob], `weerzone-${city.name.toLowerCase()}.png`, { type: "image/png" });
          await navigator.share({
            title: `Weer in ${city.name}`,
            text,
            url: "https://weerzone.nl",
            files: [file],
          });
        } catch {
          // Fallback: share without image
          await navigator.share({ title: `Weer in ${city.name}`, text, url: "https://weerzone.nl" });
        }
      } else {
        await navigator.clipboard.writeText(text);
        alert("Weer gekopieerd naar klembord! 📋");
      }
    } catch {}
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

  // Persist city choice
  useEffect(() => {
    localStorage.setItem("wz_city", JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }));
  }, [city]);

  // On mount: restore saved city or auto-geolocate
  useEffect(() => {
    setQuote(getRandomQuote());
    const saved = getSavedCity();
    if (saved) {
      setCity(saved);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const [geoCity, data] = await Promise.all([
              reverseGeocode(latitude, longitude),
              getWeather(latitude, longitude),
            ]);
            setWeather(data);
            setCity(geoCity);
            setLoading(false);
          } catch {
            fetchWeather(city);
          }
        },
        () => fetchWeather(city),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return; // Don't call fetchWeather below — geolocation will handle it
    }
    fetchWeather(saved || city);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when city changes (but not on mount — handled above)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) { setMounted(true); return; }
    setQuote(getRandomQuote());
    fetchWeather(city);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const [geoCity, data] = await Promise.all([
              reverseGeocode(latitude, longitude),
              getWeather(latitude, longitude),
            ]);
            setWeather(data);
            setCity(geoCity);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  if (loading || !weather) {
    return <LoadingScreen />;
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
      <header className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoFull height={40} className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)] sm:hidden" />
            <LogoFull height={48} className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)] hidden sm:block" />
            <span className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest hidden sm:block">48 uur. De rest is ruis.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <WeatherAlarm city={city} />
            <button
              onClick={handleLocationClick}
              aria-label={`Locatie: ${city.name}`}
              className="flex items-center gap-2 h-10 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-3 hover:bg-white/20 active:scale-[0.97] transition-all"
            >
              <MapPin className="text-white w-4 h-4" />
              <span className="text-xs font-semibold text-white">{city.name}</span>
            </button>
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
            aria-label="Vraag versturen"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent-orange text-text-primary flex items-center justify-center hover:brightness-90 transition-colors"
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
        <WeatherParticles weatherCode={weather.current.weatherCode} isDay={weather.current.isDay} />
        <div className="p-6 relative z-[2]">
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
            {(() => {
              const climate = getTemperatureComparison(weather.current.temperature, new Date().getMonth());
              const isWarm = climate.diff > 0;
              return Math.abs(climate.diff) >= 1 ? (
                <span className={`badge font-normal px-3 py-1.5 ${isWarm ? 'bg-orange-100/80 border border-orange-200/60 text-orange-700' : 'bg-blue-100/80 border border-blue-200/60 text-blue-700'}`}>
                  {climate.emoji} {isWarm ? '+' : ''}{climate.diff}° vs normaal
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* Extreem Weer Alert */}
      {(() => {
        // Scan 48h data for extreme conditions
        type Alert = { icon: string; title: string; detail: string; severity: "orange" | "red" };
        const alerts: Alert[] = [];
        const allHours = weather.hourly;
        const today = weather.daily[0];
        const tomorrow = weather.daily[1];

        // Storm: wind > 75 km/h
        const maxWindHour = allHours.reduce((max, h) => h.windSpeed > max.windSpeed ? h : max, allHours[0]);
        if (maxWindHour.windSpeed >= 75) {
          const t = new Date(maxWindHour.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "🌪️", title: "Stormachtig", detail: `Windstoten tot ${maxWindHour.windSpeed} km/h verwacht rond ${t}.`, severity: "red" });
        } else if (maxWindHour.windSpeed >= 50) {
          const t = new Date(maxWindHour.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "💨", title: "Krachtige wind", detail: `Wind tot ${maxWindHour.windSpeed} km/h rond ${t}. Fietsen wordt avontuurlijk.`, severity: "orange" });
        }

        // Extreme hitte: > 30°C
        if (today.tempMax >= 35 || tomorrow.tempMax >= 35) {
          const day = today.tempMax >= 35 ? "vandaag" : "morgen";
          const temp = today.tempMax >= 35 ? today.tempMax : tomorrow.tempMax;
          alerts.push({ icon: "🔥", title: "Extreme hitte", detail: `${temp}° verwacht ${day}. Blijf hydrateren. Serieus.`, severity: "red" });
        } else if (today.tempMax >= 30 || tomorrow.tempMax >= 30) {
          const day = today.tempMax >= 30 ? "vandaag" : "morgen";
          const temp = today.tempMax >= 30 ? today.tempMax : tomorrow.tempMax;
          alerts.push({ icon: "☀️", title: "Tropisch warm", detail: `${temp}° verwacht ${day}. Smeer je in en zoek schaduw.`, severity: "orange" });
        }

        // Strenge vorst: < -5°C
        if (today.tempMin <= -10 || tomorrow.tempMin <= -10) {
          alerts.push({ icon: "🥶", title: "Strenge vorst", detail: `Tot ${Math.min(today.tempMin, tomorrow.tempMin)}°. Alles bevriest. Leidingen beschermen.`, severity: "red" });
        } else if (today.tempMin <= -5 || tomorrow.tempMin <= -5) {
          alerts.push({ icon: "❄️", title: "Vorst", detail: `Minimaal ${Math.min(today.tempMin, tomorrow.tempMin)}°. Gladheid op de weg.`, severity: "orange" });
        }

        // Onweer
        const thunderHours = allHours.filter(h => h.weatherCode >= 95);
        if (thunderHours.length > 0) {
          const firstT = new Date(thunderHours[0].time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
          alerts.push({ icon: "⛈️", title: "Onweer verwacht", detail: `Onweer mogelijk vanaf ${firstT}. Blijf uit de buurt van open water en bomen.`, severity: thunderHours.length > 3 ? "red" : "orange" });
        }

        // Zware neerslag: > 15mm/dag
        if (today.precipitationSum >= 25 || tomorrow.precipitationSum >= 25) {
          const day = today.precipitationSum >= 25 ? "vandaag" : "morgen";
          const mm = today.precipitationSum >= 25 ? today.precipitationSum : tomorrow.precipitationSum;
          alerts.push({ icon: "🌊", title: "Zware neerslag", detail: `${mm}mm verwacht ${day}. Wateroverlast mogelijk.`, severity: "red" });
        } else if (today.precipitationSum >= 15 || tomorrow.precipitationSum >= 15) {
          const day = today.precipitationSum >= 15 ? "vandaag" : "morgen";
          const mm = today.precipitationSum >= 15 ? today.precipitationSum : tomorrow.precipitationSum;
          alerts.push({ icon: "🌧️", title: "Veel regen", detail: `${mm}mm verwacht ${day}. Paraplu is niet optioneel.`, severity: "orange" });
        }

        // Sneeuw
        const snowHours = allHours.filter(h => h.weatherCode >= 71 && h.weatherCode <= 77);
        if (snowHours.length > 0) {
          alerts.push({ icon: "🌨️", title: "Sneeuw verwacht", detail: `Sneeuw in de komende 48 uur. Pas op voor gladheid.`, severity: "orange" });
        }

        if (alerts.length === 0) return null;

        return (
          <div className="animate-fade-in space-y-2" style={{ animationDelay: "0.25s" }}>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`card p-4 flex items-start gap-3 border ${
                  alert.severity === "red"
                    ? "border-accent-red/40 bg-red-50/80"
                    : "border-accent-amber/40 bg-amber-50/80"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  alert.severity === "red" ? "bg-accent-red/15" : "bg-accent-amber/15"
                }`}>
                  {alert.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${
                      alert.severity === "red" ? "text-accent-red" : "text-accent-amber"
                    }`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      alert.severity === "red" ? "text-accent-red" : "text-amber-600"
                    }`}>
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary mt-1">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Quote section */}
      <div className="card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden animate-fade-in" style={{ animationDelay: "0.3s" }}>
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
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="section-title">Komende Uren</h3>
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5 border border-white/20">
            {([
              { key: "temp" as const, icon: <Thermometer className="w-3 h-3" />, label: "°C" },
              { key: "rain" as const, icon: <CloudRain className="w-3 h-3" />, label: "mm" },
              { key: "wind" as const, icon: <Wind className="w-3 h-3" />, label: "km/h" },
            ]).map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setHourlyMetric(key)}
                aria-label={`Toon ${label}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${hourlyMetric === key ? 'bg-accent-orange text-text-primary shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="horizontal-scroll">
          {weather.hourly.slice(0, 12).map((hour, idx) => {
            const h = new Date(hour.time).getHours();
            const isNow = idx === 0;
            const maxPrecip = Math.max(...weather.hourly.slice(0, 12).map(hr => hr.precipitation), 1);
            const maxWind = Math.max(...weather.hourly.slice(0, 12).map(hr => hr.windSpeed), 1);
            const rainBarH = Math.max(2, (hour.precipitation / maxPrecip) * 24);
            const windBarH = Math.max(2, (hour.windSpeed / maxWind) * 24);
            const confidenceColor = hour.confidence === "high" ? "bg-accent-green" : hour.confidence === "medium" ? "bg-accent-amber" : "bg-accent-red";
            return (
              <div
                key={hour.time}
                className={`card p-3 flex flex-col items-center justify-between min-w-[70px] gap-1 ${isNow ? 'border-accent-orange' : ''}`}
              >
                <div className={`text-xs font-semibold ${isNow ? 'text-accent-orange' : 'text-text-secondary'}`}>
                  {isNow ? 'Nu' : `${h.toString().padStart(2, '0')}:00`}
                </div>
                <div className="text-2xl my-1">
                  {getWeatherEmoji(hour.weatherCode, h > 6 && h < 21)}
                </div>
                {hourlyMetric === "temp" && (
                  <div className="text-sm font-bold">{hour.temperature}°</div>
                )}
                {hourlyMetric === "rain" && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-4 flex items-end justify-center" style={{ height: 24 }}>
                      <div className="w-full rounded-t bg-accent-cyan/70" style={{ height: rainBarH }} />
                    </div>
                    <span className="text-[10px] font-bold text-accent-cyan">{hour.precipitation > 0 ? hour.precipitation.toFixed(1) : '0'}</span>
                  </div>
                )}
                {hourlyMetric === "wind" && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-4 flex items-end justify-center" style={{ height: 24 }}>
                      <div className="w-full rounded-t bg-white/40" style={{ height: windBarH }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/70">{hour.windSpeed}</span>
                  </div>
                )}
                <div className={`w-1.5 h-1.5 rounded-full ${confidenceColor}`} title={`Vertrouwen: ${hour.confidence}`} />
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

      {/* Wanneer wordt het droog? */}
      {weather.current.precipitation > 0 || weather.hourly.slice(0, 12).some(h => h.precipitation > 0) ? (() => {
        const now = new Date();
        const upcoming = weather.hourly.slice(0, 24);
        // Find first dry window (2+ consecutive dry hours)
        let dryStart: Date | null = null;
        let dryHours = 0;
        for (let i = 0; i < upcoming.length; i++) {
          if (upcoming[i].precipitation === 0) {
            if (!dryStart) dryStart = new Date(upcoming[i].time);
            dryHours++;
          } else {
            if (dryHours >= 2) break;
            dryStart = null;
            dryHours = 0;
          }
        }
        const isCurrentlyDry = weather.current.precipitation === 0;
        // Find when rain starts if currently dry
        let rainStart: Date | null = null;
        if (isCurrentlyDry) {
          const firstRain = upcoming.find(h => h.precipitation > 0.1);
          if (firstRain) rainStart = new Date(firstRain.time);
        }
        const fmt = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        return (
          <div className="animate-fade-in" style={{ animationDelay: "0.65s" }}>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-cyan/15 rounded-full flex items-center justify-center text-2xl shrink-0">
                {isCurrentlyDry ? "🌦️" : dryStart && dryHours >= 2 ? "🌤️" : "🌧️"}
              </div>
              <div>
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  {isCurrentlyDry ? "Wanneer regent het?" : "Wanneer droog?"}
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  {isCurrentlyDry && rainStart
                    ? `Nu droog. Regen verwacht om ${fmt(rainStart)}. Pak je kans.`
                    : isCurrentlyDry
                    ? "Voorlopig droog. Geniet ervan."
                    : dryStart && dryHours >= 2
                    ? `Droog vanaf ${fmt(dryStart)} — venster van ${dryHours} uur. Wees er snel bij.`
                    : dryStart
                    ? `Korte droge pauze rond ${fmt(dryStart)}. Sprint-tempo.`
                    : "Geen droog moment in zicht. Accepteer het."}
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}

      {/* WeerZone-Score */}
      <div className="animate-fade-in" style={{ animationDelay: "0.7s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">WeerZone-Score</h3>
          <span className="text-xs text-white/60">Hoe erg is het écht?</span>
        </div>
        <div className="card p-6 overflow-hidden relative">
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

      {/* Premium: 48-uurs Impact Analyse */}
      <div className="animate-fade-in" style={{ animationDelay: "1.18s" }}>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="section-title">48-uurs Impact Analyse</h3>
          <span className="text-[10px] font-bold text-accent-orange uppercase tracking-wider">Premium</span>
        </div>
        <AuthGate>
          <div className="card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Jouw 48-uurs window</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {weather.current.precipitation > 0
                    ? `Het regent nu in ${city.name}. Verwacht de komende uren ${weather.hourly.filter(h => h.precipitation > 0).length > 6 ? 'langdurige neerslag' : 'buien die overgaan'}. ${weather.daily[1].precipitationSum > 2 ? 'Morgen ook nat — plan binnenshuis.' : 'Morgen wordt het droger.'}`
                    : weather.hourly.slice(0, 12).some(h => h.precipitation > 0.5)
                    ? `Nu droog, maar dat verandert. Binnen ${weather.hourly.findIndex(h => h.precipitation > 0.5) + 1} uur valt de eerste bui. Plan je buitenactiviteiten vóór die tijd.`
                    : `Droge 48 uur in ${city.name}. ${weather.daily[0].tempMax > 20 ? 'Warm genoeg voor buiten. Smeer je in.' : 'Prima weer om dingen gedaan te krijgen buiten.'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">👔</span>
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Slim kleden vandaag</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Ochtend {weather.hourly[0]?.temperature ?? weather.current.temperature}°, middag {weather.daily[0].tempMax}°.
                  {weather.daily[0].tempMax - (weather.hourly[0]?.temperature ?? weather.current.temperature) > 8
                    ? ' Groot verschil — laagjes zijn je vriend. Begin warm, strip af na de lunch.'
                    : ' Stabiele temperatuur — kies op het middagweer en je zit goed.'
                  }
                  {weather.hourly.slice(0, 12).some(h => h.precipitation > 0) ? ' Regenjas mee, ook al schijnt nu de zon.' : ''}
                </p>
              </div>
            </div>
          </div>
        </AuthGate>
      </div>

      {/* Footer / Share */}
      <footer className="pt-8 pb-4 text-center animate-fade-in" style={{ animationDelay: "1.2s" }}>
        <button onClick={handleShare} className="btn-cta mx-auto">
          <Send className="w-4 h-4 ml-[-4px]" /> Deel het weer
        </button>

        <p className="text-[10px] text-white/50 mt-8 uppercase font-semibold tracking-wider">
          WeerZone — 48 uur. De rest is ruis.
        </p>
        <p className="text-[10px] text-white/50 mt-1">
          Data via <a href="https://open-meteo.com" className="text-accent-orange hover:underline">Open-Meteo</a> · KNMI HARMONIE · DWD ICON.
          Twee supercomputers, nul ruis.
        </p>
      </footer>
    </div>
    </>
  );
}
