"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import type { City } from "@/lib/types";

interface Props {
  city: City;
}

export default function WeatherAlarm({ city }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("Notification" in window);
    if (localStorage.getItem("wz_alarm") === "on") setEnabled(true);
  }, []);

  const checkWeather = useCallback(async () => {
    if (Notification.permission !== "granted") return;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&hourly=precipitation,weather_code&timezone=Europe/Amsterdam&forecast_hours=6`
      );
      const data = await res.json();
      const precip = data.hourly?.precipitation || [];
      const codes = data.hourly?.weather_code || [];
      const times = data.hourly?.time || [];

      // Regen binnen 2 uur
      const rainIdx = precip.slice(0, 3).findIndex((p: number) => p > 0.3);
      if (rainIdx >= 0) {
        const t = new Date(times[rainIdx]).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
        const lastShown = localStorage.getItem("wz_alarm_last_rain");
        const key = `rain-${new Date().toISOString().slice(0, 13)}`;
        if (lastShown !== key) {
          new Notification("WEERZONE — Regen op komst", {
            body: `Regen verwacht in ${city.name} om ${t}. Paraplu mee!`,
            icon: "/weerzone-icon.png",
            tag: "wz-rain",
          });
          localStorage.setItem("wz_alarm_last_rain", key);
        }
      }

      // Onweer binnen 6 uur
      const stormIdx = codes.findIndex((c: number) => c >= 95);
      if (stormIdx >= 0) {
        const t = new Date(times[stormIdx]).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
        const lastShown = localStorage.getItem("wz_alarm_last_storm");
        const key = `storm-${new Date().toISOString().slice(0, 13)}`;
        if (lastShown !== key) {
          new Notification("WEERZONE — Onweer!", {
            body: `Onweer verwacht in ${city.name} rond ${t}. Ga naar binnen.`,
            icon: "/weerzone-icon.png",
            tag: "wz-storm",
          });
          localStorage.setItem("wz_alarm_last_storm", key);
        }
      }
    } catch (e) {
      console.error("WEERZONE alarm check failed:", e);
    }
  }, [city]);

  useEffect(() => {
    if (!enabled || !supported) return;

    // Check direct
    checkWeather();
    // Check elke 15 minuten
    const id = setInterval(checkWeather, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, supported, checkWeather]);

  async function toggleAlarm() {
    if (!supported) return;

    if (enabled) {
      setEnabled(false);
      localStorage.setItem("wz_alarm", "off");
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setEnabled(true);
      localStorage.setItem("wz_alarm", "on");
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggleAlarm}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
        enabled
          ? "bg-accent-orange text-text-primary shadow-sm"
          : "border border-white/25 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
      }`}
      title={enabled ? "Weer-alarm uit" : "Weer-alarm aan"}
      aria-label={enabled ? "Weer-alarm uit" : "Weer-alarm aan"}
    >
      {enabled ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
    </button>
  );
}
