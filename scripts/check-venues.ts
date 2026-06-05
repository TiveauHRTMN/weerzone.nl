import assert from "node:assert";
import { VENUE_TYPES, venueH1, venueMetaTitle, venueSchemaType, venuePromptFragment } from "../src/lib/venue-content";
import { NL_PLACES, placeRouteSlug, findPlace } from "../src/lib/places-data";
import { buildNLSitemap } from "../src/lib/sitemap-data";
import { schemaCityWeatherPage } from "../src/lib/schema";

// All four types configured
assert.deepStrictEqual([...VENUE_TYPES].sort(), ["attractiepark", "camping", "dierentuin", "zwembad"]);

// Type-aware H1 differs from the generic city H1
assert.strictEqual(venueH1("Efteling", "attractiepark"), "Weer bij Efteling");
assert.strictEqual(venueH1("Amsterdam", undefined), "Weer in Amsterdam");

// Schema @type mapping (all valid schema.org types)
assert.strictEqual(venueSchemaType("attractiepark"), "AmusementPark");
assert.strictEqual(venueSchemaType("dierentuin"), "Zoo");
assert.strictEqual(venueSchemaType("zwembad"), "SportsActivityLocation");
assert.strictEqual(venueSchemaType("camping"), "Campground");

// Prompt fragment + meta title are non-empty and mention the venue
assert.ok(venuePromptFragment("Toverland", "attractiepark").includes("Toverland"));
assert.ok(venueMetaTitle("Artis", "dierentuin").includes("Artis"));

console.log("OK: venue-content helpers");

const venues = NL_PLACES.filter((p) => p.venueType);
assert.ok(venues.length >= 15, `expected >=15 venues, got ${venues.length}`);

const seen = new Set<string>();
for (const v of venues) {
  const slug = placeRouteSlug(v);
  assert.ok(slug && !slug.includes("--"), `bad slug for ${v.name}: ${slug}`);
  const key = `${v.province}/${slug}`;
  assert.ok(!seen.has(key), `duplicate venue route: ${key}`);
  seen.add(key);
  assert.ok(findPlace(v.province, slug), `findPlace failed for ${key}`);
  assert.ok(Math.abs(v.lat) <= 54 && Math.abs(v.lon) <= 8, `coord out of NL range: ${v.name}`);
}
console.log(`OK: ${venues.length} venues resolve uniquely`);

// Task 3: sitemap priority 0.7 for venues
const xml = buildNLSitemap();
const efteling = NL_PLACES.find((p) => p.slug === "efteling");
assert.ok(efteling, "efteling missing from NL_PLACES");
assert.ok(xml.includes(`/weer/${efteling!.province}/efteling`), "efteling not in sitemap");
const locOrder = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const eftelingIdx = locOrder.findIndex((u) => u.endsWith("/efteling"));
assert.ok(eftelingIdx > -1 && eftelingIdx < locOrder.length / 2, "venue should sort in the high-priority half");
console.log("OK: venues sort high in sitemap (priority 0.7)");

// Task 4: schema @type per venueType
const venueLd: any = schemaCityWeatherPage({ placeName: "Efteling", lat: 51.6499, lon: 5.0481, province: "noord-brabant", slug: "efteling", venueType: "attractiepark" });
assert.strictEqual(venueLd.about["@type"], "AmusementPark");
const cityLd: any = schemaCityWeatherPage({ placeName: "Amsterdam", lat: 52.366, lon: 4.9, province: "noord-holland", slug: "amsterdam" });
assert.strictEqual(cityLd.about["@type"], "City");
console.log("OK: schema @type maps by venueType");;
