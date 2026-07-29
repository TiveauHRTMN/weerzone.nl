# Provider architecture

TripFit works without external credentials. Seed/mock adapters are deterministic first-class providers; live providers can replace them behind the same ports.

## Ports

The intended provider contracts are:

- `WeatherProvider` — observed, forecast, subseasonal and climate-normal facts;
- `CurrencyProvider` — normalized exchange-rate observations;
- `PlacesProvider` — place identity, opening and location facts;
- `NewsProvider` — candidate country signals before travel-impact classification;
- `TravelAdvisoryProvider` — official advisory documents and update state;
- `GeocodingProvider` — normalized coordinates and destination-cluster resolution;
- `ActivityProvider` — editorial or partner activity facts, never final rank.

Ports return domain-facing values and provider metadata, not vendor response objects:

```ts
interface ProviderMetadata {
  source: string;
  retrievedAt: string;
  lastVerifiedAt: string;
  confidence: number;
  rawReference?: string;
  fallbackStatus: "LIVE" | "CACHED" | "SEED_FALLBACK" | "UNAVAILABLE";
}
```

## Selection and fallback

Adapters are selected in a server-only composition root. A typical chain is live provider → last valid cached observation → seed/climate baseline → explicit unavailable state. A fallback may lower confidence but may not pretend to be live.

Provider failure is data, not a page crash. Use cases decide whether a fact is optional, whether a lower-confidence alternative is safe, or whether a recommendation must be withheld.

## Normalization rules

- Preserve the vendor timestamp and TripFit retrieval timestamp separately.
- Convert units and categories at the adapter boundary.
- Retain a non-secret raw reference for audit/debugging; do not expose entire payloads to the browser.
- Never combine observations from different time horizons as if they have equal certainty.
- Official advisories remain visibly separate from news summaries.
- Geocoding may propose a cluster but cannot silently change a stored route stop.

## Caching

Provider observations are cached by provider, location, horizon and issued-at time. Stale data is returned only with `CACHED` fallback status and an appropriate confidence reduction. Revalidation policy belongs to the adapter/application layer, not React components.

## Adding a provider

1. implement the narrow port;
2. add contract tests using captured, redacted fixtures;
3. map every field to a normalized unit/category;
4. define retry, timeout, rate-limit and stale-data behavior;
5. expose source and verification information in the view model;
6. place activation behind a feature flag;
7. exercise live failure and seed fallback before enabling production traffic.
