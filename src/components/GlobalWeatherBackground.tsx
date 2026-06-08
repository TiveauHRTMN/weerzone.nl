"use client";

/**
 * GlobalWeatherBackground — de universele weer-lucht achter ELKE pagina.
 *
 * Leest de opgeslagen locatie client-side (localStorage `wz_city`) en haalt het
 * actuele weer op, zodat de achtergrond de echte conditie + dag/nacht per locatie
 * toont. Lichtgewicht (alleen de gradient; de geanimeerde WeatherBackground blijft
 * op de weer/agent-pagina's). Staat op -z-10 zodat de witte/lichtgrijze content-
 * kaarten er altijd bovenop liggen.
 *
 * Bewust client-side: de root-layout mag GEEN cookies()/headers() gebruiken
 * (zou CDN-caching op alle pagina's blokkeren). Dit hydrateert in de browser.
 */

import { useEffect, useState } from "react";
import { weatherTheme } from "@/lib/weather-theme";

export default function GlobalWeatherBackground() {
  const [wx, setWx] = useState<{ code: number; isDay: boolean } | null>(null);

  useEffect(() => {
    let lat = 52.1;
    let lon = 5.18; // De Bilt als neutrale standaard
    try {
      const raw = localStorage.getItem("wz_city");
      if (raw) {
        const c = JSON.parse(raw);
        if (typeof c?.lat === "number" && typeof c?.lon === "number") {
          lat = c.lat;
          lon = c.lon;
        }
      }
    } catch {
      /* geen/ongeldige opgeslagen locatie — standaard blijft staan */
    }

    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day&timezone=auto`,
      { signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.current) {
          setWx({ code: Number(d.current.weather_code ?? 2), isDay: d.current.is_day === 1 });
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const t = weatherTheme(wx?.code ?? 2, wx?.isDay ?? true);

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: `linear-gradient(170deg, ${t.bg1} 0%, ${t.bg2} 100%)`,
        transition: "background 1s ease-in-out",
      }}
      aria-hidden
    />
  );
}
