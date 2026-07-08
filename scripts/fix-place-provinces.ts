/**
 * Provincie-fix voor plaatsdata (handmatig: npx tsx scripts/fix-place-provinces.ts).
 *
 * Tweetrapsaanpak, omdat de gegeneraliseerde CBS-grenzen alleen als signaal
 * dienen (zie validate-place-provinces.ts):
 *   1. Point-in-polygon tegen PDOK-provinciegrenzen flagt kandidaten.
 *   2. Elke kandidaat wordt geverifieerd via de PDOK Locatieserver reverse
 *      geocoder. afstand == 0 betekent: het punt ligt ín die BAG-woonplaats,
 *      dus provincienaam is gezaghebbend → provincie wordt gecorrigeerd.
 *      afstand > 2 km betekent: het punt ligt niet op NL-land (buitenland of
 *      open zee) → entry wordt verwijderd. Alles ertussen (kuststrook,
 *      water) blijft staan en wordt gelogd voor handmatige controle.
 *
 * Herschrijft src/lib/places.json en src/lib/koos-nl-camping-places.generated.ts.
 * Curated venues (nl-venues.ts) en KOOS-plaatsen (places-data.ts) worden alleen
 * gerapporteerd — die zijn klein genoeg om met de hand te fixen.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { placeSlug } from "../src/lib/places-data";

const PDOK_WFS =
  "https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0" +
  "?request=GetFeature&service=WFS&version=2.0.0" +
  "&typeNames=gebiedsindelingen:provincie_gegeneraliseerd" +
  "&outputFormat=application/json&srsName=EPSG:4326";

const REVERSE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse";

const NL_PROVINCE_SLUGS = new Set([
  "groningen", "friesland", "drenthe", "overijssel", "flevoland", "gelderland",
  "utrecht", "noord-holland", "zuid-holland", "zeeland", "noord-brabant", "limburg",
]);

// BAG-provincienamen (Locatieserver) → route-slugs.
const PROVINCIENAAM_TO_SLUG: Record<string, string> = {
  "Groningen": "groningen",
  "Fryslân": "friesland",
  "Friesland": "friesland",
  "Drenthe": "drenthe",
  "Overijssel": "overijssel",
  "Flevoland": "flevoland",
  "Gelderland": "gelderland",
  "Utrecht": "utrecht",
  "Noord-Holland": "noord-holland",
  "Zuid-Holland": "zuid-holland",
  "Zeeland": "zeeland",
  "Noord-Brabant": "noord-brabant",
  "Limburg": "limburg",
};

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

interface RawPlace {
  name: string;
  province: string;
  lat: number;
  lon: number;
  slug?: string;
  [key: string]: unknown;
}

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

function normalizeName(statnaam: string): string {
  return statnaam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

interface ReverseResult {
  provincie: string | null; // route-slug, alleen bij afstand === 0
  afstand: number | null;   // null = API-fout
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseResult> {
  const url = `${REVERSE_URL}?lat=${lat}&lon=${lon}&type=woonplaats&rows=1&fl=provincienaam,afstand`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        response: { docs: { provincienaam?: string; afstand?: number }[] };
      };
      const doc = json.response.docs[0];
      if (!doc) return { provincie: null, afstand: Infinity };
      const afstand = doc.afstand ?? Infinity;
      const provincie =
        afstand === 0 && doc.provincienaam
          ? PROVINCIENAAM_TO_SLUG[doc.provincienaam] ?? null
          : null;
      return { provincie, afstand };
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return { provincie: null, afstand: null };
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

interface Decision {
  action: "fix" | "delete" | "keep-manual" | "keep-agrees" | "error";
  newProvince?: string;
  afstand?: number | null;
}

async function decide(place: RawPlace, pipProvince: string | null): Promise<Decision> {
  const rev = await reverseGeocode(place.lat, place.lon);
  if (rev.afstand === null) return { action: "error" };
  if (rev.afstand === 0 && rev.provincie) {
    if (rev.provincie === place.province) return { action: "keep-agrees" };
    return { action: "fix", newProvince: rev.provincie, afstand: 0 };
  }
  if (rev.afstand > 2000) return { action: "delete", afstand: rev.afstand };
  // Kuststrook/water binnen 2 km van een NL-woonplaats: claimed provincie
  // laten staan tenzij de PIP een duidelijke andere provincie aanwijst én we
  // geen woonplaats-bevestiging hebben — dat is handwerk.
  void pipProvince;
  return { action: "keep-manual", afstand: rev.afstand };
}

async function main() {
  console.log("PDOK-provinciegrenzen laden...");
  const res = await fetch(PDOK_WFS);
  if (!res.ok) throw new Error(`PDOK WFS ${res.status}`);
  const geo = (await res.json()) as {
    features: { properties: { statnaam: string }; geometry: { type: string; coordinates: unknown } }[];
  };
  const provinces = geo.features.map((f) => ({
    slug: NAME_TO_SLUG[normalizeName(f.properties.statnaam)],
    polygons: (f.geometry.type === "Polygon"
      ? [f.geometry.coordinates as Ring[]]
      : (f.geometry.coordinates as Ring[][])),
  }));
  const locate = (lon: number, lat: number): string | null => {
    for (const prov of provinces) {
      for (const polygon of prov.polygons) {
        if (inPolygon(lon, lat, polygon)) return prov.slug;
      }
    }
    return null;
  };

  const flagged = (p: RawPlace): boolean => {
    const actual = locate(p.lon, p.lat);
    return actual !== p.province; // ook null (buiten polygonen) telt als geflagd
  };

  const stats = { fixed: 0, deleted: 0, manual: 0, agrees: 0, errors: 0 };
  const manualList: string[] = [];
  const deletedList: string[] = [];
  const applyDecisions = async (places: RawPlace[], label: string): Promise<RawPlace[]> => {
    const candidates = places.filter((p) => NL_PROVINCE_SLUGS.has(p.province) && flagged(p));
    console.log(`${label}: ${candidates.length} geflagde plaatsen, verifiëren via Locatieserver...`);
    const decisions = new Map<RawPlace, Decision>();
    await mapConcurrent(candidates, 6, async (p, i) => {
      if (i > 0 && i % 250 === 0) console.log(`  ...${i}/${candidates.length}`);
      decisions.set(p, await decide(p, locate(p.lon, p.lat)));
    });
    const out: RawPlace[] = [];
    for (const p of places) {
      const d = decisions.get(p);
      if (!d) { out.push(p); continue; }
      const url = `/weer/${p.province}/${p.slug || placeSlug(p.name)}`;
      switch (d.action) {
        case "fix":
          stats.fixed++;
          out.push({ ...p, province: d.newProvince! });
          break;
        case "delete":
          stats.deleted++;
          deletedList.push(`${url} (${Math.round(d.afstand!)}m van NL-woonplaats)`);
          break;
        case "keep-manual":
          stats.manual++;
          manualList.push(`${url} (afstand ${Math.round(d.afstand!)}m)`);
          out.push(p);
          break;
        case "keep-agrees":
          stats.agrees++;
          out.push(p);
          break;
        case "error":
          stats.errors++;
          manualList.push(`${url} (Locatieserver-fout)`);
          out.push(p);
          break;
      }
    }
    return out;
  };

  // --- places.json ---
  const placesPath = path.join(__dirname, "../src/lib/places.json");
  const placesRaw: RawPlace[] = JSON.parse(fs.readFileSync(placesPath, "utf8"));
  const placesFixed = await applyDecisions(placesRaw, "places.json");
  fs.writeFileSync(placesPath, JSON.stringify(placesFixed, null, 2) + "\n", "utf8");

  // --- koos-nl-camping-places.generated.ts ---
  const campingPath = path.join(__dirname, "../src/lib/koos-nl-camping-places.generated.ts");
  const campingSrc = fs.readFileSync(campingPath, "utf8");
  const arrayStart = campingSrc.indexOf("= [");
  const arrayEnd = campingSrc.lastIndexOf("];");
  const campingData: RawPlace[] = JSON.parse(campingSrc.slice(arrayStart + 2, arrayEnd + 1));
  const campingFixed = await applyDecisions(campingData, "koos-nl-camping-places.generated.ts");
  fs.writeFileSync(
    campingPath,
    campingSrc.slice(0, arrayStart) + "= " + JSON.stringify(campingFixed, null, 2) + ";\n",
    "utf8",
  );

  // --- curated bestanden: alleen rapporteren ---
  const { NL_VENUE_PLACES } = await import("../src/lib/nl-venues");
  const venueFlagged = (NL_VENUE_PLACES as RawPlace[]).filter((p) => NL_PROVINCE_SLUGS.has(p.province) && flagged(p));
  for (const p of venueFlagged) {
    const d = await decide(p, locate(p.lon, p.lat));
    console.log(`VENUE HANDMATIG: ${p.name} (${p.province}) -> ${d.action}${d.newProvince ? " " + d.newProvince : ""}${d.afstand != null ? ` (afstand ${Math.round(d.afstand)}m)` : ""}`);
  }

  console.log("");
  console.log(`Gefixt: ${stats.fixed} | Verwijderd: ${stats.deleted} | PIP vals alarm (reverse bevestigt claim): ${stats.agrees} | Handmatig nakijken: ${stats.manual} | API-fouten: ${stats.errors}`);
  if (deletedList.length) {
    console.log("\nVerwijderd (niet op NL-land):");
    for (const line of deletedList) console.log(`  ${line}`);
  }
  if (manualList.length) {
    console.log("\nHandmatig nakijken (kuststrook/water/API-fout):");
    for (const line of manualList.slice(0, 60)) console.log(`  ${line}`);
    if (manualList.length > 60) console.log(`  ... en ${manualList.length - 60} meer`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
