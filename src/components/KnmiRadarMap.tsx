"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { RADAR_BOUNDS } from "@/lib/knmi-radar-bounds";

interface Props {
  lat: number;
  lon: number;
}

const DBZ_LEGEND = [
  { c: "#60a5fa", label: "Licht" },
  { c: "#16a34a", label: "Matig" },
  { c: "#facc15", label: "Zwaar" },
  { c: "#dc2626", label: "Fel" },
  { c: "#7e22ce", label: "Extreem" },
];

/**
 * Native neerslagradar op een Leaflet-kaart, gevoed door de KNMI-composiet
 * (server-side HDF5 → Web-Mercator-PNG). Laadt direct (geen klik), centreert op
 * de locatie en ververst elke 5 minuten. Lichtgewicht: één tile-basemap + één
 * image-overlay, geen externe iframe.
 */
export default function KnmiRadarMap({ lat, lon }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<import("leaflet").ImageOverlay | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 8,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 12,
        minZoom: 6,
      }).addTo(map);

      // Locatiemarker (klein, rustig).
      L.circleMarker([lat, lon], {
        radius: 6, color: "#0b1220", weight: 2, fillColor: "#ffd21a", fillOpacity: 1,
      }).addTo(map);

      const bounds: [[number, number], [number, number]] = [
        [RADAR_BOUNDS.south, RADAR_BOUNDS.west],
        [RADAR_BOUNDS.north, RADAR_BOUNDS.east],
      ];

      const loadRadar = async () => {
        try {
          const res = await fetch(`/api/knmi-radar-image?v=${Math.floor(Date.now() / 300000)}`);
          if (!res.ok) throw new Error(`radar ${res.status}`);
          setTime(res.headers.get("X-Radar-Time"));
          const blob = await res.blob();
          if (cancelled || !map) return;
          const url = URL.createObjectURL(blob);
          if (overlayRef.current) {
            overlayRef.current.setUrl(url);
          } else {
            overlayRef.current = L.imageOverlay(url, bounds, { opacity: 0.72, interactive: false }).addTo(map);
          }
          setStatus("live");
        } catch {
          if (!cancelled) setStatus((s) => (s === "live" ? "live" : "error"));
        }
      };

      await loadRadar();
      interval = setInterval(loadRadar, 5 * 60 * 1000);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      overlayRef.current = null;
      if (map) map.remove();
    };
  }, [lat, lon]);

  const timeLabel = time
    ? new Date(time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div>
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live neerslag</p>
          <h3 className="text-sm font-black leading-none text-slate-800">Regenradar</h3>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black ${
            status === "error" ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${status === "live" ? "animate-pulse bg-emerald-500" : status === "error" ? "bg-slate-300" : "bg-amber-400"}`} />
          {status === "error" ? "Even niet" : timeLabel ? `${timeLabel}` : "Live"}
        </span>
      </div>

      <div ref={containerRef} className="relative w-full bg-slate-100" style={{ height: 420 }} />

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-2.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Intensiteit</span>
        <div className="flex items-center gap-2.5">
          {DBZ_LEGEND.map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
              <span className="text-[9px] font-bold text-slate-400">{s.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
