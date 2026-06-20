"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { resolveWxScenario, WX_QUERY_KEY } from "@/lib/wx-scenarios";
import { weatherTheme, horizonGlow } from "@/lib/weather-theme";

interface Props {
  weatherCode: number;
  isDay: boolean;
  transparentBase?: boolean;
}

// Eén bron van waarheid: het kalme atmosfeer-thema uit lib/weather-theme.
const getWeatherTheme = weatherTheme;

export { getWeatherTheme };

export default function WeatherBackground({ weatherCode, isDay, transparentBase = false }: Props) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-0 bg-sky-300" />}>
      <WeatherBackgroundInner weatherCode={weatherCode} isDay={isDay} transparentBase={transparentBase} />
    </Suspense>
  );
}

function WeatherBackgroundInner({ weatherCode, isDay, transparentBase = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  // Dev-override: ?wx=<scenario> forceert een weersituatie voor visuele tests.
  const override = resolveWxScenario(searchParams?.get(WX_QUERY_KEY));
  const effectiveCode = override ? override.code : weatherCode;
  const effectiveIsDay = override ? override.isDay : isDay;
  const theme = getWeatherTheme(effectiveCode, effectiveIsDay);

  useEffect(() => setMounted(true), []);

  const showClouds = effectiveCode >= 1 && effectiveCode <= 86;
  const showRain =
    (effectiveCode >= 51 && effectiveCode <= 67) ||
    (effectiveCode >= 80 && effectiveCode <= 82) ||
    effectiveCode >= 95;
  const showHeavyRain = effectiveCode >= 63 && effectiveCode <= 67;
  const showSnow = effectiveCode >= 71 && effectiveCode <= 77;
  const showStorm = effectiveCode >= 95;
  const showSun = effectiveCode === 0 && effectiveIsDay;
  const showMoon = effectiveCode <= 2 && !effectiveIsDay;
  const showStars = !effectiveIsDay && effectiveCode <= 2;
  const showMist = effectiveCode >= 45 && effectiveCode <= 48;
  const showSmog = effectiveCode === 200;
  const showSaharaDust = effectiveCode === 201;

  const cloudCount =
    effectiveCode === 1 ? 1 :
    effectiveCode === 2 ? 2 :
    effectiveCode === 3 ? 4 :
    3;

  const rainDrops = useMemo(
    () =>
      Array.from({ length: showHeavyRain || showStorm ? 40 : 20 }, (_, i) => ({
        id: i,
        left: (i * 4.85) % 100,
        delay: (i * 0.12) % 2.5,
        duration: showStorm ? 0.4 + (i * 0.01) % 0.3 : 0.5 + (i * 0.02) % 0.5,
        size: 15 + (i * 4) % 15,
      })),
    [showHeavyRain, showStorm]
  );

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: (i * 5.55) % 100,
        delay: (i * 0.3) % 6,
        duration: 4 + (i * 0.2) % 4,
        size: 5 + (i * 0.3) % 6,
      })),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: (i * 7.9) % 100,
        top: (i * 11.3) % 55,
        delay: (i * 0.25) % 3,
        size: 2.5 + (i % 3),
      })),
    []
  );

  const mistBlobs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: (i * 19) % 100,
        top: 8 + (i * 14) % 70,
        width: 220 + (i * 50) % 180,
        height: 110 + (i * 30) % 100,
        duration: 22 + (i * 5) % 18,
        delay: -(i * 4),
      })),
    []
  );

  const dustParticles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        top: (i * 13.3) % 100,
        delay: -(i * 0.7),
        duration: 24 + (i * 1.4) % 18,
        size: 3 + (i * 0.45) % 5,
      })),
    []
  );

  return (
    <>
      {!transparentBase && (
        <motion.div
          className="fixed inset-0 z-0"
          style={{
            background: `${horizonGlow(effectiveCode, effectiveIsDay)}, linear-gradient(176deg, ${theme.bg1} 0%, ${theme.bg2} 100%)`,
            transition: "background 1.2s ease-in-out",
          }}
        />
      )}

      {/* Atmospheric haze — subtiele radial sheen voor depth */}
      <div className="ambient-haze" aria-hidden />

      <div className="fixed inset-0 z-[1] overflow-hidden pointer-events-none">
        <AnimatePresence>
          {showSun && (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="sun-glow"
            >
              <div className="sun-rays" aria-hidden />
              <div className="sun-core" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSmog && (
            <motion.div
              key="smog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="smog-haze"
              aria-hidden
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSaharaDust && (
            <motion.div
              key="sahara"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute inset-0"
            >
              <div className="sahara-overlay" aria-hidden />
              {dustParticles.map((d) => (
                <div
                  key={d.id}
                  className="dust-particle"
                  style={{
                    top: `${d.top}%`,
                    width: d.size,
                    height: d.size,
                    animationDuration: `${d.duration}s`,
                    animationDelay: `${d.delay}s`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMist && (
            <motion.div
              key="mist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5 }}
              className="absolute inset-0"
            >
              {mistBlobs.map((m) => (
                <div
                  key={m.id}
                  className="mist-blob"
                  style={{
                    left: `${m.left}%`,
                    top: `${m.top}%`,
                    width: m.width,
                    height: m.height,
                    animationDuration: `${m.duration}s`,
                    animationDelay: `${m.delay}s`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMoon && (
            <motion.div 
              key="moon"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="moon-glow"
              style={{ top: "10%", opacity: 1, transform: 'translateY(0)' }} 
            >
              <div className="moon-core" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStars && (
            <motion.div
              key="stars"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{ opacity: 1 }}
            >
              {stars.map((s) => (
                <motion.div
                  key={s.id}
                  className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.size,
                    height: s.size,
                  }}
                  animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 3 + (s.id % 2),
                    repeat: Infinity,
                    delay: s.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showClouds && (
            <motion.div 
              key="clouds"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{ opacity: 1 }}
            >
              {Array.from({ length: cloudCount }, (_, i) => (
                <div
                  key={i}
                  className={`cloud-shape cloud-${i + 1}`}
                  style={{
                    opacity: effectiveCode <= 2 ? 0.2 : effectiveCode === 3 ? 0.35 : 0.25,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRain && (
            <motion.div
              key="rain"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{ opacity: 1 }}
            >
              {rainDrops.map((d) => (
                <div
                  key={d.id}
                  className="rain-drop"
                  style={{
                    left: `${d.left}%`,
                    animationDelay: `${d.delay}s`,
                    animationDuration: `${d.duration}s`,
                    height: d.size,
                    background: showStorm ? "linear-gradient(transparent, rgba(200, 220, 255, 0.8))" : undefined
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSnow && (
            <motion.div
              key="snow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              <div className="frost-edge" aria-hidden />
              {snowFlakes.map((s) => (
                <div
                  key={s.id}
                  className="snow-flake"
                  style={{
                    left: `${s.left}%`,
                    animationDelay: `${s.delay}s`,
                    animationDuration: `${s.duration}s`,
                    width: s.size,
                    height: s.size,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStorm && (
            <motion.div
              key="storm-flash-and-bolts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {/* Ambient bliksemflits — subtiel, niet schreeuwerig over content */}
              <motion.div
                className="absolute inset-0 bg-white z-40 mix-blend-soft-light pointer-events-none motion-reduce:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0, 0.3, 0, 0, 0, 0, 0, 0] }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  times: [0, 0.006, 0.015, 0.023, 0.031, 0.3, 0.5, 0.7, 0.9, 1],
                }}
              />

              {/* Zigzag bliksem-bolts — 3 instanties, staggered */}
              {[1, 2, 3].map((i) => (
                <svg
                  key={`bolt-${i}`}
                  className={`lightning-bolt lightning-bolt-${i}`}
                  width="42"
                  height="140"
                  viewBox="0 0 42 140"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M24 0 L8 58 L20 58 L4 140 L30 70 L20 70 L26 0 Z"
                    fill="#ffffff"
                  />
                </svg>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
