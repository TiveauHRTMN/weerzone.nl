# Deterministic ranking engine

The ranking engine is introduced in Slice 3 and lives in `src/domain/ranking`. This document is its contract; UI and AI summaries may not bypass it.

## Base weights

| Factor | Base weight |
| --- | ---: |
| Season relevance | 25% |
| Weather suitability | 20% |
| Traveler and age fit | 15% |
| Distance and logistics | 15% |
| Interests | 10% |
| Opening and availability | 5% |
| Uniqueness | 5% |
| Value | 5% |

Weights sum to one and are versioned. Activity-type profiles can redistribute them: boat trips emphasize wind and sea state, walks emphasize heat/rain/terrain, museums emphasize opening and rain value, and restaurants emphasize opening, distance and profile fit.

## Pipeline

```text
facts + trip context
  -> hard eligibility gates
  -> normalized factor scores (0..100)
  -> activity-type weight profile
  -> weighted total
  -> deterministic tie breakers
  -> explanation factors
  -> immutable recommendation snapshot
```

Hard gates run before scoring. Examples include unavailable season windows, minimum age, a closed venue with no relevant future opening, an official closure or sea conditions above a safety threshold. A low score is not a substitute for a safety exclusion.

## Output

```ts
interface RecommendationScore {
  total: number;
  seasonScore: number;
  weatherScore: number;
  travelerFitScore: number;
  logisticsScore: number;
  interestScore: number;
  availabilityScore: number;
  uniquenessScore: number;
  valueScore: number;
  explanationFactors: string[];
}
```

Every execution also records ranking version, exact weights, evaluation date, provider observation references and relevant activity version.

## Determinism

Given identical normalized inputs, evaluation time and configuration version, ranking and explanations must be identical. Ties use stable keys such as logistics, local authenticity and activity ID; random order is forbidden.

The engine never reads the current clock directly. The caller supplies an evaluation date. Demo modes therefore use the real engine with a different clock, not special rankings.

## AI boundary

AI may turn stored explanation factors into concise natural language. It may not:

- add or remove an eligibility gate;
- change a factor score or total;
- invent weather, season, opening or travel-time facts;
- place a sponsored offer ahead of an organic result;
- hide uncertainty or fallback state.

If AI summarization is unavailable, the structured explanation factors remain the production fallback.

## Commercial isolation

Affiliate price may inform the explicit value factor only when equivalent non-affiliate price data is treated the same way. Commission and tracking availability are prohibited features. Sponsored inventory is rendered in a separately labeled placement.

## Tests

The engine requires unit coverage for boundaries, missing facts, hard gates, each activity-type profile, stable tie ordering, explanation factors and serialized snapshots. Golden fixtures cover the four demo dates for the main Dominican Republic scenario.
