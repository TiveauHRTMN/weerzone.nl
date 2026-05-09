"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: "linear-gradient(160deg, #1a2a4a 0%, #0f172a 100%)" }}
    >
      <div className="text-5xl mb-6">⛈️</div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
        Oeps — pagina kon niet laden
      </h1>
      <p className="text-white/50 text-sm max-w-sm mb-8">
        Er ging iets mis bij het laden van deze pagina. Probeer het opnieuw of ga terug naar de homepage.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
        >
          Probeer opnieuw
        </button>
        <a
          href="/"
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
          style={{ background: "#ffd60a", color: "#0f172a" }}
        >
          Naar de homepage
        </a>
      </div>
    </div>
  );
}
