/**
 * Provincie-validatie voor plaatspagina's (handmatig: npx tsx scripts/validate-place-provinces.ts).
 *
 * Toetst elke sitemap-plaats (NL_PLACES na de sitemap-filters) met point-in-polygon
 * tegen de officiële CBS-provinciegrenzen (PDOK gebiedsindelingen, gegeneraliseerd).
 * Gegeneraliseerde grenzen wijken tot enkele honderden meters af: plaatsen vlak op
 * een provinciegrens of aan de kust kunnen als vals-positief verschijnen — de lijst
 * is een onderzoekslijst, geen automatische fix.
 */

import { NL_PLACES, placeRouteSlug, type Place } from "../src/lib/places-data";

const PDOK_WFS =
  "https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0" +
  "?request=GetFeature&service=WFS&version=2.0.0" +
  "&typeNames=gebiedsindelingen:provincie_gegeneraliseerd" +
  "&outputFormat=application/json&srsName=EPSG:4326";

const NAME_TO_SLUG: Record<string, string> = {
  groningen: "groningen",
  fryslan: "friesland",
  drenthe: "drenthe",
  overijssel: "overijssel",
  flevoland: "flevoland",
  gelderland: "gelderland",
  utrecht: "utrecht",
  "noord-holland": "noord-holland",
  "zuid-holland": "zuid-holland",
  zeeland: "zeeland",
  "noord-brabant": "noord-brabant",
  limburg: "limburg",
};

type Ring = [number, number][];

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(lon: number, lat: number, polygon: Ring[]): boolean {
  if (!inRing(lon, lat, polygon[0])) return false;
  for (let k = 1; k < polygon.length; k++) {
    if (inRing(lon, lat, polygon[k])) return false;
  }
  return true;
}

// Zelfde geldigheidfilters als isSitemapPlace() in sitemap-data.ts.
function isSitemapPlace(p: Place): boolean {
  if (p.name.length > 60) return false;
  const slug = placeRouteSlug(p);
  return Boolean(slug) && !slug.includes("--");
}

function normalizeName(statnaam: string): string {
  return statnaam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

async function main() {
  const res = await fetch(PDOK_WFS);
  if (!res.ok) throw new Error(`PDOK WFS ${res.status}`);
  const geo = (await res.json()) as {
    features: { properties: { statnaam: string }; geometry: { type: string; coordinates: unknown } }[];
  };

  const provinces = geo.features.map((f) => {
    const slug = NAME_TO_SLUG[normalizeName(f.properties.statnaam)];
    const polygons: Ring[][] =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates as Ring[]]
        : (f.geometry.coordinates as Ring[][]);
    return { slug, polygons };
  });

  const locate = (lon: number, lat: number): string | null => {
    for (const prov of provinces) {
      for (const polygon of prov.polygons) {
        if (inPolygon(lon, lat, polygon)) return prov.slug;
      }
    }
    return null;
  };

  const mismatches: { url: string; claimed: string; actual: string }[] = [];
  const outside: { url: string; claimed: string }[] = [];
  let checked = 0;

  for (const place of NL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    checked++;
    const actual = locate(place.lon, place.lat);
    const url = `/weer/${place.province}/${placeRouteSlug(place)}`;
    if (actual === null) {
      outside.push({ url, claimed: place.province });
    } else if (actual !== place.province) {
      mismatches.push({ url, claimed: place.province, actual });
    }
  }

  console.log(`Gecontroleerd: ${checked} plaatsen`);
  console.log(`Verkeerde provincie: ${mismatches.length}`);
  console.log(`Buiten NL-polygonen (kust/grens, handmatig nakijken): ${outside.length}`);
  console.log("");
  for (const m of mismatches) {
    console.log(`MISMATCH ${m.url} -> hoort in ${m.actual}`);
  }
  if (outside.length) {
    console.log("");
    for (const o of outside.slice(0, 40)) console.log(`BUITEN ${o.url}`);
    if (outside.length > 40) console.log(`... en ${outside.length - 40} meer`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
