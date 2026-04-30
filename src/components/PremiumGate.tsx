"use client";

import { Lock, Sparkles, Zap, Map } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { type PersonaTier } from "@/lib/personas";

interface PremiumGateProps {
  children: React.ReactNode;
  tierRequired?: PersonaTier; // null = any sub, 'piet' = piet or better, 'reed' = reed only
}

/**
 * Gate rond premium-content.
 * Maakt onderscheid tussen Piet (Intelligence) en Reed (Extremiteiten).
 */
export default function PremiumGate({ children, tierRequired }: PremiumGateProps) {
  const { tier, loading } = useSession();

  // Tijdens hydratie: render niks om flash te voorkomen
  if (loading) return null;

  // Access check
  const hasAccess = () => {
    if (!tier) return false;
    if (!tierRequired) return true; // Any tier is fine
    if (tierRequired === "piet") return tier === "piet" || tier === "reed" || tier === "steve";
    if (tierRequired === "reed") return tier === "reed" || tier === "steve";
    return tier === tierRequired;
  };

  if (hasAccess()) return <>{children}</>;

  const openModal = () => {
    window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
  };

  // UI varianten gebaseerd op wat er achter de gate zit
  const isExtremities = tierRequired === 'reed';

  return (
    <div className="relative group">
      {/* Teaser: blurred content */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-xl opacity-40 max-h-[320px] overflow-hidden rounded-[32px] transition-all duration-700 group-hover:blur-2xl"
        style={{
          maskImage: "linear-gradient(180deg, black 0%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 90%)",
        }}
      >
        {children}
      </div>

      {/* Intuïtieve Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[40px] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-[1.02]">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-500 ${
              isExtremities 
                ? "bg-gradient-to-br from-rose-500 to-orange-600" 
                : "bg-gradient-to-br from-blue-500 to-emerald-500"
            }`}
          >
            {isExtremities ? <Zap className="w-8 h-8 fill-current" /> : <Map className="w-8 h-8" />}
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center justify-center gap-2 tracking-tight">
            <Lock className="w-4 h-4 text-slate-400" />
            {isExtremities ? "Tactical Intel" : "Piet's Precisie"}
          </h3>
          
          <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
            {isExtremities 
              ? "Onweersrisico (CAPE), extreme neerslag en bliksem-detectie zijn exclusief voor Reed-leden."
              : "Het 48-uurs grid, de regenradar en micro-data zijn onderdeel van de Piet & Reed upgrades."}
          </p>

          <button
            type="button"
            onClick={openModal}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                isExtremities
                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200"
                : "bg-accent-orange text-slate-900 hover:brightness-95 shadow-orange-100"
            }`}
          >
            Upgrade naar {isExtremities ? "Reed" : "Piet"} →
          </button>
          
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-6">
            Founder deal · Tijdelijk gratis
          </p>
        </div>
      </div>
    </div>
  );
}
