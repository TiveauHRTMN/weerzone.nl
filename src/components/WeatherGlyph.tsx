import type { SVGProps } from "react";

/**
 * Bespoke dunne-lijn weerglyphs — één samenhangend set dat rijmt met de
 * met-de-hand-getekende lucht-achtergrond (zelfde stroke-discipline). Vervangt de
 * OS-emoji in de kaarten: monochroom op `currentColor`, zodat elke glyph de inkt-
 * of agent-accentkleur van z'n kaart aanneemt. Geen kleur-clipart meer.
 */

export type GlyphName =
  | "clear-day"
  | "clear-night"
  | "partly-day"
  | "partly-night"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  // metrics
  | "wind"
  | "droplet"
  | "thermometer"
  | "uv"
  | "pollen"
  | "target"
  | "alert";

/** Open-Meteo WMO-code → glyph (dag/nacht-bewust). */
export function glyphFromCode(code: number, isDay = true): GlyphName {
  if (code === 0) return isDay ? "clear-day" : "clear-night";
  if (code === 1 || code === 2) return isDay ? "partly-day" : "partly-night";
  if (code === 3) return "cloud";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  if (code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "partly-day";
}

// Padden in een 24×24 grid, stroke 2, ronde uiteinden — Lucide-achtige geometrie.
const PATHS: Record<GlyphName, React.ReactNode> = {
  "clear-day": (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  "clear-night": <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  "partly-day": (
    <>
      <path d="M12 2v1.5M5.6 5.6l1 1M2.5 12H4M18.4 5.6l-1 1" />
      <path d="M15.9 12.6A4 4 0 0 0 10 8.5" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </>
  ),
  "partly-night": (
    <>
      <path d="M10.1 9a6 6 0 0 1 5.9-5 4.24 4.24 0 0 0 6 6 6 6 0 0 1-3 5.2" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </>
  ),
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  fog: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M16 17H7M17 21H9" />
    </>
  ),
  drizzle: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M8 19v1M12 21v1M16 19v1" />
    </>
  ),
  rain: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M8 19v3M12 19v3M16 19v3" />
    </>
  ),
  snow: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M8 19h.01M8 22h.01M12 20h.01M12 23h.01M16 19h.01M16 22h.01" />
    </>
  ),
  storm: (
    <>
      <path d="M6 16.3A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97" />
      <path d="m13 12-3 5h4l-3 5" />
    </>
  ),
  wind: (
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 1.79 4.25H2M9.8 4.4A2 2 0 1 1 11 8H2" />
  ),
  droplet: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />,
  thermometer: <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  uv: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3v1.5M12 19.5V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.5M19.5 12H21M6 18l-1.1 1.1M19.1 4.9 18 6" />
    </>
  ),
  pollen: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 9.4V5m0 14v-4.4M14.6 12H19M5 12h4.4M13.8 10.2l2.5-2.5M7.7 16.3l2.5-2.5M14.3 13.7l2 2M7.7 7.7l2 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

interface Props extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: GlyphName;
  size?: number;
}

export default function WeatherGlyph({ name, size = 24, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
