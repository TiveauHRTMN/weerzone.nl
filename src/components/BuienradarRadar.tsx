"use client";

import { useEffect, useState } from "react";

// Officiële geanimeerde neerslagradar van Buienradar als één GIF (geen iframe,
// geen advertenties). Landelijk beeld met ingebakken tijdstempel; ververst elke
// 5 minuten. Het zeeblauw (#000084) zit ook in de kaart, dus de lijst eromheen
// valt naadloos weg.
const RADAR_SRC = "https://api.buienradar.nl/image/1.0/RadarMapNL?w=550&h=512";
const SEA = "#000084";

export default function BuienradarRadar() {
  const [bust, setBust] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setBust((b) => b + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="va-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div>
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neerslagradar · loopt automatisch</p>
          <h3 className="text-sm font-black leading-none text-slate-800">Regen in beeld</h3>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${error ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600"}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${error ? "bg-slate-300" : "animate-pulse bg-emerald-500"}`} />
          {error ? "Even niet" : "Live"}
        </span>
      </div>

      {/* Vult de hele breedte (geen letterbox-balken) en is verticaal zo
          uitgelijnd dat Nederland in het midden valt — niet de Noordzee bovenin. */}
      <div className="relative w-full overflow-hidden" style={{ background: SEA, aspectRatio: "4 / 3" }}>
        {!loaded && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 text-white/80">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white/90" />
            <span className="text-xs font-bold">Radarbeeld laden…</span>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xs font-bold text-white/70">Radar is even niet beschikbaar</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${RADAR_SRC}&_=${bust}`}
            alt="Neerslagradar van Nederland"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className="h-full w-full"
            style={{
              objectFit: "cover",
              objectPosition: "center 30%",
              opacity: loaded ? 1 : 0,
              transition: "opacity .35s ease",
              filter: "contrast(1.05) saturate(1.04)",
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Neerslag in beweging</span>
        <span className="text-[9px] font-bold text-slate-400">Radar · Buienradar</span>
      </div>
    </div>
  );
}
