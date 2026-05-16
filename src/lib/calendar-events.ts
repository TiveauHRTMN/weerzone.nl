/**
 * Kalender-events voor seizoens-overlays op de achtergrond.
 * Auto-detect op datum + locale. Via ?cal=<key> ook handmatig te
 * forceren in dev/preview.
 */

import type { Locale } from "@/config/locales";

export type EventKey = "kingsday" | "christmas" | "newyear";

export interface CalendarEvent {
  key: EventKey;
  label: string;
  isActive: (date: Date, locale: Locale) => boolean;
}

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    key: "kingsday",
    label: "🟠 Koningsdag",
    // 26 + 27 april — Koningsnacht & Koningsdag — alleen NL
    isActive: (date, locale) => {
      if (locale !== "nl") return false;
      return date.getMonth() === 3 && (date.getDate() === 26 || date.getDate() === 27);
    },
  },
  {
    key: "christmas",
    label: "🎄 Kerstmis",
    // Kerstavond + Eerste + Tweede Kerstdag
    isActive: (date) =>
      date.getMonth() === 11 && date.getDate() >= 24 && date.getDate() <= 26,
  },
  {
    key: "newyear",
    label: "🎆 Oud & Nieuw",
    // 31 dec + 1 jan
    isActive: (date) =>
      (date.getMonth() === 11 && date.getDate() === 31) ||
      (date.getMonth() === 0 && date.getDate() === 1),
  },
];

const EVENT_BY_KEY: Record<string, CalendarEvent> = Object.fromEntries(
  CALENDAR_EVENTS.map((e) => [e.key, e]),
);

export function resolveCalendarEvent(key: string | null | undefined): CalendarEvent | null {
  if (!key) return null;
  if (key === "off") return null;
  return EVENT_BY_KEY[key] ?? null;
}

export function getActiveCalendarEvent(date: Date, locale: Locale): CalendarEvent | null {
  for (const event of CALENDAR_EVENTS) {
    if (event.isActive(date, locale)) return event;
  }
  return null;
}

export const CAL_QUERY_KEY = "cal";
