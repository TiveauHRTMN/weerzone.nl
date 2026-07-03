/** Mariana Studio — standaard TikTok-caption per slide (bewerkbaar in de UI). */
import type { StudioDay } from "./types";
import type { StudioSlot } from "./slots";

const HASHTAGS = "#weer #weerzone #weerbericht #nederland";

export function defaultCaption(day: StudioDay, slot: StudioSlot): string {
  let body: string;
  switch (slot) {
    case "slide1":
      body = `Dagverwachting. ${day.slide1.intro}`;
      break;
    case "slide2":
      body = `Actueel weer — ${day.slide2.subtitel}.`;
      break;
    case "slide3":
      body = `Vandaag & morgen. ${day.slide3.morgen.alinea}`;
      break;
    case "slide4":
      body = day.slide4 ? `${day.slide4.titel}. ${day.slide4.intro}` : "Heads-up.";
      break;
  }
  return `${body.trim()}\n\n${HASHTAGS}`;
}

/**
 * X-variant van de caption: max 280 gewogen tekens. X weegt codepoints t/m
 * U+10FF als 1 en alles daarboven (emoji, …) als 2. Knip op woordgrens.
 */
const X_MAX = 280;

function xWeight(ch: string): number {
  return (ch.codePointAt(0) ?? 0) <= 0x10ff ? 1 : 2;
}

export function xCaption(caption: string): string {
  const t = caption.trim();
  let total = 0;
  for (const ch of t) total += xWeight(ch);
  if (total <= X_MAX) return t;

  let out = "";
  let n = 0;
  for (const ch of t) {
    const w = xWeight(ch);
    if (n + w > X_MAX - 2) break; // ruimte voor "…" (U+2026 weegt 2)
    out += ch;
    n += w;
  }
  const lastSpace = out.lastIndexOf(" ");
  if (lastSpace > out.length / 2) out = out.slice(0, lastSpace);
  return `${out.trimEnd()}…`;
}
