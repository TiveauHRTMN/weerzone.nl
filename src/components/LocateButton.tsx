"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/types";
import { persistCity } from "@/lib/persist-city";

interface Props {
  /** Tekst op de knop. Default "Gebruik mijn locatie". */
  label?: string;
  /** Compact = kleinere knop. */
  compact?: boolean;
  /** ClassName voor extra styling op de knop. */
  className?: string;
}

/**
 * Client-side knop die de browser's GPS opvraagt, omzet naar een plaatsnaam
 * en de selectie persisteert (cookie + localStorage). Daarna wordt de pagina
 * herladen zodat SSR met de nieuwe locatie kan renderen.
 */
export default function LocateButton({
  label = "Gebruik mijn locatie",
  compact = false,
  className = "",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!("geolocation" in navigator)) {
      setError("GPS niet beschikbaar in deze browser.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const city = await reverseGeocode(lat, lon);
          persistCity(city);
          window.location.reload();
        } catch {
          setError("Kon plaatsnaam niet ophalen.");
          setBusy(false);
        }
      },
      (err) => {
        const reason =
          err.code === err.PERMISSION_DENIED
            ? "Toestemming geweigerd."
            : "Locatie niet gelukt.";
        setError(reason);
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const sizing = compact
    ? "px-3 py-1.5 text-xs"
    : "px-4 py-2.5 text-sm";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white font-bold hover:bg-white/20 transition-all disabled:opacity-60 ${sizing} ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {busy ? "Locatie bepalen…" : label}
      </button>
      {error && <span className="text-[11px] text-rose-300 font-medium">{error}</span>}
    </div>
  );
}
