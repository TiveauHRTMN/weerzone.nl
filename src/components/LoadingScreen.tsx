"use client";

import { LogoFull } from "./Logo";

/**
 * Loading-scherm tijdens initieel weerfetch. Alleen logo + discrete
 * "weer ophalen…" — geen marketing-tekst (voegt niks toe tijdens wachten).
 */
export default function LoadingScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
      style={{ background: "linear-gradient(160deg, #4a9ee8 0%, #5aafe8 40%, #3b8dd4 100%)" }}
    >
      <LogoFull
        height={180}
        className="animate-pulse drop-shadow-[0_4px_40px_rgba(255,255,255,0.3)]"
      />

      <p className="mt-10 text-white/45 text-xs font-semibold tracking-[0.2em] uppercase animate-[fadeInUp_0.8s_ease_0.4s_forwards] opacity-0">
        Weer ophalen…
      </p>
    </div>
  );
}
