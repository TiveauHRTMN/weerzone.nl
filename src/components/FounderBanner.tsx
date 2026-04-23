"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import PersonaModal from "./PersonaModal";
import { useSession } from "@/lib/session-context";

const STORAGE_KEY = "wz-founder-banner-dismissed";
const IDLE_MS = 10_000;

/**
 * Sticky bottom-banner dat na 10s idle verschijnt.
 * Klikken opent PersonaModal. Wegklikken = verdwijnt deze sessie.
 * Niet-intrusief: glide-in van onderen, dismisbaar.
 */
export default function FounderBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { tier, loading } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Abonnee? Banner direct uit — ook als hij al getoond werd.
    if (tier) {
      setVisible(false);
      return;
    }

    // Nog aan het ophalen? Wacht — anders flitst de banner voor abonnees.
    if (loading) return;

    // Al weggeklikt in deze sessie?
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const timer = setTimeout(() => {
      setVisible(true);
      window.dispatchEvent(new CustomEvent("wz:founder-visible", { detail: true }));
    }, IDLE_MS);
    return () => clearTimeout(timer);
  }, [tier, loading]);

  const dismiss = () => {
    setVisible(false);
    window.dispatchEvent(new CustomEvent("wz:founder-visible", { detail: false }));
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  const open = () => {
    setModalOpen(true);
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl animate-[slideup_0.4s_ease-out]"
          style={{
            animation: "slideup 0.4s ease-out",
          }}
        >
          <div
            className="relative rounded-3xl p-5 sm:p-6 pr-14 shadow-2xl backdrop-blur-md border border-white/70 bg-white/97 cursor-pointer hover:bg-white transition-colors"
            onClick={open}
          >
            <div className="flex items-center gap-4">
              <div
                className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #22c55e 0%, #ef4444 50%, #3b82f6 100%)" }}
              >
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-black text-text-primary leading-tight">
                  Nu nog gratis aanmelden
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Elke ochtend een weermail van Piet, Reed of Steve. Zonder
                  reclame. Tijdelijk gratis.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      )}

      <PersonaModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <style jsx>{`
        @keyframes slideup {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
