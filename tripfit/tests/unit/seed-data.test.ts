import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { INTEREST_IDS } from "@/domain/trips/interests";
import { buildClusterRows, buildInterestRows, buildRegionRows } from "@/db/seed-data";

describe("seed data derives from the country pack", () => {
  it("seeds every pack region under its pack id and slug", () => {
    const rows = buildRegionRows(dominicanRepublicPack);

    expect(rows).toHaveLength(dominicanRepublicPack.regions.length);
    expect(rows.map((row) => row.id)).toEqual(dominicanRepublicPack.regions.map((region) => region.id));
    expect(rows.map((row) => row.slug)).toEqual(dominicanRepublicPack.regions.map((region) => region.slug));
    for (const row of rows) {
      expect(row.summary.length).toBeGreaterThan(0);
      expect(Number.isFinite(row.centerLatitude)).toBe(true);
      expect(row.sortOrder).toBeGreaterThan(0);
    }
  });

  it("seeds every pack destination cluster under its pack id, linked to a pack region", () => {
    const regionIds = new Set(dominicanRepublicPack.regions.map((region) => region.id));
    const rows = buildClusterRows(dominicanRepublicPack);

    expect(rows).toHaveLength(dominicanRepublicPack.destinationClusters.length);
    for (const row of rows) {
      expect(regionIds.has(row.regionId)).toBe(true);
    }
    expect(rows.map((row) => row.id)).toEqual(dominicanRepublicPack.destinationClusters.map((cluster) => cluster.id));
  });

  it("seeds interests with codes that exactly match the domain interest ids", () => {
    const rows = buildInterestRows();

    expect(rows.map((row) => row.code)).toEqual([...INTEREST_IDS]);
    for (const row of rows) {
      expect(row.id).toBe(`interest-${row.code}`);
      expect(row.labelNl.length).toBeGreaterThan(0);
    }
  });
});
