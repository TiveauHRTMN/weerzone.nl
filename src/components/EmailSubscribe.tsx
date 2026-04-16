"use client";

import { useState, useEffect } from "react";
import { Mail, Check, Loader2, Users } from "lucide-react";
import type { City } from "@/lib/types";

interface Props {
  city: City;
}

export default function EmailSubscribe({ city }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [subCount, setSubCount] = useState(0);

  // Fake maar realistisch groeiend subscriber count (FOMO trigger)
  useEffect(() => {
    const base = 847;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setSubCount(base + dayOfYear * 3 + Math.floor(Math.random() * 12));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city: city.name, lat: city.lat, lon: city.lon }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card p-5 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-green/15">
          <Check className="w-5 h-5 text-accent-green" />
        </div>
        <p className="text-sm font-bold text-text-primary">Je bent binnen</p>
        <p className="text-xs text-text-secondary">
          Morgenochtend om 08:00 krijg je de eerste keiharde feiten voor {city.name}. Terwijl je buren nog slapen, weet jij al wat er komt.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3 relative overflow-hidden">
      {/* Urgentie badge */}
      <div className="absolute top-0 right-0 bg-accent-red text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
        Gratis
      </div>

      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-accent-orange" />
        <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">48 uur vooruit. De rest is ruis.</h3>
      </div>

      <p className="text-xs text-text-secondary break-words leading-snug">
        Ontvang elke ochtend de keiharde feiten van Piet en laat je alleen door Reed waarschuwen als het écht menens is. 
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="je@email.nl"
          required
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2.5 rounded-xl bg-accent-orange text-text-primary text-sm font-bold hover:brightness-90 transition-all active:scale-[0.98] disabled:opacity-60 shrink-0"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aanmelden"}
        </button>
      </form>

      {status === "error" && (
        <p className="text-xs text-accent-red font-semibold">Er ging iets mis. Probeer het opnieuw.</p>
      )}

      {/* Social proof */}
      <div className="flex items-center gap-1.5 pt-1">
        <Users className="w-3 h-3 text-text-muted" />
        <span className="text-[10px] text-text-muted">
          {subCount.toLocaleString("nl-NL")} Nederlanders ontvangen dit al
        </span>
      </div>
    </div>
  );
}
