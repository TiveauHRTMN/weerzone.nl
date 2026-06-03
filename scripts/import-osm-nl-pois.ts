import fs from "node:fs";
import path from "node:path";

/**
 * Harvest publieke dag-POI's uit OpenStreetMap (Overpass) zodat GPS "ik ben bij
 * Walibi" → "Walibi" kan tonen. Categorieën: pretparken, dierentuinen, zwembaden,
 * stranden. Schrijft src/lib/nl-poi-places.generated.ts.
 *
 * Run: npx tsx scripts/import-osm-nl-pois.ts
 */

type Province =
  | "groningen" | "friesland" | "drenthe" | "overijssel" | "flevoland"
  | "gelderland" | "utrecht" | "noord-holland" | "zuid-holland" | "zeeland"
  | "noord-brabant" | "limburg";

type PoiCategory = "pretpark" | "dierentuin" | "zwembad" | "zwempark" | "strand";

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface GeneratedPoi {
  name: string;
  province: Province;
  lat: number;
  lon: number;
  slug: string;
  category: PoiCategory;
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
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryFor(tags: Record<string, string>): PoiCategory | null {
  if (tags.tourism === "theme_park") return "pretpark";
  if (tags.tourism === "zoo") return "dierentuin";
  if (tags.leisure === "water_park") return "zwempark"; // recreatie-/subtropisch bad: echt uitje
  if (tags.leisure === "swimming_pool") return "zwembad"; // gewoon bad: alleen voor GPS-herkenning
  if (tags.natural === "beach") return "strand";
  return null;
}

function asciiJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/[^\x00-\x7F]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(4, "0");
    return `\\u${code}`;
  });
}

async function main() {
  const query = `
    [out:json][timeout:300];
    area["ISO3166-1"="NL"][admin_level=2]->.nl;
    (
      nwr["tourism"="theme_park"](area.nl);
      nwr["tourism"="zoo"](area.nl);
      nwr["leisure"="water_park"](area.nl);
      nwr["leisure"="swimming_pool"](area.nl);
      nwr["natural"="beach"](area.nl);
    );
    out center tags;
  `;

  const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ];
  let response: Response | null = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "WEERZONE-POI/1.0",
        },
        body: new URLSearchParams({ data: query }),
      });
      if (r.ok) {
        response = r;
        break;
      }
      console.warn(`Overpass ${endpoint} → ${r.status} ${r.statusText}, volgende mirror…`);
    } catch (e) {
      console.warn(`Overpass ${endpoint} faalde (${(e as Error).message}), volgende mirror…`);
    }
  }

  if (!response) {
    throw new Error("Alle Overpass-mirrors faalden");
  }

  const data = (await response.json()) as { elements?: OsmElement[] };
  const elements = data.elements ?? [];
  const seen = new Set<string>();
  const pois: GeneratedPoi[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    if (!tags.name) continue;
    // Privé-zwembaden e.d. niet meenemen.
    if (tags.access === "private" || tags.access === "no") continue;

    const category = categoryFor(tags);
    if (!category) continue;

    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") continue;

    const province = provinceFor(lat, lon);
    if (!province) continue;

    const name = tags.name.replace(/\s+/g, " ").trim();
    const baseSlug = slugify(name);
    if (!baseSlug) continue;

    let slug = baseSlug;
    const key = `${province}/${slug}`;
    if (seen.has(key)) {
      slug = `${baseSlug}-${element.type}-${element.id}`;
    }
    seen.add(`${province}/${slug}`);

    pois.push({
      name,
      province,
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      slug,
      category,
    });
  }

  pois.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.province !== b.province) return a.province.localeCompare(b.province);
    return a.name.localeCompare(b.name);
  });

  const counts = pois.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const outPath = path.join(process.cwd(), "src", "lib", "nl-poi-places.generated.ts");
  const body = [
    'import type { PoiPlace } from "./poi-places";',
    "",
    "// Generated by scripts/import-osm-nl-pois.ts from OpenStreetMap Overpass.",
    "// Source tags: tourism=theme_park|zoo, leisure=water_park|swimming_pool, natural=beach (NL).",
    `export const NL_POI_PLACES: PoiPlace[] = ${asciiJson(pois)};`,
    "",
  ].join("\n");

  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Generated ${pois.length} POIs at ${outPath}`);
  console.log("Per categorie:", counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
