"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, AlertTriangle } from "lucide-react";
import { getWeather } from "@/app/actions";
import { DUTCH_CITIES, reverseGeocode, type City, type WeatherData } from "@/lib/types";

type Alert = { icon: string; title: string; detail: string; severity: "red" | "orange" };

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

function buildAlerts(weather: WeatherData): Alert[] {
  const alerts: Alert[] = [];
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];
  const maxWindHour = weather.hourly.slice(0, 24).reduce((a, h) => (h.windSpeed > (a?.windSpeed || 0) ? h : a), weather.hourly[0]);

  if (maxWindHour && maxWindHour.windSpeed >= 75) {
    alerts.push({ icon: "🌪️", title: "Stormachtig", detail: `Windstoten tot ${maxWindHour.windSpeed} km/h verwacht.`, severity: "red" });
  } else if (maxWindHour && maxWindHour.windSpeed >= 60) {
    alerts.push({ icon: "💨", title: "Krachtige wind", detail: `Wind tot ${maxWindHour.windSpeed} km/h. Fietsen wordt avontuurlijk.`, severity: "orange" });
  }

  const hottest = Math.max(today.tempMax, tomorrow.tempMax);
  if (hottest >= 32) alerts.push({ icon: "🔥", title: "Extreme hitte", detail: `${hottest}° verwacht. Blijf hydrateren. Serieus.`, severity: "red" });
  else if (hottest >= 28) alerts.push({ icon: "☀️", title: "Tropisch warm", detail: `${hottest}° verwacht. Smeer je in.`, severity: "orange" });

  const coldest = Math.min(today.tempMin, tomorrow.tempMin);
  if (coldest <= -5) alerts.push({ icon: "🥶", title: "Strenge vorst", detail: `Tot ${coldest}°. Alles bevriest. Leidingen beschermen.`, severity: "red" });
  else if (coldest <= 0) alerts.push({ icon: "❄️", title: "Vorst", detail: `Minimaal ${coldest}°. Gladheid op de weg.`, severity: "orange" });

  const thunderHours = weather.hourly.slice(0, 48).filter((h) => (h.cape || 0) > 1200);
  if (thunderHours.length > 0) {
    alerts.push({ icon: "⛈️", title: "Onweer verwacht", detail: `Onweerskans binnen 48 uur (CAPE tot ${Math.max(...thunderHours.map(h => h.cape))} J/kg).`, severity: thunderHours.length > 3 ? "red" : "orange" });
  }

  const heaviestDay = Math.max(today.precipitationSum, tomorrow.precipitationSum);
  if (heaviestDay >= 25) alerts.push({ icon: "🌊", title: "Zware neerslag", detail: `${heaviestDay}mm verwacht. Wateroverlast mogelijk.`, severity: "red" });
  else if (heaviestDay >= 10) alerts.push({ icon: "🌧️", title: "Veel regen", detail: `${heaviestDay}mm verwacht. Paraplu is niet optioneel.`, severity: "orange" });

  if (weather.uvIndex >= 8) alerts.push({ icon: "☀️", title: "Extreme UV-straling", detail: `UV-index ${weather.uvIndex.toFixed(1)}. Binnen tussen 12:00-15:00 of SPF50+.`, severity: "red" });
  else if (weather.uvIndex >= 6) alerts.push({ icon: "🧴", title: "Hoge UV-straling", detail: `UV-index ${weather.uvIndex.toFixed(1)}. Insmeren verplicht.`, severity: "orange" });

  return alerts;
}

export default function ReedExtended() {
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
      .then((w) => !cancelled && (setWeather(w), setLoading(false)))
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [city]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const prov: City = { name: "Jouw locatie", lat, lon };
        setCity(prov);
        localStorage.setItem("wz_city", JSON.stringify(prov));
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

  const alerts = weather ? buildAlerts(weather) : [];

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
      </div>

      {loading && <div className="card p-6 text-center text-sm text-text-secondary">Reed scant de horizon…</div>}

      {!loading && alerts.length === 0 && (
        <div className="card p-6 border border-green-500/30 bg-green-50/70 flex items-start gap-4">
          <span className="text-3xl">✅</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-700">Geen extremen</p>
            <h2 className="text-xl font-black text-text-primary mt-1">Alles rustig in {city.name}</h2>
            <p className="text-sm text-text-secondary mt-1">
              De komende 48 uur geen storm, onweer, hitte of vorst op komst. Reed stuurt alleen een mail als er wél iets serieus aankomt. Aanmelden kan op de{" "}
              <Link href="/" className="text-accent-orange hover:underline">homepage</Link>.
            </p>
          </div>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <>
          <div className="card p-4 border border-accent-red/30 bg-accent-red/5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-red shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent-red">
                {alerts.length} waarschuwing{alerts.length > 1 ? "en" : ""} voor {city.name}
              </p>
              <p className="text-xs text-text-secondary">Hieronder per type. Abonneer op de Reed-mail voor automatische alerts.</p>
            </div>
          </div>
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`card p-4 flex items-start gap-3 border ${
                a.severity === "red" ? "border-accent-red/40 bg-red-50/80" : "border-accent-amber/40 bg-amber-50/80"
              }`}
            >
              <span className="text-2xl shrink-0">{a.icon}</span>
              <div>
                <p className={`text-sm font-bold ${a.severity === "red" ? "text-accent-red" : "text-amber-700"}`}>{a.title}</p>
                <p className="text-sm text-text-primary mt-1">{a.detail}</p>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="text-center">
        <Link href="/" className="text-sm text-white/80 hover:text-white underline">
          → Terug naar het dashboard
        </Link>
      </div>
    </div>
  );
}
