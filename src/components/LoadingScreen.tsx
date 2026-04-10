"use client";

import { useState, useEffect } from "react";

const PHASES = [
  { text: "48 UUR...", delay: 0, duration: 900 },
  { text: "WEERZONE.", delay: 1200, duration: 1000 },
  { text: "DE REST IS RUIS.", delay: 2500, duration: 1200 },
];

export default function LoadingScreen() {
  const [phase, setPhase] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [sunShrunk, setSunShrunk] = useState(false);

  // Sun shrinks after 0.8s, then typing starts
  useEffect(() => {
    const t = setTimeout(() => setSunShrunk(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Type effect
  useEffect(() => {
    if (!sunShrunk) return;
    if (phase >= PHASES.length) return;

    const { text, delay, duration } = PHASES[phase];
    const charDelay = duration / text.length;

    const startTimer = setTimeout(() => {
      if (charIndex < text.length) {
        const typeTimer = setTimeout(() => {
          setCharIndex((prev) => prev + 1);
        }, charDelay);
        return () => clearTimeout(typeTimer);
      } else {
        // Move to next phase
        const nextTimer = setTimeout(() => {
          setPhase((p) => p + 1);
          setCharIndex(0);
        }, 400);
        return () => clearTimeout(nextTimer);
      }
    }, charIndex === 0 ? delay - (phase > 0 ? PHASES[phase - 1].delay + PHASES[phase - 1].duration : 0) : 0);

    return () => clearTimeout(startTimer);
  }, [sunShrunk, phase, charIndex]);

  const currentText = phase < PHASES.length ? PHASES[phase].text.slice(0, charIndex) : "";
  const showCursor = phase < PHASES.length;
  const allDone = phase >= PHASES.length;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #4a9ee8 0%, #5aafe8 40%, #3b8dd4 100%)" }}
    >
      {/* Sun */}
      <div
        className="relative transition-all ease-out"
        style={{
          transitionDuration: "1s",
          transform: sunShrunk ? "scale(0.4) translateY(-40px)" : "scale(1)",
          opacity: sunShrunk ? 0.6 : 1,
        }}
      >
        {/* Sun rays - rotating */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[280px] h-[280px] animate-[spin_25s_linear_infinite]">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-[140px] w-[4px] origin-bottom rounded-full"
                style={{
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                  background: "linear-gradient(to top, #f5b800, transparent)",
                }}
              />
            ))}
          </div>
        </div>
        {/* Sun circle */}
        <div
          className="relative w-[160px] h-[160px] rounded-full mx-auto"
          style={{
            background: "radial-gradient(circle at 40% 35%, #ffe14d 0%, #f5b800 60%, #dba600 100%)",
            boxShadow: "0 0 80px 20px rgba(245,184,0,0.35), 0 0 160px 60px rgba(245,184,0,0.15)",
          }}
        />
      </div>

      {/* Type effect text */}
      <div
        className="mt-8 h-[80px] flex flex-col items-center justify-center transition-opacity duration-500"
        style={{ opacity: sunShrunk ? 1 : 0 }}
      >
        {phase === 0 && (
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {currentText}
            {showCursor && <span className="animate-[pulse-soft_0.6s_ease-in-out_infinite] text-accent-amber">|</span>}
          </span>
        )}
        {phase === 1 && (
          <div className="text-center">
            <div className="text-white/40 text-sm font-bold tracking-widest mb-1">48 UUR...</div>
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {currentText}
              {showCursor && <span className="animate-[pulse-soft_0.6s_ease-in-out_infinite] text-accent-amber">|</span>}
            </span>
          </div>
        )}
        {phase === 2 && (
          <div className="text-center">
            <div className="text-white/40 text-sm font-bold tracking-widest mb-1">48 UUR...</div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">WEERZONE.</div>
            <span className="text-lg sm:text-xl font-bold text-accent-amber tracking-wide">
              {currentText}
              {showCursor && <span className="animate-[pulse-soft_0.6s_ease-in-out_infinite]">|</span>}
            </span>
          </div>
        )}
        {allDone && (
          <div className="text-center animate-[pulse-soft_2s_ease-in-out_infinite]">
            <div className="text-white/40 text-sm font-bold tracking-widest mb-1">48 UUR...</div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">WEERZONE.</div>
            <div className="text-lg sm:text-xl font-bold text-accent-amber tracking-wide">DE REST IS RUIS.</div>
          </div>
        )}
      </div>
    </div>
  );
}
