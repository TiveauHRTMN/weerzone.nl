"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import PersonaCard from "./PersonaCard";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PersonaModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<PersonaTier | null>(null);

  if (!open) return null;

  const handleSelect = (tier: PersonaTier) => {
    setSelected(tier);
    // Redirect naar signup-flow met gekozen tier als query-param.
    // /app/onboarding handelt magic-link + profiel af (volgende build-stap).
    window.location.href = `/app/onboarding?tier=${tier}`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-b from-slate-100 to-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-10"
          aria-label="Sluiten"
        >
          <X className="w-5 h-5 text-text-primary" />
        </button>

        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/15 mb-4">
              <span className="text-xs font-black text-accent-orange uppercase tracking-wider">
                Nu nog gratis aanmelden
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-3">
              Kies een abonnement
            </h2>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
              Piet, Reed of Steve. Elke ochtend een weermail op jouw postcode.
              Geen reclame, geen creditcard vooraf, opzeggen kan altijd.
            </p>
          </div>

          {/* Persona cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PERSONA_ORDER.map((tier) => (
              <PersonaCard
                key={tier}
                tier={tier}
                onSelect={handleSelect}
                highlighted={selected === tier}
              />
            ))}
          </div>

          {/* Later beslissen */}
          <div className="text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
            >
              Later beslissen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
