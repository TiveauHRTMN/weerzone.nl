"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import type { City } from "@/lib/types";

interface Props {
  city: City;
}

export default function WeatherAlarm({ city }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported("Notification" in window && "serviceWorker" in navigator);
    // Check if already enabled
    const saved = localStorage.getItem("wz_alarm");
    if (saved === "on") setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return;

    // Register SW and start checking
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check immediately
      checkNow(reg);
      // Then every 30 minutes
      const id = setInterval(() => checkNow(reg), 30 * 60 * 1000);
      setIntervalId(id);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, city.name]);

  function checkNow(reg: ServiceWorkerRegistration) {
    reg.active?.postMessage({
      type: "CHECK_WEATHER",
      city: city.name,
      lat: city.lat,
      lon: city.lon,
    });
  }

  async function toggleAlarm() {
    if (!supported) return;

    if (enabled) {
      setEnabled(false);
      localStorage.setItem("wz_alarm", "off");
      if (intervalId) clearInterval(intervalId);
      return;
    }

    // Request notification permission
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
          ? "bg-accent-orange text-white shadow-sm"
          : "border border-white/25 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
      }`}
      title={enabled ? "Regen-alarm uit" : "Regen-alarm aan"}
    >
      {enabled ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
    </button>
  );
}
