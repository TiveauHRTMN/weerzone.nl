/**
 * Vaste lat/lon-bounding box waarin de KNMI-radar-PNG wordt gerenderd.
 * Gedeeld tussen de server-render (knmi-radar-render) en de client-kaart
 * (KnmiRadarMap) zodat de ImageOverlay exact uitgelijnd is. Geen server-only,
 * zodat de client dit ook mag importeren.
 */
export const RADAR_BOUNDS = {
  south: 49.0,
  north: 55.8,
  west: 1.3,
  east: 9.8,
} as const;

export type RadarBounds = typeof RADAR_BOUNDS;
