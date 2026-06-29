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
