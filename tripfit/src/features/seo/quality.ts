export type SeoPageEvidence = {
  introduction: string;
  localContentBlocks: readonly string[];
  recommendationCount: number;
  hasWeatherOrSeasonContext: boolean;
  internalLinkCount: number;
  hasDestinationMetadata: boolean;
  lastVerifiedAt?: string;
  hasPrimaryAction: boolean;
  hasEmptyPlaceholders: boolean;
  duplicateSimilarity?: number;
};

export type SeoQualityResult = {
  indexable: boolean;
  score: number;
  missingRequirements: string[];
};

export function validateSeoQuality(evidence: SeoPageEvidence): SeoQualityResult {
  const checks = [
    [evidence.introduction.trim().length >= 120, "Unieke introductie ontbreekt"],
    [
      evidence.localContentBlocks.filter((block) => block.trim().length >= 100).length >= 2,
      "Onvoldoende lokale inhoud",
    ],
    [evidence.recommendationCount >= 5, "Minimaal vijf relevante aanbevelingen nodig"],
    [evidence.hasWeatherOrSeasonContext, "Weer- of seizoenscontext ontbreekt"],
    [evidence.internalLinkCount >= 3, "Onvoldoende interne links"],
    [evidence.hasDestinationMetadata, "Bestemmingsmetadata ontbreekt"],
    [Boolean(evidence.lastVerifiedAt), "Verificatie- of brondatum ontbreekt"],
    [evidence.hasPrimaryAction, "Duidelijke gebruikersactie ontbreekt"],
    [!evidence.hasEmptyPlaceholders, "Pagina bevat lege placeholders"],
    [
      evidence.duplicateSimilarity === undefined || evidence.duplicateSimilarity < 0.8,
      "Pagina lijkt te sterk op andere content",
    ],
  ] as const;
  const missingRequirements = checks
    .filter(([passed]) => !passed)
    .map(([, message]) => message);
  const score = Math.round(
    (checks.filter(([passed]) => passed).length / checks.length) * 100,
  );
  return { indexable: missingRequirements.length === 0, score, missingRequirements };
}

