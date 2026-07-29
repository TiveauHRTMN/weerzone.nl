import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "../../src/domain/countries/packs/dominican-republic";

describe("dominicanRepublicPack", () => {
  it("covers all required flagship, standard and basic regions", () => {
    const byCoverage = Object.groupBy(
      dominicanRepublicPack.regions,
      (region) => region.coverageLevel,
    );
    expect(byCoverage.FLAGSHIP?.map((region) => region.id)).toEqual([
      "do-punta-cana",
      "do-santo-domingo",
      "do-samana",
    ]);
    expect(byCoverage.STANDARD).toHaveLength(4);
    expect(byCoverage.BASIC?.length).toBeGreaterThanOrEqual(5);
  });

  it("has unique identifiers and valid region/cluster references", () => {
    const regionIds = dominicanRepublicPack.regions.map((region) => region.id);
    const clusterIds = dominicanRepublicPack.destinationClusters.map((cluster) => cluster.id);
    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(new Set(clusterIds).size).toBe(clusterIds.length);

    for (const cluster of dominicanRepublicPack.destinationClusters) {
      expect(regionIds).toContain(cluster.regionId);
      expect(cluster.countryId).toBe(dominicanRepublicPack.country.id);
    }
    for (const region of dominicanRepublicPack.regions) {
      for (const highlight of region.previewHighlights) {
        if (highlight.destinationClusterId) expect(clusterIds).toContain(highlight.destinationClusterId);
      }
    }
  });

  it("is explicitly marked as serializable seed data", () => {
    expect(dominicanRepublicPack.sourceCoverage.isSeedData).toBe(true);
    expect(dominicanRepublicPack.regions.every((region) => region.previewHighlights.length > 0)).toBe(true);
    expect(() => JSON.stringify(dominicanRepublicPack)).not.toThrow();
  });
});
