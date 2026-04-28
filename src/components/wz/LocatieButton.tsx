"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

interface Props {
  active?: boolean;
  compact?: boolean;
}

type State = "idle" | "loading" | "found" | "error";

export default function LocatieButton({ active = false, compact = false }: Props) {
  const [state, setState] = useState<State>("idle");
  const [found, setFound] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);

  // Sync city name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setCurrentCity(parsed.name);
      } catch {}
    }

    // Listen for updates from other components
    const handleUpdate = () => {
      const updated = localStorage.getItem("wz_city");
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          if (parsed.name) setCurrentCity(parsed.name);
        } catch {}
      }
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("wz:city-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("wz:city-updated", handleUpdate);
    };
  }, []);

  function handleClick() {
    if (state === "loading") return;

    if (!navigator.geolocation) {
      window.location.href = "/weer";
      return;
    }

    setState("loading");
    setFound(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`/api/nearest-place?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error("API fout");
          const place = await res.json();
          if (place?.province && place?.slug) {
            setFound(place.name);
            setState("found");
            localStorage.setItem("wz_city", JSON.stringify(place));
            setTimeout(() => {
              window.location.href = `/weer/${place.province}/${place.slug}`;
            }, 800);
          } else {
            throw new Error("Geen plaats gevonden");
          }
        } catch (err) {
          console.error("Locatie error:", err);
          setState("error");
          setTimeout(() => setState("idle"), 3000);
        }
      },
      (err) => {
        console.warn("GPS fout:", err.code, err.message);
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      },
      {
        enableHighAccuracy: false, // Minder streng, sneller resultaat op mobiel/desktop
        timeout: 10000,
        maximumAge: 60 * 60000, // Gebruik cache indien beschikbaar (1 uur)
      }
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={state === "loading" || state === "found"}
        aria-label="Spring naar jouw locatie"
        className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors disabled:opacity-60"
        style={{
          borderColor: state === "error" ? "#ef4444" : active ? "var(--wz-brand)" : "var(--wz-border)",
          color: state === "error" ? "#ef4444" : active ? "var(--wz-brand)" : "var(--ink-700)",
          background: state === "found" ? "#dcfce7" : active ? "var(--wz-brand-soft)" : "transparent",
        }}
      >
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "error"   && <AlertCircle className="w-4 h-4" />}
        {(state === "idle" || state === "found") && <MapPin className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || state === "found"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-70"
      style={{
        color: state === "error" ? "#ef4444" : active ? "var(--wz-brand)" : "var(--ink-700)",
        background:
          state === "found"  ? "#dcfce7" :
          state === "error"  ? "#fee2e2" :
          active             ? "var(--wz-brand-soft)" : "transparent",
        cursor: (state === "loading" || state === "found") ? "default" : "pointer",
      }}
      title="Spring naar jouw locatie"
    >
      {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {state === "error"   && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
      {(state === "idle" || state === "found") && <MapPin className="w-3.5 h-3.5 shrink-0" />}

      <span>
        {state === "loading" && "Locatie zoeken…"}
        {state === "found"   && (found ?? "Gevonden!")}
        {state === "error"   && "Geen GPS toegang"}
        {state === "idle"    && (currentCity ?? "Jouw locatie")}
      </span>
    </button>
  );
}
