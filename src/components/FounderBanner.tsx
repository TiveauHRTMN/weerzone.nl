"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import PersonaModal from "./PersonaModal";
import { daysUntilLaunch } from "@/lib/personas";
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
  const days = daysUntilLaunch();
  const { tier } = useSession();

  useEffect(() => {
    // Check of gebruiker 'm al weggeklikt heeft deze sessie
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    // Abonnees hoeven de banner niet te zien
    if (tier) return;

    const timer = setTimeout(() => setVisible(true), IDLE_MS);
    return () => clearTimeout(timer);
  }, [tier]);

  const dismiss = () => {
    setVisible(false);
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
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl animate-[slideup_0.4s_ease-out]"
          style={{
            animation: "slideup 0.4s ease-out",
          }}
        >
          <div
            className="relative rounded-2xl p-4 pr-12 shadow-2xl backdrop-blur-md border border-white/60 bg-white/95 cursor-pointer hover:bg-white transition-colors"
            onClick={open}
          >
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #22c55e 0%, #ef4444 50%, #3b82f6 100%)" }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-text-primary">
                  Tijdelijk gratis — nog {days} dagen
                </p>
                <p className="text-xs text-text-secondary">
                  Claim je founder-plek · Piet · Reed · Steve
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
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
