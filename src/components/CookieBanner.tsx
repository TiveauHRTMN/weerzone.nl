"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { detectLocale } from "@/config/locales";

type Consent = "all" | "necessary" | null;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wz_consent") as Consent;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() ?? "/";
  const isDE = detectLocale(pathname) === "de";

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
    <div className="fixed bottom-0 inset-x-0 z-50 p-2 md:p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl md:rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] px-3 py-2 md:p-5">
        {/* Mobiel: één compacte rij. Desktop: uitgebreide uitleg. */}
        <div className="flex items-center gap-2 md:items-start md:gap-3">
          <span className="hidden md:inline text-2xl shrink-0">🍪</span>
          <div className="flex-1 min-w-0">
            <h3 className="hidden md:block font-bold text-sm text-gray-900">
              {isDE ? "Kurz gesagt" : "Even serieus"}
            </h3>
            <p className="text-[11px] md:text-xs text-gray-700 md:text-gray-600 md:mt-1 md:leading-relaxed">
              <span className="md:hidden">
                {isDE ? (
                  <>🍪 Cookies für Stats + Affiliates. <a href="/privacy" className="underline">Mehr</a></>
                ) : (
                  <>🍪 Cookies voor stats + affiliates. <a href="/privacy" className="underline">Meer</a></>
                )}
              </span>
              <span className="hidden md:inline">
                {isDE
                  ? "Wir verwenden Cookies, um deine Einstellungen zu merken und anonyme Statistiken zu erfassen. Affiliate-Links (Bol.com, Booking.com) setzen Tracking-Cookies, wenn du weiterklickst. Kein versteckter Kram, kein Datenhandel."
                  : "We gebruiken cookies voor het onthouden van je voorkeuren en anonieme statistieken. Affiliate-links (Bol.com, Booking.com) gebruiken tracking-cookies als je doorklikt. Geen stiekeme zooi, geen datahandel. Beloofd."}
              </span>
            </p>
          </div>
          {/* Mobiele knoppen, inline */}
          <div className="flex gap-1.5 shrink-0 md:hidden">
            <button
              onClick={() => accept("all")}
              className="px-2.5 py-1.5 bg-accent-orange text-text-primary text-[11px] font-bold rounded-lg hover:brightness-90 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => accept("necessary")}
              className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isDE ? "Nötig" : "Nodig"}
            </button>
          </div>
        </div>

        {/* Desktop knoppen + privacy regel */}
        <div className="hidden md:flex gap-2 mt-4">
          <button
            onClick={() => accept("all")}
            className="flex-1 px-4 py-2.5 bg-accent-orange text-text-primary text-sm font-bold rounded-xl hover:brightness-90 transition-colors"
          >
            {isDE ? "Alles klar" : "Prima, alles goed"}
          </button>
          <button
            onClick={() => accept("necessary")}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            {isDE ? "Nur notwendig" : "Alleen noodzakelijk"}
          </button>
        </div>

        <p className="hidden md:block text-[10px] text-gray-400 mt-3 text-center">
          {isDE ? (
            <>
              Lies unsere <a href="/privacy" className="underline hover:text-accent-orange">Datenschutzerklärung</a>.
              Du kannst deine Wahl jederzeit ändern.
            </>
          ) : (
            <>
              Lees ons <a href="/privacy" className="underline hover:text-accent-orange">privacybeleid</a>.
              Je kunt je keuze altijd wijzigen.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
