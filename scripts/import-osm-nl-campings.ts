import fs from "node:fs";
import path from "node:path";

type Province =
  | "groningen"
  | "friesland"
  | "drenthe"
  | "overijssel"
  | "flevoland"
  | "gelderland"
  | "utrecht"
  | "noord-holland"
  | "zuid-holland"
  | "zeeland"
  | "noord-brabant"
  | "limburg";

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface GeneratedPlace {
  name: string;
  province: Province;
  lat: number;
  lon: number;
  slug?: string;
  character: "coastal" | "inland" | "highland";
}

const PROVINCE_BOUNDS: Record<Province, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  groningen: { minLat: 53.05, maxLat: 53.62, minLon: 6.2, maxLon: 7.25 },
  friesland: { minLat: 52.75, maxLat: 53.55, minLon: 4.9, maxLon: 6.4 },
  drenthe: { minLat: 52.6, maxLat: 53.1, minLon: 6.1, maxLon: 7.1 },
  overijssel: { minLat: 52.15, maxLat: 52.85, minLon: 5.75, maxLon: 7.1 },
  flevoland: { minLat: 52.2, maxLat: 52.8, minLon: 5.0, maxLon: 5.95 },
  gelderland: { minLat: 51.75, maxLat: 52.55, minLon: 5.15, maxLon: 6.9 },
  utrecht: { minLat: 51.92, maxLat: 52.33, minLon: 4.75, maxLon: 5.65 },
  "noord-holland": { minLat: 52.15, maxLat: 53.25, minLon: 4.35, maxLon: 5.35 },
  "zuid-holland": { minLat: 51.68, maxLat: 52.4, minLon: 3.75, maxLon: 5.12 },
  zeeland: { minLat: 51.18, maxLat: 51.82, minLon: 3.25, maxLon: 4.3 },
  "noord-brabant": { minLat: 51.2, maxLat: 51.88, minLon: 4.15, maxLon: 6.08 },
  limburg: { minLat: 50.7, maxLat: 51.78, minLon: 5.55, maxLon: 6.25 },
};

function provinceFor(lat: number, lon: number): Province | undefined {
  // Wadden special cases before broad mainland boxes.
  if (lat >= 53 && lat <= 53.2 && lon >= 4.65 && lon <= 4.95) return "noord-holland";
  if (lat >= 53 && lat <= 53.55 && lon >= 4.95 && lon <= 6.25) return "friesland";
  if (lat >= 53.35 && lat <= 53.62 && lon > 6.25) return "groningen";

  for (const [province, bounds] of Object.entries(PROVINCE_BOUNDS) as Array<[Province, typeof PROVINCE_BOUNDS[Province]]>) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
      return province;
    }
  }
  return undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(rawName: string, tourism?: string): string {
  const name = rawName.replace(/\s+/g, " ").trim();
  const lower = name.toLowerCase();
  if (/(camping|kampeer|camper|vakantiepark|recreatiepark|holiday park|buitenplaats)/.test(lower)) {
    return name;
  }
  if (tourism === "caravan_site") return `Camperplaats ${name}`;
  if (tourism === "holiday_park") return `Vakantiepark ${name}`;
  return `Camping ${name}`;
}

function characterFor(lat: number, lon: number): GeneratedPlace["character"] {
  if (lat > 52.7 || lon < 4.35 || lon < 4.8 || (lat < 51.85 && lon < 4.25)) return "coastal";
  if (lat < 51.15 || (lat < 51.55 && lon > 5.65)) return "highland";
  return "inland";
}

function asciiJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/[^\x00-\x7F]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(4, "0");
    return `\\u${code}`;
  });
}

async function main() {
  const query = `
    [out:json][timeout:240];
    area["ISO3166-1"="NL"][admin_level=2]->.nl;
    (
      node["tourism"~"^(camp_site|caravan_site|holiday_park)$"](area.nl);
      way["tourism"~"^(camp_site|caravan_site|holiday_park)$"](area.nl);
      relation["tourism"~"^(camp_site|caravan_site|holiday_park)$"](area.nl);
    );
    out center tags;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "WEERZONE-Koos/1.0",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    throw new Error(`Overpass failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { elements?: OsmElement[] };
  const elements = data.elements ?? [];
  const seen = new Set<string>();
  const places: GeneratedPlace[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    if (!tags.name) continue;

    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") continue;

    const province = provinceFor(lat, lon);
    if (!province) continue;

    const name = normalizeName(tags.name, tags.tourism);
    const baseSlug = slugify(name);
    if (!baseSlug) continue;

    let slug = baseSlug;
    const key = `${province}/${slug}`;
    if (seen.has(key)) {
      slug = `${baseSlug}-${element.type}-${element.id}`;
    }
    seen.add(`${province}/${slug}`);

    places.push({
      name,
      province,
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      slug,
      character: characterFor(lat, lon),
    });
  }

  places.sort((a, b) => {
    if (a.province !== b.province) return a.province.localeCompare(b.province);
    return a.name.localeCompare(b.name);
  });

  const outPath = path.join(process.cwd(), "src", "lib", "koos-nl-camping-places.generated.ts");
  const body = [
    'import type { Place } from "./places-data";',
    "",
    "// Generated by scripts/import-osm-nl-campings.ts from OpenStreetMap Overpass.",
    "// Source tags: tourism=camp_site|caravan_site|holiday_park within NL.",
    `export const KOOS_NL_CAMPING_PLACES: Place[] = ${asciiJson(places)};`,
    "",
  ].join("\n");

  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Generated ${places.length} camping/holiday park places at ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
