"use client";

/**
 * Universele weerlucht achter elke Weerzone-pagina.
 *
 * Locatievolgorde: reeds toegestane browser-GPS, accountlocatie, opgeslagen
 * locatie, daarna De Bilt. Zo gebruikt de hele app dezelfde actuele
 * conditie en dag/nacht-status.
 */

import { useEffect, useState } from "react";
import WeatherBackground from "./WeatherBackground";
import { readPersistedCity, persistCity } from "@/lib/persist-city";
import { reverseGeocode } from "@/lib/types";
import { useSession } from "@/lib/session-context";
import { weatherTheme } from "@/lib/weather-theme";

type WeatherLocation = { name: string; lat: number; lon: number };

const DEFAULT_LOCATION: WeatherLocation = { name: "De Bilt", lat: 52.1011, lon: 5.1775 };

function validLocation(location: WeatherLocation | null | undefined): location is WeatherLocation {
  return !!location && Number.isFinite(location.lat) && Number.isFinite(location.lon);
}

async function gpsLocationIfAlreadyAllowed(): Promise<WeatherLocation | null> {
  if (!("geolocation" in navigator)) return null;

  try {
    if (!("permissions" in navigator) || !navigator.permissions?.query) return null;
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    if (status.state !== "granted") return null;
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const city = await reverseGeocode(lat, lon);
          persistCity(city);
          resolve(city);
        } catch {
          resolve({ name: "Jouw GPS-locatie", lat, lon });
        }
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

function GradientBackground({ code, isDay }: { code: number; isDay: boolean }) {
  const t = weatherTheme(code, isDay);
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: `linear-gradient(170deg, ${t.bg1} 0%, ${t.bg2} 100%)`,
        transition: "background 1s ease-in-out",
      }}
      aria-hidden
    />
  );
}

export default function GlobalWeatherBackground() {
  const [wx, setWx] = useState<{ code: number; isDay: boolean } | null>(null);
  const [locationVersion, setLocationVersion] = useState(0);
  const { primaryLocation } = useSession();
  const primaryName = primaryLocation?.name;
  const primaryLat = primaryLocation?.lat;
  const primaryLon = primaryLocation?.lon;

  useEffect(() => {
    const refreshLocation = () => setLocationVersion((version) => version + 1);
    window.addEventListener("wz:city-updated", refreshLocation);
    window.addEventListener("storage", refreshLocation);
    return () => {
      window.removeEventListener("wz:city-updated", refreshLocation);
      window.removeEventListener("storage", refreshLocation);
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();

    async function hydrateBackground() {
      const persisted = readPersistedCity();
      const accountLocation = validLocation(
        primaryLat != null && primaryLon != null
          ? { name: primaryName ?? "Mijn locatie", lat: primaryLat, lon: primaryLon }
          : null,
      )
        ? { name: primaryName ?? "Mijn locatie", lat: primaryLat!, lon: primaryLon! }
        : null;
      const fallback = accountLocation ?? persisted ?? DEFAULT_LOCATION;

      async function fetchCurrent(location: WeatherLocation) {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=weather_code,is_day&timezone=auto`,
          { signal: ctrl.signal },
        ).catch(() => null);
        const data = response?.ok ? await response.json().catch(() => null) : null;
        if (!ctrl.signal.aborted && data?.current) {
          setWx({
            code: Number(data.current.weather_code ?? 2),
            isDay: data.current.is_day === 1,
          });
        }
      }

      await fetchCurrent(fallback);
      const gps = await gpsLocationIfAlreadyAllowed();
      if (validLocation(gps) && !ctrl.signal.aborted) await fetchCurrent(gps);
    }

    hydrateBackground();
    return () => ctrl.abort();
  }, [primaryLat, primaryLon, primaryName, locationVersion]);

  const code = wx?.code ?? 2;
  const isDay = wx?.isDay ?? true;
  return (
    <>
      <GradientBackground code={code} isDay={isDay} />
      <WeatherBackground weatherCode={code} isDay={isDay} transparentBase />
    </>
  );
}
