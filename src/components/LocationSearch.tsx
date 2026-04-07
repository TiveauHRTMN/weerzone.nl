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
  const ref = useRef<HTMLDivElement>(null);

  const filtered = DUTCH_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

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
        <div className="absolute z-50 mt-2 w-full card p-2 max-h-64 overflow-y-auto animate-fade-in">
          {filtered.map((city) => (
            <button
              key={city.name}
              className="w-full text-left px-4 py-2.5 rounded-lg transition-colors hover:bg-white/5"
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
              {city.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Geen steden gevonden
            </div>
          )}
        </div>
      )}
    </div>
  );
}
