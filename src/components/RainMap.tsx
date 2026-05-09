"use client";

import { useEffect, useRef, useState } from "react";

interface RainViewerFrame {
  time: number;
  path: string;
  isForecast: boolean;
}

interface Props {
  lat: number;
  lon: number;
}

export default function RainMap({ lat, lon }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const radarLayer = useRef<L.TileLayer | null>(null);
  const [frames, setFrames] = useState<RainViewerFrame[]>([]);
  const [host, setHost] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Fetch RainViewer timestamps
  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then(r => r.json())
      .then(data => {
        const past: RainViewerFrame[] = (data.radar.past as { time: number; path: string }[]).map(f => ({ ...f, isForecast: false }));
        const nowcast: RainViewerFrame[] = (data.radar.nowcast as { time: number; path: string }[]).map(f => ({ ...f, isForecast: true }));
        setHost(data.host);
        setFrames([...past, ...nowcast]);
        setCurrentIdx(past.length - 1);
      })
      .catch(() => {});
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let mounted = true;

    import("leaflet").then(({ default: L }) => {
      if (!mounted || !mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 8,
        zoomControl: true,
        attributionControl: false,
      });

      // Minimal base tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Labels pane — always on top of radar
      map.createPane("labels");
      (map.getPane("labels") as HTMLElement).style.zIndex = "650";
      (map.getPane("labels") as HTMLElement).style.pointerEvents = "none";
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        pane: "labels",
      }).addTo(map);

      // User location dot
      L.circleMarker([lat, lon], {
        radius: 6,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
    });

    return () => {
      mounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lon]);

  // Swap radar tile layer when frame changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !host || frames.length === 0) return;

    import("leaflet").then(({ default: L }) => {
      if (!mapInstance.current) return;
      if (radarLayer.current) {
        mapInstance.current.removeLayer(radarLayer.current);
        radarLayer.current = null;
      }
      const frame = frames[currentIdx];
      const layer = L.tileLayer(`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
        opacity: 0.75,
        attribution: "RainViewer",
      });
      layer.addTo(mapInstance.current);
      radarLayer.current = layer;
    });
  }, [currentIdx, frames, host, mapReady]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => setCurrentIdx(i => (i + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  const frame = frames[currentIdx];
  const pastCount = frames.filter(f => !f.isForecast).length;
  const nowcastCount = frames.filter(f => f.isForecast).length;
  const splitPct = frames.length > 0 ? (pastCount / frames.length) * 100 : 0;

  const timeStr = frame
    ? new Date(frame.time * 1000).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Live radar + nowcast
          </p>
          <h3 className="text-sm font-black text-slate-800 leading-none">Regenradar</h3>
        </div>
        <div className="flex items-center gap-2">
          {frame?.isForecast ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
              Prognose
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="text-sm font-black text-slate-700">{timeStr}</span>
        </div>
      </div>

      <div ref={mapRef} style={{ height: 380 }} className="w-full bg-slate-100" />

      {frames.length > 0 && (
        <div className="px-4 py-3 flex items-center gap-3 border-t border-slate-100">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors shrink-0 w-16"
          >
            {isPlaying ? "Pauzeer" : "▶ Speel"}
          </button>
          <div className="flex-1 relative">
            <div
              className="absolute inset-y-0 flex items-center pointer-events-none"
              style={{ left: `calc(${splitPct}% - 1px)` }}
            >
              <div className="w-0.5 h-4 bg-orange-400 rounded-full" />
            </div>
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentIdx}
              onChange={e => { setCurrentIdx(+e.target.value); setIsPlaying(false); }}
              className="w-full accent-blue-500"
            />
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
            +{nowcastCount * 10} min
          </span>
        </div>
      )}

      <div className="px-4 pb-3 flex items-center gap-3 text-[9px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Radar ({pastCount}×)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Nowcast ({nowcastCount}×)
        </span>
        <span className="ml-auto">Bron: RainViewer · © OpenStreetMap © CARTO</span>
      </div>
    </div>
  );
}
