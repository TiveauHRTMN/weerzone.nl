# Data model

The production schema is defined in `prisma/schema.prisma`; the checked-in migration is the deployable database contract. PostgreSQL on Supabase is the target datastore.

## Main aggregates

### Country pack

`Country` owns national context and source-coverage metadata. `Region` records the normalized slug, aliases, position and `FLAGSHIP`/`STANDARD`/`BASIC` depth. `DestinationCluster` supports places inside a region without turning display names into foreign keys.

Country-pack content is identified by stable string codes in seed input. Database IDs remain opaque. Every seeded record carries `isSeedData = true` so editorial/live records can be distinguished and replaced safely.

### Activity catalog

`Activity` stores normalized facts, never recommendation order. Categories and tags are PostgreSQL arrays; provider-dependent structured values such as weather sensitivity and opening hours are JSON until their rule engines require stronger relational constraints.

`SeasonWindow` supports recurring month/day windows and fixed calendar periods. `Source` and `ActivitySource` preserve provenance, verification time, confidence and fallback status. Activity score facts and commercial offers remain separate.

### Living trip

`Trip` is the aggregate root for an authenticated saved trip. It owns:

- inclusive arrival and departure calendar dates;
- an ordered list of `TripStop` rows;
- normalized `Traveler` rows, including child age at departure;
- selected `TripInterest` values;
- saved activities, recommendation history and Trip Pass state.

Trip dates use PostgreSQL `date`, not timestamps. Stops are ordered by a unique `(tripId, position)` pair. Application validation additionally enforces containment, continuity and non-overlap.

`userId` is a Supabase UUID and remains nullable only to support the preview-to-account handoff. Slice 2 must never expose a persisted trip without an authenticated ownership predicate.

### Recommendation history

`Recommendation` is an immutable decision snapshot for an activity and date. It stores all eight subscores, the final total, ranking version, explanation factors, applied weights and context facts. This makes a past recommendation reproducible even after providers or weights change.

`RecommendationOutcome` is append-only. Dismissal, skip and cancellation reasons are preserved instead of overwriting recommendation state.

### Commercial and analytics data

`TripPass` records status, paid price and validity for one trip. `TripPassPriceTier` makes duration pricing configurable.

`AffiliateOffer` is related to an activity but is not part of its score. `AffiliateClick` captures the actual outbound destination. Sponsored status is a presentation/compliance fact, never a ranking input.

`AnalyticsEvent` uses a constrained event-name enum and optional structured properties. Sensitive trip or child data must not be copied into free-form properties.

`TravelSignal` is the Country Pulse foundation and separates impact class, official status, applicable time window and source.

## Deletion policy

- Country and core region references use `Restrict` to prevent accidental catalog loss.
- Child records wholly owned by a trip or activity use `Cascade`.
- Optional context such as a destination cluster or activity on a click uses `SetNull` where historical evidence must remain.
- User erasure in Slice 2 must delete or irreversibly anonymize personal trip data while retaining only legally justified aggregate commerce records.

## Database access

`src/db/client.ts` is the only Prisma composition boundary. It returns no client when `DATABASE_URL` is absent, allowing deterministic seed/mock operation. Feature code consumes repository ports rather than importing the generated Prisma client.

Migrations require an explicit valid `DIRECT_URL` or `DATABASE_URL`; there is no implicit production fallback.
