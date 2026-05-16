"use client";

import Image from "next/image";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CAL_QUERY_KEY,
  getActiveCalendarEvent,
  resolveCalendarEvent,
} from "@/lib/calendar-events";
import { detectLocale } from "@/config/locales";

// Pill-kleur per event. Default valt terug op --wz-blue.
const KINGSDAY_PILL = "linear-gradient(135deg, #ff8c00 0%, #ff6a00 100%)";
const CHRISTMAS_PILL = "linear-gradient(135deg, #166534 0%, #15803d 50%, #14532d 100%)";

interface Props {
  /** Als gegeven, wrap het logo in een <a>. Pass `null` om geen link te renderen
   *  (handig wanneer een ouder al een Link/anchor om de logo heen heeft staan,
   *  anders krijg je geneste anchors = invalide HTML). */
  href?: string | null;
  pillClassName?: string;
  height?: number;
  ariaLabel?: string;
}

export default function WzLogo({
  href = "/",
  pillClassName = "",
  height = 20,
  ariaLabel = "Weerzone — naar home",
}: Props) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const locale = detectLocale(pathname);

  // Zelfde resolution-logica als CalendarEventOverlay: ?cal=off → uit,
  // ?cal=<key> → forceer, anders auto-detect op datum + locale.
  const queryValue = searchParams?.get(CAL_QUERY_KEY) ?? null;
  const auto = useMemo(() => getActiveCalendarEvent(new Date(), locale), [locale]);
  const override = resolveCalendarEvent(queryValue);
  const event = queryValue === "off" ? null : override ?? auto;

  const pillBg =
    event?.key === "kingsday"
      ? KINGSDAY_PILL
      : event?.key === "christmas"
        ? CHRISTMAS_PILL
        : "var(--wz-blue)";

  const inner = (
    <Image
      src="/brand/weerzone-logo.png"
      alt="Weerzone"
      width={Math.round(height * 4.26)}
      height={height}
      priority
      style={{ height, width: "auto", display: "block" }}
    />
  );

  const className = `inline-flex items-center rounded-[10px] px-3 py-1.5 transition-all duration-500 ${pillClassName}`;
  const pillStyle = { background: pillBg };

  if (href === null) {
    return (
      <span className={className} style={pillStyle}>
        {inner}
      </span>
    );
  }
  return (
    <a href={href} className={className} style={pillStyle} aria-label={ariaLabel}>
      {inner}
    </a>
  );
}
