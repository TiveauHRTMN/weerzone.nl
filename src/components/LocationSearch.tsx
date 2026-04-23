"use client";

import { useState, useRef, useEffect } from "react";
import type { City } from "@/lib/types";
import { DUTCH_CITIES } from "@/lib/types";

interface Props {
  currentCity: City;
  onCityChange: (city: City) => void;
}

export default function LocationSearch({ currentCity, onCityChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [externalResults, setExternalResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const localMatches = DUTCH_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    if (query.length < 3) {
      setExternalResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=nl&accept-language=nl`,
          { headers: { "User-Agent": "WEERZONE/1.0" } }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: City[] = data.map((item: any) => ({
            name: item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0],
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
          // Filter out duplicates that might be in local list
          setExternalResults(mapped.filter(m => !DUTCH_CITIES.some(lc => lc.name === m.name)));
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const allResults = [...localMatches, ...externalResults];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
          📍
        </span>
        <input
          className="search-input"
          placeholder="Zoek een stad..."
          value={open ? query : currentCity.name}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full card p-2 max-h-80 overflow-y-auto animate-fade-in shadow-2xl border-white/60">
          {allResults.length > 0 ? (
            <div className="space-y-1">
              {allResults.map((city, idx) => (
                <button
                  key={`${city.name}-${city.lat}-${idx}`}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all hover:bg-black/5 flex items-center justify-between group"
                  style={{
                    color:
                      city.name === currentCity.name
                        ? "var(--accent-orange)"
                        : "var(--text-primary)",
                  }}
                  onClick={() => {
                    onCityChange(city);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">{city.name}</span>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest group-hover:text-text-primary transition-colors">
                      {idx < localMatches.length ? "Weerstation" : "Gemeente / Plaats"}
                    </span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              {searching ? (
                <div className="animate-pulse text-[10px] font-black uppercase tracking-widest text-text-muted">Zoeken...</div>
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Geen resultaten gevonden</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
