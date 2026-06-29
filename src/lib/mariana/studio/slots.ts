/** Mariana Studio — slot-metadata, gedeeld door client, caption-builder en nudge-cron. */
export type StudioSlot = "slide1" | "slide2" | "slide3" | "slide4";

export const STUDIO_SLOTS: { key: StudioSlot; label: string; time: string }[] = [
  { key: "slide1", label: "Dagverwachting", time: "08:00" },
  { key: "slide2", label: "Actueel", time: "14:00" },
  { key: "slide3", label: "Vandaag & Morgen", time: "20:00" },
  { key: "slide4", label: "Heads-up", time: "22:00" },
];

export function isStudioSlot(v: string): v is StudioSlot {
  return v === "slide1" || v === "slide2" || v === "slide3" || v === "slide4";
}
