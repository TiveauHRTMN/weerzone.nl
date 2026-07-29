import { describe, expect, it } from "vitest";

import { validateSeoQuality } from "@/features/seo/quality";

const complete = {
  introduction: "Een unieke lokale introductie ".repeat(8),
  localContentBlocks: ["Lokale verdieping ".repeat(8), "Andere lokale context ".repeat(8)],
  recommendationCount: 5,
  hasWeatherOrSeasonContext: true,
  internalLinkCount: 3,
  hasDestinationMetadata: true,
  lastVerifiedAt: "2026-07-26",
  hasPrimaryAction: true,
  hasEmptyPlaceholders: false,
  duplicateSimilarity: 0.2,
};

describe("SEO quality gate", () => {
  it("allows complete, distinct content", () => {
    expect(validateSeoQuality(complete)).toEqual({
      indexable: true,
      score: 100,
      missingRequirements: [],
    });
  });

  it("forces thin pages to noindex", () => {
    const result = validateSeoQuality({
      ...complete,
      recommendationCount: 2,
      hasEmptyPlaceholders: true,
    });
    expect(result.indexable).toBe(false);
    expect(result.missingRequirements).toHaveLength(2);
  });
});

