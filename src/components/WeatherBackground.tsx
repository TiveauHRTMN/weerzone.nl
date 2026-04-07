"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  weatherCode: number;
  isDay: boolean;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function getWeatherTheme(code: number, isDay: boolean) {
  if (!isDay) {
    if (code === 0) return { bg1: "#0b1026", bg2: "#162050" };
    if (code >= 95) return { bg1: "#10141e", bg2: "#1e2438" };
    return { bg1: "#0f1828", bg2: "#1e3048" };
  }
  if (code === 0) return { bg1: "#3a9ae8", bg2: "#7ec4f6" };
  if (code <= 2) return { bg1: "#5aa8e0", bg2: "#94c8ec" };
  if (code === 3) return { bg1: "#7898ae", bg2: "#a0b8c8" };
  if (code <= 48) return { bg1: "#8898a5", bg2: "#b0bec5" };
  if (code <= 57) return { bg1: "#607888", bg2: "#8098a8" };
  if (code <= 67) return { bg1: "#4a6474", bg2: "#6a8898" };
  if (code <= 77) return { bg1: "#a8b8c8", bg2: "#ccd8e2" };
  if (code <= 82) return { bg1: "#455868", bg2: "#607888" };
  if (code <= 86) return { bg1: "#98aab8", bg2: "#bcc8d4" };
  if (code >= 95) return { bg1: "#2a3444", bg2: "#3e4e60" };
  return { bg1: "#5a98c8", bg2: "#88b8dc" };
}

export { getWeatherTheme };

export default function WeatherBackground({ weatherCode, isDay }: Props) {
  const [mounted, setMounted] = useState(false);
  const theme = getWeatherTheme(weatherCode, isDay);

  useEffect(() => setMounted(true), []);

  const showClouds = weatherCode >= 1 && weatherCode <= 86;
  const showRain =
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82);
  const showHeavyRain = weatherCode >= 63 && weatherCode <= 67;
  const showSnow = weatherCode >= 71 && weatherCode <= 77;
  const showStorm = weatherCode >= 95;
  const showSun = weatherCode === 0 && isDay;
  const showStars = !isDay;

  const cloudCount = weatherCode <= 2 ? 3 : weatherCode === 3 ? 5 : 4;

  const rainDrops = useMemo(
    () =>
      Array.from({ length: showHeavyRain ? 60 : 35 }, (_, i) => ({
        id: i,
        left: (i * 2.85) % 100,
        delay: (i * 0.07) % 2.5,
        duration: 0.4 + (i * 0.013) % 0.5,
        size: 10 + (i * 3) % 12,
      })),
    [showHeavyRain]
  );

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: (i * 3.33) % 100,
        delay: (i * 0.2) % 6,
        duration: 4 + (i * 0.15) % 4,
        size: 3 + (i * 0.2) % 5,
      })),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: (i * 2.5) % 100,
        top: (i * 7.3) % 60,
        delay: (i * 0.15) % 3,
        size: 1 + (i % 3),
      })),
    []
  );

  return (
    <>
      {/* Sky gradient */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{ background: `linear-gradient(170deg, ${theme.bg1} 0%, ${theme.bg2} 100%)` }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Animated elements */}
      <div className="fixed inset-0 z-[1] overflow-hidden pointer-events-none">
        {/* Sun */}
        {showSun && (
          <div className="sun-glow">
            <div className="sun-core" />
          </div>
        )}

        {/* Stars */}
        {showStars &&
          mounted &&
          stars.map((s) => (
            <div
              key={s.id}
              className="star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}

        {/* Clouds */}
        {showClouds &&
          Array.from({ length: cloudCount }, (_, i) => (
            <div
              key={i}
              className={`cloud-shape cloud-${i + 1}`}
              style={{
                opacity: weatherCode <= 2 ? 0.25 : weatherCode === 3 ? 0.45 : 0.35,
              }}
            />
          ))}

        {/* Rain */}
        {(showRain || showStorm) &&
          mounted &&
          rainDrops.map((d) => (
            <div
              key={d.id}
              className="rain-drop"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.duration}s`,
                height: d.size,
              }}
            />
          ))}

        {/* Snow */}
        {showSnow &&
          mounted &&
          snowFlakes.map((s) => (
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

        {/* Storm lightning flash */}
        {showStorm && <div className="lightning-flash" />}
      </div>
    </>
  );
}
