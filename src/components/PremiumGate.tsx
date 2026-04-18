"use client";

import { Lock, Sparkles } from "lucide-react";
import { useSession } from "@/lib/session-context";

/**
 * Gate rond premium-content. Abonnees (tier != null) zien gewoon `children`.
 * Non-subs zien een teaser: children met heavy blur + overlay met upgrade-CTA.
 *
 * Gebruik:
 *   <PremiumGate>
 *     ...uur-per-uur details, radar, fiets/misère, detail grid...
 *   </PremiumGate>
 */
export default function PremiumGate({ children }: { children: React.ReactNode }) {
  const { tier, loading } = useSession();

  // Tijdens hydratie: render niks om flash van ongated content te voorkomen
  if (loading) return null;

  if (tier) return <>{children}</>;

  const openModal = () => {
    window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
  };

  return (
    <div className="relative">
      {/* Teaser: blurred premium content, niet interactief */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-md opacity-70 max-h-[480px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%)",
        }}
      >
        {children}
      </div>

      {/* CTA-kaart over de teaser */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-6 px-4">
        <div className="card p-6 max-w-md w-full text-center shadow-2xl bg-white/95 backdrop-blur-md">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white"
            style={{
              background:
                "linear-gradient(135deg, #22c55e 0%, #ef4444 50%, #3b82f6 100%)",
            }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-text-primary mb-1 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-text-muted" />
            48 uur op de meter
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Uurdetail, radar, fiets- en werkramen-scores — voor Piet, Reed en
            Steve. Tijdelijk gratis als founder. Later een vaste lage prijs
            voor altijd.
          </p>
          <button
            type="button"
            onClick={openModal}
            className="inline-block rounded-full px-6 py-2.5 bg-accent-orange text-white font-black text-sm hover:bg-accent-orange/90 transition-colors"
          >
            Claim je founder-plek
          </button>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-3">
            Gratis tot 1 juni · geen creditcard
          </p>
        </div>
      </div>
    </div>
  );
}
