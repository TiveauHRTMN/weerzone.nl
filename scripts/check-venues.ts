import assert from "node:assert";
import { VENUE_TYPES, venueH1, venueMetaTitle, venueSchemaType, venuePromptFragment } from "../src/lib/venue-content";

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
