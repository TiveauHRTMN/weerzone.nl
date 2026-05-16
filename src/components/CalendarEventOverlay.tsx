"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CAL_QUERY_KEY,
  getActiveCalendarEvent,
  resolveCalendarEvent,
  type CalendarEvent,
} from "@/lib/calendar-events";
import { detectLocale } from "@/config/locales";

// Koningsdag — goud-tinten (gouden particles) ipv NL-driekleur
const KINGSDAY_COLORS = ["#fef3c7", "#fde047", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#ff8c00"];
const XMAS_COLORS = ["#ffd700", "#ff6a3d", "#3ec1d3", "#92e3a9", "#ffffff", "#ff85a1"];
const NEWYEAR_COLORS = ["#ff3b8b", "#ffd21a", "#3ec1d3", "#92e3a9", "#ff6a3d", "#c084fc", "#60a5fa"];

function KingsdayEffect() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: (i * 2.7) % 100,
        delay: (i * 0.25) % 7,
        duration: 4.5 + (i * 0.35) % 5,
        size: 8 + (i * 0.6) % 5,
        color: KINGSDAY_COLORS[i % KINGSDAY_COLORS.length],
        skew: ((i * 11) % 60) - 30,
      })),
    [],
  );
  return (
    <>
      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.45,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            transform: `skewX(${c.skew}deg)`,
          }}
        />
      ))}
    </>
  );
}

function ChristmasEffect() {
  const lights = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: (i * 4.7) % 100,
        color: XMAS_COLORS[i % XMAS_COLORS.length],
        delay: (i * 0.32) % 3,
      })),
    [],
  );
  return (
    <div className="absolute top-0 left-0 right-0 h-16">
      {lights.map((l) => (
        <div
          key={l.id}
          className="xmas-light"
          style={{
            left: `${l.left}%`,
            background: l.color,
            boxShadow: `0 0 12px ${l.color}, 0 0 28px ${l.color}55`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function NewyearEffect() {
  const fireworks = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: 6 + ((i * 17) % 88),
        top: 5 + ((i * 11) % 45),
        color: NEWYEAR_COLORS[i % NEWYEAR_COLORS.length],
        // Spreid de delays evenredig over de 3.6s cycle zodat er continu
        // bursts overlappen — geen rustige momenten meer.
        delay: (i * 0.2) % 3.6,
      })),
    [],
  );
  return (
    <>
      {/* Ambient warm sky-glow die meeflikkert met de bursts */}
      <div className="firework-sky-flash" />

      {fireworks.map((f) => (
        <div
          key={f.id}
          className="firework"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            color: f.color,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function renderEvent(event: CalendarEvent) {
  switch (event.key) {
    case "kingsday":
      return <KingsdayEffect />;
    case "christmas":
      return <ChristmasEffect />;
    case "newyear":
      return <NewyearEffect />;
    default:
      return null;
  }
}

export default function CalendarEventOverlay() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const locale = detectLocale(pathname);

  const queryValue = searchParams?.get(CAL_QUERY_KEY) ?? null;
  // ?cal=off explicit disable, ?cal=<key> forceer specifiek event,
  // anders auto-detect op basis van vandaag + locale.
  const auto = useMemo(() => getActiveCalendarEvent(new Date(), locale), [locale]);
  const override = resolveCalendarEvent(queryValue);
  const event = queryValue === "off" ? null : override ?? auto;

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden" aria-hidden>
      {renderEvent(event)}
    </div>
  );
}
