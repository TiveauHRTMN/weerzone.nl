"use client";

import { useState, useEffect } from "react";

type Consent = "all" | "necessary" | null;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wz_consent") as Consent;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      // Show after short delay so it doesn't block first paint
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: "all" | "necessary") => {
    localStorage.setItem("wz_consent", type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🍪</span>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900">Even serieus</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              We gebruiken cookies voor het onthouden van je voorkeuren en anonieme statistieken.
              Affiliate-links (Bol.com, Booking.com) gebruiken tracking-cookies als je doorklikt.
              Geen stiekeme zooi, geen datahandel. Beloofd.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => accept("all")}
            className="flex-1 px-4 py-2.5 bg-accent-orange text-text-primary text-sm font-bold rounded-xl hover:brightness-90 transition-colors"
          >
            Prima, alles goed
          </button>
          <button
            onClick={() => accept("necessary")}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Alleen noodzakelijk
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mt-3 text-center">
          Lees ons <a href="/privacy" className="underline hover:text-accent-orange">privacybeleid</a>.
          Je kunt je keuze altijd wijzigen.
        </p>
      </div>
    </div>
  );
}
