/**
 * Dag-POI's voor GPS-locatieherkenning. Doel: "ik ben bij Walibi" → toon
 * "Walibi", maar alleen als je er écht bent (binnen een kleine straal). Zo
 * krijg je nooit een POI die 2 minuten verderop ligt — dan wint de woonplaats.
 *
 * De pretparken/dierentuinen/zwembaden/stranden komen uit OSM
 * (scripts/import-osm-nl-pois.ts). Campings doen mee zodat "op de camping" óók
 * de campingnaam toont, en niet de buur-camping.
 */
import { NL_POI_PLACES } from "./nl-poi-places.generated";
import { KOOS_NL_CAMPING_PLACES } from "./koos-nl-camping-places.generated";
import { distanceBetween } from "./types";

export type PoiCategory = "pretpark" | "dierentuin" | "zwembad" | "zwempark" | "strand" | "camping";

export interface PoiPlace {
  name: string;
  province: string;
  lat: number;
  lon: number;
  slug: string;
  category: PoiCategory;
}

/**
 * Hoe dichtbij je moet zijn voordat we de POI-naam tonen i.p.v. de woonplaats.
 * Grote terreinen (pretparken) krijgen een ruimere straal dan een los zwembad.
 */
const RADIUS_KM: Record<PoiCategory, number> = {
  pretpark: 1.8,
  dierentuin: 1.2,
  strand: 1.0,
  zwempark: 0.8,
  zwembad: 0.4,
  camping: 0.6,
};

interface GatePoi {
  name: string;
  lat: number;
  lon: number;
  category: PoiCategory;
}

const GATE_POOL: GatePoi[] = [
  ...NL_POI_PLACES,
  ...KOOS_NL_CAMPING_PLACES.map((p) => ({
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    category: "camping" as const,
  })),
];

/**
 * Geeft de POI-naam terug als de coördinaten binnen de straal van een bekende
 * POI vallen — anders null (dan val je terug op de woonplaats). Bij meerdere
 * treffers wint de dichtstbijzijnde.
 */
export function nearestPoiName(lat: number, lon: number): string | null {
  let best: GatePoi | null = null;
  let bestDist = Infinity;
  for (const p of GATE_POOL) {
    const d = distanceBetween(lat, lon, p.lat, p.lon);
    if (d <= RADIUS_KM[p.category] && d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best ? best.name : null;
}
