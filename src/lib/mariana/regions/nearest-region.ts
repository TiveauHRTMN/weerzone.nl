/**
 * Mariana NL — nearest Tesla-regio.
 *
 * Oracle's gate is landelijk; Tesla draait per mesoschaal-regio. Wanneer Mariana
 * (per-locatie) de convectieve baan activeert, draait ze Tesla voor de regio die
 * het dichtst bij de locatie ligt. Simpele equirectangular-afstand volstaat op
 * NL-schaal — geen externe geo-dep nodig.
 */

import { TESLA_REGIONS, type TeslaRegion } from "@/lib/mariana/tesla/regions";

/** Benaderde afstand (km) tussen twee punten, goed genoeg op NL-schaal. */
function approxDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x = toRad(lon2 - lon1) * Math.cos(toRad((lat1 + lat2) / 2));
  const y = toRad(lat2 - lat1);
  return Math.sqrt(x * x + y * y) * R;
}

/** Dichtstbijzijnde Tesla-mesoschaal-regio bij een locatie. */
export function nearestTeslaRegion(lat: number, lon: number): TeslaRegion {
  let best = TESLA_REGIONS[0];
  let bestDist = Infinity;
  for (const region of TESLA_REGIONS) {
    const d = approxDistanceKm(lat, lon, region.lat, region.lon);
    if (d < bestDist) {
      bestDist = d;
      best = region;
    }
  }
  return best;
}
