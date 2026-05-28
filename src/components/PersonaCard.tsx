"use client";

import { PERSONAS, type PersonaTier } from "@/lib/personas";
import { Check } from "lucide-react";

interface Props {
  tier: PersonaTier;
  onSelect?: (tier: PersonaTier) => void;
  compact?: boolean;
  highlighted?: boolean;
  locale?: "nl" | "de" | "fr" | "es";
}

export default function PersonaCard({ tier, onSelect, compact = false, highlighted = false, locale = "nl" }: Props) {
  const p = PERSONAS[tier];
  const isComingSoon = tier === "steve";

  return (
    <div
      className="relative p-5 sm:p-6"
      style={{
        borderRadius: 20,
        background: "#ffffff",
        border: "none",
        boxShadow: highlighted
          ? "0 4px 14px rgba(0,0,0,0.09), 0 16px 44px rgba(0,0,0,0.11), 0 36px 72px rgba(0,0,0,0.07)"
          : "0 2px 8px rgba(0,0,0,0.07), 0 8px 28px rgba(0,0,0,0.09), 0 24px 56px rgba(0,0,0,0.06)",
        transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, background 0.22s ease",
      }}
    >
      <div
        className="absolute top-0 left-5 right-5 h-1 rounded-full"
        style={{ background: p.color }}
      />

      <div className="pt-2 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: p.color }}
          >
            {p.name} · {p.label}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-text-primary leading-tight">
          {p.tagline}
        </h3>
        {!compact && (
          <p className="text-sm text-text-secondary mt-2">{p.description}</p>
        )}
      </div>

      <div className="mb-4 pb-4 border-b border-black/10">
        <div className="flex items-baseline gap-2">
          {isComingSoon ? (
            <span className="text-3xl font-black text-text-primary">
              {locale === "de" ? "Bald verfügbar" : "Binnenkort beschikbaar"}
            </span>
          ) : (
            <span className="text-3xl font-black text-text-primary">
              {locale === "de" ? "Kostenlos" : "Gratis"}
            </span>
          )}
        </div>
        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/5">
          {isComingSoon ? (
            <span className="text-xs font-bold text-text-primary">
              {locale === "de" ? "In Entwicklung" : "Ontwikkeling in volle gang"}
            </span>
          ) : (
            <span className="text-xs font-bold text-text-primary">
              {locale === "de" ? "Vorübergehend kostenlos testen" : "Tijdelijk gratis te proberen"}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
            <Check
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: p.color }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {!compact && (
        <p className="text-xs text-text-muted mb-4 italic">{p.audience}</p>
      )}

      <button
        type="button"
        disabled={isComingSoon}
        onClick={() => onSelect?.(tier)}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all ${
          isComingSoon ? "bg-slate-400 cursor-not-allowed" : "hover:brightness-110 active:scale-[0.98]"
        }`}
        style={!isComingSoon ? { background: p.color } : {}}
      >
        {isComingSoon
          ? locale === "de"
            ? "Bald verfügbar"
            : "Binnenkort beschikbaar"
          : locale === "de"
            ? "Anmelden →"
            : "Aanmelden →"}
      </button>
    </div>
  );
}
