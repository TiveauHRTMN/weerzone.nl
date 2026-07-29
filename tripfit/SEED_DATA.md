# Seed data

Seed data makes the complete development/demo flow work without external APIs. It is explicit, traceable and replaceable; it must never be presented as a live provider observation.

## Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:seed` requires an explicit valid PostgreSQL `DATABASE_URL` or `DIRECT_URL`. The seed is idempotent and upserts stable country, region, interest and pricing records.

## Slice 1 database seed

The initial seed contains:

- Dominican Republic country metadata;
- 10 tourism regions across flagship, standard and basic coverage;
- all 14 supported interests;
- three flagship preview/activity exemplars;
- a recurring Samaná humpback-whale season window;
- the five configurable Trip Pass duration tiers;
- source records marked `SEED_FALLBACK`;
- `isSeedData = true` on editorial placeholders.

The checked-in country pack used by anonymous preview provides richer route context and highlights without requiring a database connection.

## Coverage roadmap

Slice 1 proves structure and preview value; it does not falsely claim that the full activity catalog is verified. Slice 3 expands and verifies at least:

- Punta Cana / Bávaro: 30 activities, 20 food spots, 10 beaches, 8 shopping and 10 practical locations;
- Santo Domingo: 30 activities, 20 food spots, 10 historical, 8 shopping and 10 practical locations;
- Samaná / Las Terrenas: 30 activities plus whale, Los Haitises, El Limón, beaches, boats, food and culture depth;
- 10–15 core activities per standard region;
- 5–10 core activities per basic region.

Counts are quality floors, not a reason to generate thin duplicates.

## Verification policy

Every catalog record needs source identifiers, verification time, confidence and coverage level. Editorial review distinguishes:

- official;
- locally verified;
- current;
- historical;
- indicative;
- AI summary.

AI-generated descriptions cannot upgrade source authority or verification time. A stale or unverified record remains marked as such in database and UI.

## Idempotency and replacement

Stable codes/slugs are used for upsert keys. Re-running the seed updates owned seed fields and never deletes non-seed editorial data. Replacing a seed record with verified data clears `isSeedData` through an explicit editorial/import workflow; it is not inferred from a successful provider response.
