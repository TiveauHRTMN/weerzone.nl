"use client";

import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import { Check } from "lucide-react";

interface Props {
  tier: PersonaTier;
  onSelect?: (tier: PersonaTier) => void;
  compact?: boolean;
  highlighted?: boolean;
}

export default function PersonaCard({ tier, onSelect, compact = false, highlighted = false }: Props) {
  const p = PERSONAS[tier];
  const isComingSoon = tier === "steve";

  return (
    <div
      className={`relative rounded-2xl p-5 sm:p-6 border transition-all ${
        highlighted
          ? "bg-white border-white/80 shadow-2xl scale-[1.02]"
          : "bg-white/80 border-white/50 hover:bg-white hover:shadow-xl"
      }`}
      style={highlighted ? { outline: `2px solid ${p.color}`, outlineOffset: "4px" } : undefined}
    >
      {/* Kleurbalk bovenaan */}
      <div
        className="absolute top-0 left-5 right-5 h-1 rounded-full"
        style={{ background: p.color }}
      />

      {/* Header */}
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

      {/* Prijs */}
      <div className="mb-4 pb-4 border-b border-black/10">
        <div className="flex items-baseline gap-2">
          {isComingSoon ? (
            <span className="text-3xl font-black text-text-primary">
              Coming Soon
            </span>
          ) : (
            <>
              <span className="text-3xl font-black text-text-primary">
                {formatPrice(p.priceCents)}
              </span>
              <span className="text-sm text-text-muted">/mnd, binnenkort</span>
            </>
          )}
        </div>
        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/5">
          {isComingSoon ? (
            <span className="text-xs font-bold text-text-primary">
              Beschikbaar vanaf juni '26
            </span>
          ) : (
            <span className="text-xs font-bold text-text-primary">
              Introductieprijs: {formatPrice(p.founderPriceCents)}/mnd · vastgezet
            </span>
          )}
        </div>
      </div>

      {/* Features */}
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

      {/* CTA */}
      <button
        type="button"
        disabled={isComingSoon}
        onClick={() => onSelect?.(tier)}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all ${
          isComingSoon ? "bg-slate-400 cursor-not-allowed" : "hover:brightness-110 active:scale-[0.98]"
        }`}
        style={!isComingSoon ? { background: p.color } : {}}
      >
        {isComingSoon ? "Binnenkort beschikbaar" : "Aanmelden →"}
      </button>
    </div>
  );
}
